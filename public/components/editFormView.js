import { STATUS_CODES } from "../core/constants.js";
import { getCaseStagesByWorkflowId } from "../core/workflow.js";
import { initCaseDataEditor, normalizeCaseDataRoot } from "./caseDataEditor.js";
import { initWorkflowAiChat } from "./workflowAiChat.js";

function buildInput(field, record, state, escapeHtml) {
  const value = record?.[field.key] ?? "";

  if (field.type === "status") {
    return `
      <select name="${field.key}" required>
        ${STATUS_CODES.map((status) => `<option value="${status}" ${value === status ? "selected" : ""}>${status}</option>`).join("")}
      </select>
    `;
  }

  if (field.type === "user-select") {
    return `
      <select name="${field.key}" required>
        ${state.referenceData.users.map((user) => `<option value="${user.id}" ${String(value) === String(user.id) ? "selected" : ""}>${user.display_name} (#${user.id})</option>`).join("")}
      </select>
    `;
  }

  if (field.type === "group-select") {
    return `
      <select name="${field.key}" required>
        ${state.referenceData.groups.map((group) => `<option value="${group.id}" ${String(value) === String(group.id) ? "selected" : ""}>${group.group_name} (#${group.id})</option>`).join("")}
      </select>
    `;
  }

  if (field.type === "workflow-select") {
    const activeWorkflows = state.referenceData.workflows.filter((workflow) => workflow.status_code === "ACT");
    return `
      <select name="${field.key}" required>
        ${activeWorkflows.map((workflow) => `<option value="${workflow.id}" ${String(value) === String(workflow.id) ? "selected" : ""}>${escapeHtml(workflow.wf_name)}</option>`).join("")}
      </select>
    `;
  }

  if (field.type === "workflow-readonly") {
    const workflowName = record?.wf_name || "";
    return `<input type="text" value="${escapeHtml(workflowName)}" readonly>`;
  }

  if (field.type === "stage-select") {
    let workflowId = record?.workflow_id;
    if (!workflowId) {
      const activeWorkflows = state.referenceData.workflows.filter((workflow) => workflow.status_code === "ACT");
      workflowId = activeWorkflows[0]?.id || "";
    }
    const stages = getCaseStagesByWorkflowId(state.referenceData, workflowId);
    return `
      <select name="${field.key}" required>
        ${stages.map((stage) => `<option value="${escapeHtml(stage)}" ${stage === String(value) ? "selected" : ""}>${escapeHtml(stage)}</option>`).join("")}
      </select>
    `;
  }

  if (field.type === "case-data-editor") {
    const caseData = normalizeCaseDataRoot(value);
    const initialJson = JSON.stringify(caseData, null, 2);
    return `
      <div class="json-editor" data-case-json-editor>
        <div class="json-editor-switch">
          <button type="button" class="secondary compact active" data-json-mode="simple">Friendly Inputs</button>
          <button type="button" class="secondary compact" data-json-mode="json">JSON Editor</button>
        </div>
        <div class="json-editor-panel" data-json-simple>
          <p class="readonly-note">Nested objects and arrays are shown level-by-level. You can edit leaf values and add/remove object fields or array items. Changes sync to JSON editor.</p>
          <div class="json-tree" data-json-tree></div>
        </div>
        <div class="json-editor-panel hidden" data-json-raw>
          <p class="readonly-note">Edit raw JSON directly.</p>
          <textarea data-case-json-raw rows="14"></textarea>
        </div>
        <textarea name="${field.key}" class="hidden">${escapeHtml(initialJson)}</textarea>
      </div>
    `;
  }

  if (field.type === "json") {
    const jsonValue = value
      ? JSON.stringify(value, null, 2)
      : JSON.stringify(
          {
            name: "",
            description: "",
            stages: ["stage_one", "stage_two"],
            access: {
              stage_one: ["admin"],
              stage_two: ["editor", "viewer"]
            }
          },
          null,
          2
        );
    const textarea = `<textarea name="${field.key}" rows="14" required>${escapeHtml(jsonValue)}</textarea>`;
    if (state.activeModel !== "workflows" || field.key !== "wf_data") {
      return textarea;
    }

    return `
      ${textarea}
      <div class="workflow-ai-chat" data-workflow-ai-chat>
        <div class="workflow-ai-chat__header">
          <strong>Workflow AI Assistant</strong>
          <p>Describe the workflow requirement in natural language. AI will generate/update JSON and write it into Workflow Data.</p>
        </div>
        <div class="workflow-ai-input-wrap">
          <p>Workflow Requirement (Natural Language)</p>
          <textarea data-workflow-ai-input rows="4" placeholder="Example: I need an application review workflow with 4 stages. Stage 1 visible to editor/admin, stage 2 and 3 only admin, final stage admin/viewer."></textarea>
        </div>
        <div class="workflow-ai-actions">
          <button type="button" class="secondary" data-workflow-ai-send>Generate JSON</button>
        </div>
        <p class="readonly-note" data-workflow-ai-helper></p>
      </div>
    `;
  }

  return `<input name="${field.key}" type="${field.type}" value="${escapeHtml(value)}" required>`;
}

export function renderEditFormView({
  state,
  config,
  mode,
  escapeHtml,
  parseJsonInput,
  aiEnabled,
  setStatus,
  onDirtyChange,
  onSubmit,
  onCancel
}) {
  const isCreate = mode === "create";
  const fields = isCreate ? config.createFields : config.editFields;
  const form = document.getElementById("edit-form");

  document.getElementById("edit-title").textContent = isCreate ? `Create ${config.label.slice(0, -1) || config.label}` : `Edit ${config.label.slice(0, -1) || config.label}`;

  form.innerHTML = `
    ${!isCreate && state.selectedRecord ? `<p class="readonly-note">Read-only fields such as ID and audit timestamps remain locked in detail view.</p>` : ""}
    ${state.activeModel === "workflows" ? `<p class="readonly-note workflow-dirty-indicator" data-workflow-dirty-indicator>All changes are saved locally.</p>` : ""}
    ${fields.map((field) => `
      <label>
        ${field.label}
        ${buildInput(field, isCreate ? null : state.selectedRecord, state, escapeHtml)}
      </label>
    `).join("")}
    <div class="form-actions">
      <button type="submit">${isCreate ? "Create" : "Save Changes"}</button>
      <button type="button" id="cancel-form" class="secondary">Cancel</button>
    </div>
  `;

  function buildCurrentSnapshot() {
    const formData = Object.fromEntries(new FormData(form).entries());
    if (state.activeModel === "workflows" && typeof formData.wf_data === "string") {
      formData.wf_data = formData.wf_data.trim();
    }
    return JSON.stringify(formData);
  }

  const initialSnapshot = buildCurrentSnapshot();
  const dirtyIndicator = form.querySelector("[data-workflow-dirty-indicator]");

  function updateDirtyState() {
    const dirty = buildCurrentSnapshot() !== initialSnapshot;
    if (dirtyIndicator) {
      dirtyIndicator.textContent = dirty ? "Unsaved workflow changes." : "All changes are saved locally.";
      dirtyIndicator.classList.toggle("is-dirty", dirty);
    }
    if (state.activeModel === "workflows") {
      const workflowDataInput = form.querySelector('textarea[name="wf_data"]');
      if (workflowDataInput) {
        workflowDataInput.classList.toggle("workflow-json-unsaved", dirty);
      }
    }
    if (typeof onDirtyChange === "function") {
      onDirtyChange(dirty);
    }
  }

  if (state.activeModel === "cases") {
    const workflowSelect = form.querySelector('select[name="workflow_id"]');
    const stageSelect = form.querySelector('select[name="stage_code"]');
    if (workflowSelect && stageSelect) {
      workflowSelect.addEventListener("change", () => {
        const stages = getCaseStagesByWorkflowId(state.referenceData, workflowSelect.value);
        stageSelect.innerHTML = stages
          .map((stage) => `<option value="${escapeHtml(stage)}">${escapeHtml(stage)}</option>`)
          .join("");
      });
    }
  }

  form.onsubmit = async (event) => {
    event.preventDefault();
    const formData = Object.fromEntries(new FormData(form).entries());
    await onSubmit({ isCreate, formData });
  };

  if (state.activeModel === "cases") {
    initCaseDataEditor(form, isCreate ? null : state.selectedRecord?.case_data, {
      parseJsonInput,
      setStatus,
      escapeHtml
    });
  }

  if (state.activeModel === "workflows") {
    initWorkflowAiChat(form, {
      aiEnabled,
      escapeHtml,
      setStatus,
      getPromptText: () => String(form.querySelector("[data-workflow-ai-input]")?.value || ""),
      getDraft: () => {
        const wfDataInput = form.querySelector('textarea[name="wf_data"]');
        let wfData = null;
        if (wfDataInput && wfDataInput.value.trim()) {
          try {
            wfData = parseJsonInput(wfDataInput.value, "Workflow Data");
          } catch (_error) {
            wfData = null;
          }
        }

        return {
          wf_name: String(form.querySelector('input[name="wf_name"]')?.value || "").trim(),
          status_code: String(form.querySelector('select[name="status_code"]')?.value || "").trim().toUpperCase(),
          wf_data: wfData
        };
      },
      onApplyWorkflow: (workflowPayload) => {
        const wfNameInput = form.querySelector('input[name="wf_name"]');
        const statusSelect = form.querySelector('select[name="status_code"]');
        const wfDataInput = form.querySelector('textarea[name="wf_data"]');

        if (wfNameInput) {
          wfNameInput.value = workflowPayload.wf_name || "";
          wfNameInput.dispatchEvent(new Event("input", { bubbles: true }));
        }

        if (statusSelect) {
          statusSelect.value = workflowPayload.status_code || "ACT";
          statusSelect.dispatchEvent(new Event("change", { bubbles: true }));
        }

        if (wfDataInput) {
          wfDataInput.value = JSON.stringify(workflowPayload.wf_data || {}, null, 2);
          wfDataInput.dispatchEvent(new Event("input", { bubbles: true }));
        }

        updateDirtyState();
      }
    });
  }

  form.addEventListener("input", updateDirtyState);
  form.addEventListener("change", updateDirtyState);
  updateDirtyState();

  document.getElementById("cancel-form").addEventListener("click", onCancel);
}
