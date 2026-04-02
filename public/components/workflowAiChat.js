import { apiRequest } from "../core/api.js";

function buildConversationPayload(messages) {
  return messages
    .filter((item) => item.role === "user" || item.role === "assistant")
    .map((item) => ({
      role: item.role,
      content: item.content
    }))
    .slice(-12);
}

export function initWorkflowAiChat(form, deps) {
  const {
    aiEnabled,
    setStatus,
    getDraft,
    getPromptText,
    onApplyWorkflow
  } = deps;

  const container = form.querySelector("[data-workflow-ai-chat]");
  if (!container) {
    return;
  }

  const inputEl = container.querySelector("[data-workflow-ai-input]");
  const sendButton = container.querySelector("[data-workflow-ai-send]");
  const helperEl = container.querySelector("[data-workflow-ai-helper]");
  const messages = [];

  function setRequestState(isBusy) {
    sendButton.disabled = isBusy;
    if (inputEl) {
      inputEl.disabled = isBusy;
    }
    sendButton.textContent = isBusy ? "Generating..." : "Generate JSON";
  }

  function setHelper(message, isError = false) {
    helperEl.textContent = message;
    helperEl.classList.toggle("error-text", isError);
  }

  async function sendPrompt() {
    const prompt = String(getPromptText?.() || "").trim();
    if (!prompt) {
      setHelper("Requirement input is empty. Please describe what workflow you want.", true);
      return;
    }

    messages.push({ role: "user", content: prompt.slice(0, 500) });

    if (!aiEnabled) {
      setHelper("AI is not configured. Continue editing workflow JSON manually.", true);
      return;
    }

    setRequestState(true);
    setHelper("AI is drafting a valid workflow payload...");
    try {
      const result = await apiRequest("/api/ai/workflow-design", {
        method: "POST",
        body: JSON.stringify({
          prompt,
          conversation: buildConversationPayload(messages),
          draft: getDraft()
        })
      });

      onApplyWorkflow(result.workflow);
      const assistantText = String(result.assistant_message || "Generated a workflow payload.");
      messages.push({ role: "assistant", content: assistantText });
      setStatus("AI workflow applied to Workflow Data. Review and save when ready.");
      setHelper(`Generated and applied. AI: ${assistantText}`);
    } catch (error) {
      setHelper(error.message || "AI request failed. Manual editing is still available.", true);
    } finally {
      setRequestState(false);
      if (inputEl) {
        inputEl.focus();
      }
    }
  }

  sendButton.addEventListener("click", async () => {
    await sendPrompt();
  });

  if (inputEl) {
    inputEl.addEventListener("keydown", async (event) => {
      if (event.key !== "Enter" || event.shiftKey) {
        return;
      }
      event.preventDefault();
      await sendPrompt();
    });
  }

  setHelper(aiEnabled
    ? "Submit your requirement. AI will combine requirement + WORKFLOW.md + current workflow data and overwrite Workflow Data JSON."
    : "AI is currently unavailable. Use manual JSON editing.");
}
