import { STATUS_CODES } from "../core/constants.js";
import { getCaseStagesByWorkflowId } from "../core/workflow.js";
import { initCaseDataEditor, normalizeCaseDataRoot } from "./caseDataEditor.js";

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
    return `<textarea name="${field.key}" rows="14" required>${escapeHtml(jsonValue)}</textarea>`;
  }

  return `<input name="${field.key}" type="${field.type}" value="${escapeHtml(value)}" required>`;
}

export function renderEditFormView({
  state,
  config,
  mode,
  escapeHtml,
  parseJsonInput,
  setStatus,
  onSubmit,
  onCancel
}) {
  const isCreate = mode === "create";
  const fields = isCreate ? config.createFields : config.editFields;
  const form = document.getElementById("edit-form");

  document.getElementById("edit-title").textContent = isCreate ? `Create ${config.label.slice(0, -1) || config.label}` : `Edit ${config.label.slice(0, -1) || config.label}`;

  form.innerHTML = `
    ${!isCreate && state.selectedRecord ? `<p class="readonly-note">Read-only fields such as ID and audit timestamps remain locked in detail view.</p>` : ""}
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

  document.getElementById("cancel-form").addEventListener("click", onCancel);
}

