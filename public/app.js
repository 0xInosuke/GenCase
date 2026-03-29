const STATUS_CODES = ["ACT", "INACT", "DEL", "PEND"];

function parseJsonInput(value, fieldLabel) {
  try {
    return JSON.parse(value);
  } catch (_error) {
    throw new Error(`${fieldLabel} format is invalid. Please enter valid JSON.`);
  }
}

const modelConfigs = {
  users: {
    label: "Users",
    endpoint: "/api/users",
    targetType: "user",
    listColumns: [
      { key: "id", label: "ID", sortable: true },
      { key: "display_name", label: "Display Name", sortable: true },
      { key: "status_code", label: "Status Code", sortable: true }
    ],
    detailFields: [
      { key: "id", label: "ID" },
      { key: "user_name", label: "Username" },
      { key: "display_name", label: "Display Name" },
      { key: "status_code", label: "Status Code" },
      { key: "created_at", label: "Created At" },
      { key: "updated_at", label: "Updated At" }
    ],
    createFields: [
      { key: "user_name", label: "Username", type: "text" },
      { key: "display_name", label: "Display Name", type: "text" },
      { key: "user_password", label: "Password", type: "password" },
      { key: "status_code", label: "Status Code", type: "status" }
    ],
    editFields: [
      { key: "display_name", label: "Display Name", type: "text" },
      { key: "user_password", label: "Password", type: "password" },
      { key: "status_code", label: "Status Code", type: "status" }
    ],
    buildCreatePayload(formData) {
      return {
        user_name: formData.user_name,
        display_name: formData.display_name,
        user_password: formData.user_password,
        status_code: formData.status_code
      };
    },
    buildUpdatePayload(currentRecord, formData) {
      return {
        user_name: currentRecord.user_name,
        display_name: formData.display_name,
        user_password: formData.user_password,
        status_code: formData.status_code
      };
    }
  },
  groups: {
    label: "Groups",
    endpoint: "/api/groups",
    targetType: "group",
    listColumns: [
      { key: "id", label: "ID", sortable: true },
      { key: "group_name", label: "Group Name", sortable: true },
      { key: "status_code", label: "Status Code", sortable: true }
    ],
    detailFields: [
      { key: "id", label: "ID" },
      { key: "group_name", label: "Group Name" },
      { key: "status_code", label: "Status Code" },
      { key: "created_at", label: "Created At" },
      { key: "updated_at", label: "Updated At" }
    ],
    createFields: [
      { key: "group_name", label: "Group Name", type: "text" },
      { key: "status_code", label: "Status Code", type: "status" }
    ],
    editFields: [
      { key: "group_name", label: "Group Name", type: "text" },
      { key: "status_code", label: "Status Code", type: "status" }
    ],
    buildCreatePayload(formData) {
      return {
        group_name: formData.group_name,
        status_code: formData.status_code
      };
    },
    buildUpdatePayload(_currentRecord, formData) {
      return {
        group_name: formData.group_name,
        status_code: formData.status_code
      };
    }
  },
  "user-groups": {
    label: "User Groups",
    endpoint: "/api/user-groups",
    targetType: "user_group",
    listColumns: [
      { key: "id", label: "ID", sortable: true },
      { key: "display_name", label: "Display Name", sortable: true },
      { key: "group_name", label: "Group Name", sortable: true },
      { key: "status_code", label: "Status Code", sortable: true }
    ],
    detailFields: [
      { key: "id", label: "ID" },
      { key: "user_id", label: "User ID" },
      { key: "display_name", label: "Display Name" },
      { key: "group_id", label: "Group ID" },
      { key: "group_name", label: "Group Name" },
      { key: "status_code", label: "Status Code" },
      { key: "created_at", label: "Created At" },
      { key: "updated_at", label: "Updated At" }
    ],
    createFields: [
      { key: "user_id", label: "User", type: "user-select" },
      { key: "group_id", label: "Group", type: "group-select" },
      { key: "status_code", label: "Status Code", type: "status" }
    ],
    editFields: [
      { key: "user_id", label: "User", type: "user-select" },
      { key: "group_id", label: "Group", type: "group-select" },
      { key: "status_code", label: "Status Code", type: "status" }
    ],
    buildCreatePayload(formData) {
      return {
        user_id: Number(formData.user_id),
        group_id: Number(formData.group_id),
        status_code: formData.status_code
      };
    },
    buildUpdatePayload(_currentRecord, formData) {
      return {
        user_id: Number(formData.user_id),
        group_id: Number(formData.group_id),
        status_code: formData.status_code
      };
    }
  },
  workflows: {
    label: "Workflows",
    endpoint: "/api/workflows",
    targetType: "workflow",
    listColumns: [
      { key: "id", label: "ID", sortable: true },
      { key: "wf_name", label: "Workflow Name", sortable: true },
      { key: "status_code", label: "Status Code", sortable: true }
    ],
    detailFields: [
      { key: "id", label: "ID" },
      { key: "wf_name", label: "Workflow Name" },
      { key: "status_code", label: "Status Code" },
      { key: "wf_data", label: "Workflow Data" },
      { key: "created_at", label: "Created At" },
      { key: "updated_at", label: "Updated At" }
    ],
    createFields: [
      { key: "wf_name", label: "Workflow Name", type: "text" },
      { key: "status_code", label: "Status Code", type: "status" },
      { key: "wf_data", label: "Workflow Data (JSON)", type: "json" }
    ],
    editFields: [
      { key: "wf_name", label: "Workflow Name", type: "text" },
      { key: "status_code", label: "Status Code", type: "status" },
      { key: "wf_data", label: "Workflow Data (JSON)", type: "json" }
    ],
    buildCreatePayload(formData) {
      return {
        wf_name: formData.wf_name,
        status_code: formData.status_code,
        wf_data: parseJsonInput(formData.wf_data, "Workflow Data")
      };
    },
    buildUpdatePayload(_currentRecord, formData) {
      return {
        wf_name: formData.wf_name,
        status_code: formData.status_code,
        wf_data: parseJsonInput(formData.wf_data, "Workflow Data")
      };
    }
  },
  cases: {
    label: "Cases",
    endpoint: "/api/cases",
    targetType: "case",
    listColumns: [
      { key: "id", label: "ID", sortable: true },
      { key: "case_title", label: "Case Title", sortable: true },
      { key: "wf_name", label: "Workflow", sortable: true },
      { key: "stage_code", label: "Stage", sortable: true }
    ],
    detailFields: [
      { key: "id", label: "ID" },
      { key: "case_title", label: "Case Title" },
      { key: "wf_name", label: "Workflow Name" },
      { key: "stage_code", label: "Stage Code" },
      { key: "created_at", label: "Created At" },
      { key: "updated_at", label: "Updated At" }
    ],
    createFields: [
      { key: "workflow_id", label: "Workflow", type: "workflow-select" },
      { key: "case_title", label: "Case Title", type: "text" },
      { key: "stage_code", label: "Stage Code", type: "stage-select" },
      { key: "case_data", label: "Case Data (JSON)", type: "json" }
    ],
    editFields: [
      { key: "workflow_id", label: "Workflow", type: "workflow-readonly" },
      { key: "case_title", label: "Case Title", type: "text" },
      { key: "stage_code", label: "Stage Code", type: "stage-select" },
      { key: "case_data", label: "Case Data (JSON)", type: "json" }
    ],
    buildCreatePayload(formData) {
      return {
        workflow_id: Number(formData.workflow_id),
        case_title: formData.case_title,
        stage_code: formData.stage_code,
        case_data: parseJsonInput(formData.case_data, "Case Data")
      };
    },
    buildUpdatePayload(_currentRecord, formData) {
      return {
        case_title: formData.case_title,
        stage_code: formData.stage_code,
        case_data: parseJsonInput(formData.case_data, "Case Data")
      };
    }
  }
};

const state = {
  activeModel: "users",
  view: "list",
  records: {
    users: [],
    groups: [],
    "user-groups": [],
    workflows: [],
    cases: []
  },
  pagination: {
    users: { page: 1, page_size: 20, total_pages: 0, total_count: 0 },
    groups: { page: 1, page_size: 20, total_pages: 0, total_count: 0 },
    "user-groups": { page: 1, page_size: 20, total_pages: 0, total_count: 0 },
    workflows: { page: 1, page_size: 20, total_pages: 0, total_count: 0 },
    cases: { page: 1, page_size: 20, total_pages: 0, total_count: 0 }
  },
  search: {
    users: "",
    groups: "",
    "user-groups": "",
    workflows: "",
    cases: ""
  },
  sort: {
    users: { sortBy: "id", sortDir: "asc" },
    groups: { sortBy: "id", sortDir: "asc" },
    "user-groups": { sortBy: "id", sortDir: "asc" },
    workflows: { sortBy: "id", sortDir: "asc" },
    cases: { sortBy: "id", sortDir: "asc" }
  },
  selectedRecord: null,
  caseComments: [],
  auditRecords: [],
  referenceData: {
    users: [],
    groups: [],
    workflows: []
  }
};

function setStatus(message, isError = false) {
  const el = document.getElementById("status-message");
  el.textContent = message;
  el.style.color = isError ? "#b42318" : "#1d1a17";
}

async function apiRequest(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options
  });

  if (response.status === 401) {
    window.location.href = "/login";
    throw new Error("Authentication required.");
  }

  if (response.status === 204) {
    return null;
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Request failed.");
  }

  return data;
}

function getConfig(model = state.activeModel) {
  return modelConfigs[model];
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

function formatInlineValue(value) {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

function formatDetailValue(value) {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }

  return String(value);
}

function formatDateTime(value) {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  return date.toLocaleString();
}

function toggleView(view) {
  state.view = view;
  document.getElementById("list-view").classList.toggle("hidden", view !== "list");
  document.getElementById("detail-view").classList.toggle("hidden", view !== "detail");
  document.getElementById("edit-view").classList.toggle("hidden", view !== "edit");
}

function updateHeader() {
  const config = getConfig();
  document.getElementById("view-title").textContent = config.label;
  document.getElementById("view-label").textContent = state.view === "list" ? "List View" : state.view === "detail" ? "Detail View" : "Edit View";
  document.getElementById("search-input").placeholder = state.activeModel === "cases"
    ? 'Search text or JSON, for example {"owner":"alice"}'
    : "Search records";
  document.querySelectorAll("#model-nav button").forEach((button) => {
    button.classList.toggle("active", button.dataset.model === state.activeModel);
  });
}

function buildListUrl(model) {
  const config = getConfig(model);
  const pagination = state.pagination[model];
  const sort = state.sort[model];
  const search = state.search[model];
  const params = new URLSearchParams({
    page: String(pagination.page),
    page_size: String(pagination.page_size),
    sort_by: sort.sortBy,
    sort_dir: sort.sortDir
  });

  if (search) {
    params.set("search", search);
  }

  return `${config.endpoint}?${params.toString()}`;
}

async function loadList(model = state.activeModel) {
  const result = await apiRequest(buildListUrl(model));
  state.records[model] = result.items;
  state.pagination[model] = result.pagination;
}

async function loadReferences() {
  const [usersResult, groupsResult, workflowsResult] = await Promise.all([
    apiRequest("/api/users?page=1&page_size=100&sort_by=display_name&sort_dir=asc"),
    apiRequest("/api/groups?page=1&page_size=100&sort_by=group_name&sort_dir=asc"),
    apiRequest("/api/workflows?page=1&page_size=100&sort_by=wf_name&sort_dir=asc")
  ]);

  state.referenceData.users = usersResult.items;
  state.referenceData.groups = groupsResult.items;
  state.referenceData.workflows = workflowsResult.items;
}

function getWorkflowById(workflowId) {
  return state.referenceData.workflows.find((item) => Number(item.id) === Number(workflowId)) || null;
}

function getCaseStagesByWorkflowId(workflowId) {
  const workflow = getWorkflowById(workflowId);
  const stages = workflow?.wf_data?.stages;
  if (!Array.isArray(stages)) {
    return [];
  }
  return stages.map((stage) => String(stage).trim()).filter(Boolean);
}

function renderList() {
  const config = getConfig();
  const target = document.getElementById("list-table");
  const rows = state.records[state.activeModel];

  if (rows.length === 0) {
    target.innerHTML = "<p>No records found.</p>";
    return;
  }

  const headers = config.listColumns.map((column) => {
    if (!column.sortable) {
      return `<th>${column.label}</th>`;
    }

    const currentSort = state.sort[state.activeModel];
    const directionMarker = currentSort.sortBy === column.key ? (currentSort.sortDir === "asc" ? " [asc]" : " [desc]") : "";
    return `<th><button type="button" data-sort="${column.key}">${column.label}${directionMarker}</button></th>`;
  }).join("");

  const body = rows.map((row) => `
    <tr data-row-id="${row.id}">
      ${config.listColumns.map((column) => `<td>${escapeHtml(formatInlineValue(row[column.key]))}</td>`).join("")}
    </tr>
  `).join("");

  target.innerHTML = `
    <table>
      <thead><tr>${headers}</tr></thead>
      <tbody>${body}</tbody>
    </table>
  `;

  target.querySelectorAll("[data-sort]").forEach((button) => {
    button.addEventListener("click", async () => {
      const modelSort = state.sort[state.activeModel];
      const sortBy = button.dataset.sort;
      modelSort.sortDir = modelSort.sortBy === sortBy && modelSort.sortDir === "asc" ? "desc" : "asc";
      modelSort.sortBy = sortBy;
      state.pagination[state.activeModel].page = 1;
      await refreshCurrentModel();
    });
  });

  target.querySelectorAll("[data-row-id]").forEach((rowEl) => {
    rowEl.addEventListener("click", async () => {
      await openDetail(Number(rowEl.dataset.rowId));
    });
  });
}

function renderPagination() {
  const pagination = state.pagination[state.activeModel];
  document.getElementById("page-indicator").textContent = pagination.total_pages === 0
    ? "No pages"
    : `Page ${pagination.page} / ${pagination.total_pages} (${pagination.total_count} records)`;
  document.getElementById("prev-page").disabled = pagination.page <= 1;
  document.getElementById("next-page").disabled = pagination.total_pages === 0 || pagination.page >= pagination.total_pages;
}

function renderDetail() {
  const config = getConfig();
  const target = document.getElementById("detail-content");
  document.getElementById("detail-title").textContent = `${config.label} Detail`;

  let html = config.detailFields.map((field) => `
    <div class="detail-item">
      <p>${field.label}</p>
      <strong>${escapeHtml(formatDetailValue(state.selectedRecord?.[field.key]))}</strong>
    </div>
  `).join("");

  if (state.activeModel === "cases") {
    const caseData = state.selectedRecord?.case_data;
    if (caseData && typeof caseData === "object" && !Array.isArray(caseData)) {
      const entries = Object.entries(caseData);
      html += entries.map(([key, value]) => `
        <div class="detail-item">
          <p>${escapeHtml(key)}</p>
          <strong>${escapeHtml(formatDetailValue(value))}</strong>
        </div>
      `).join("");
    }
  }

  target.innerHTML = html;
}

async function loadCaseComments(caseId) {
  state.caseComments = await apiRequest(`/api/comments?case_id=${encodeURIComponent(caseId)}`);
}

function renderCaseComments() {
  const section = document.getElementById("case-comments");
  const list = document.getElementById("case-comments-list");
  if (state.activeModel !== "cases" || !state.selectedRecord) {
    section.classList.add("hidden");
    list.innerHTML = "";
    return;
  }

  section.classList.remove("hidden");
  if (!Array.isArray(state.caseComments) || state.caseComments.length === 0) {
    list.innerHTML = "<p class=\"readonly-note\">No comments yet.</p>";
    return;
  }

  list.innerHTML = state.caseComments.map((comment) => `
    <article class="comment-item">
      <div class="comment-meta">
        <strong>${escapeHtml(comment.display_name || "Unknown User")}</strong>
        <span>${escapeHtml(formatDateTime(comment.created_time))}</span>
      </div>
      <p>${escapeHtml(comment.content || "")}</p>
    </article>
  `).join("");
}

async function loadAuditRecords(targetType, targetId) {
  state.auditRecords = await apiRequest(`/api/audits?target_type=${encodeURIComponent(targetType)}&target_id=${encodeURIComponent(targetId)}`);
}

function renderAuditRecords() {
  const section = document.getElementById("audit-records");
  const list = document.getElementById("audit-records-list");

  if (!state.selectedRecord) {
    section.classList.add("hidden");
    list.innerHTML = "";
    return;
  }

  section.classList.remove("hidden");
  if (!Array.isArray(state.auditRecords) || state.auditRecords.length === 0) {
    list.innerHTML = "<p class=\"readonly-note\">No audit records yet.</p>";
    return;
  }

  list.innerHTML = state.auditRecords.map((audit) => `
    <article class="audit-item">
      <div class="comment-meta">
        <strong>${escapeHtml(audit.display_name || "System")}</strong>
        <span>${escapeHtml(formatDateTime(audit.timestamp))}</span>
      </div>
      <div><strong>${escapeHtml(audit.change_type)}</strong></div>
      <div><span class="readonly-note">Old Value</span><br><code>${escapeHtml(formatDetailValue(audit.old_value))}</code></div>
      <div><span class="readonly-note">New Value</span><br><code>${escapeHtml(formatDetailValue(audit.new_value))}</code></div>
    </article>
  `).join("");
}

function buildInput(field, record) {
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
    const stages = getCaseStagesByWorkflowId(workflowId);
    return `
      <select name="${field.key}" required>
        ${stages.map((stage) => `<option value="${escapeHtml(stage)}" ${stage === String(value) ? "selected" : ""}>${escapeHtml(stage)}</option>`).join("")}
      </select>
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

function renderEditForm(mode) {
  const config = getConfig();
  const isCreate = mode === "create";
  const fields = isCreate ? config.createFields : config.editFields;
  const form = document.getElementById("edit-form");

  document.getElementById("edit-title").textContent = isCreate ? `Create ${config.label.slice(0, -1) || config.label}` : `Edit ${config.label.slice(0, -1) || config.label}`;

  form.innerHTML = `
    ${!isCreate && state.selectedRecord ? `<p class="readonly-note">Read-only fields such as ID and audit timestamps remain locked in detail view.</p>` : ""}
    ${fields.map((field) => `
      <label>
        ${field.label}
        ${buildInput(field, isCreate ? null : state.selectedRecord)}
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
        const stages = getCaseStagesByWorkflowId(workflowSelect.value);
        stageSelect.innerHTML = stages
          .map((stage) => `<option value="${escapeHtml(stage)}">${escapeHtml(stage)}</option>`)
          .join("");
      });
    }
  }

  form.onsubmit = async (event) => {
    event.preventDefault();

    try {
      const formData = Object.fromEntries(new FormData(form).entries());
      const payload = isCreate
        ? config.buildCreatePayload(formData)
        : config.buildUpdatePayload(state.selectedRecord, formData);

      const path = isCreate ? config.endpoint : `${config.endpoint}/${state.selectedRecord.id}`;
      const method = isCreate ? "POST" : "PUT";
      const saved = await apiRequest(path, {
        method,
        body: JSON.stringify(payload)
      });

      state.selectedRecord = saved;
      await refreshCurrentModel();
      if (isCreate) {
        await openDetail(saved.id);
        setStatus(`${config.label.slice(0, -1) || config.label} created.`);
      } else {
        await loadAuditRecords(config.targetType, saved.id);
        renderDetail();
        toggleView("detail");
        renderAuditRecords();
        updateHeader();
        setStatus(`${config.label.slice(0, -1) || config.label} updated.`);
      }
    } catch (error) {
      setStatus(error.message, true);
    }
  };

  document.getElementById("cancel-form").addEventListener("click", () => {
    if (isCreate) {
      toggleView("list");
    } else {
      toggleView("detail");
      renderDetail();
    }
    updateHeader();
  });
}

async function openDetail(id) {
  const config = getConfig();
  state.selectedRecord = await apiRequest(`${config.endpoint}/${id}`);
  await loadAuditRecords(config.targetType, state.selectedRecord.id);
  if (state.activeModel === "cases") {
    await loadCaseComments(state.selectedRecord.id);
  } else {
    state.caseComments = [];
  }
  renderDetail();
  renderCaseComments();
  renderAuditRecords();
  toggleView("detail");
  updateHeader();
}

async function refreshCurrentModel() {
  await loadList(state.activeModel);
  renderList();
  renderPagination();
  updateHeader();
}

async function switchModel(model) {
  state.activeModel = model;
  state.selectedRecord = null;
  document.getElementById("search-input").value = state.search[model];
  document.getElementById("page-size-select").value = String(state.pagination[model].page_size);
  state.caseComments = [];
  state.auditRecords = [];
  renderCaseComments();
  renderAuditRecords();
  toggleView("list");
  await refreshCurrentModel();
}

function registerEvents() {
  document.querySelectorAll("#model-nav button").forEach((button) => {
    button.addEventListener("click", async () => {
      await switchModel(button.dataset.model);
    });
  });

  document.getElementById("search-input").addEventListener("change", async (event) => {
    state.search[state.activeModel] = event.target.value.trim();
    state.pagination[state.activeModel].page = 1;
    await refreshCurrentModel();
  });

  document.getElementById("page-size-select").addEventListener("change", async (event) => {
    state.pagination[state.activeModel].page_size = Number(event.target.value);
    state.pagination[state.activeModel].page = 1;
    await refreshCurrentModel();
  });

  document.getElementById("prev-page").addEventListener("click", async () => {
    state.pagination[state.activeModel].page -= 1;
    await refreshCurrentModel();
  });

  document.getElementById("next-page").addEventListener("click", async () => {
    state.pagination[state.activeModel].page += 1;
    await refreshCurrentModel();
  });

  document.getElementById("back-to-list").addEventListener("click", async () => {
    toggleView("list");
    updateHeader();
  });

  document.getElementById("create-button").addEventListener("click", async () => {
    if (state.activeModel === "user-groups" || state.activeModel === "cases") {
      await loadReferences();
    }
    renderEditForm("create");
    toggleView("edit");
    updateHeader();
  });

  document.getElementById("edit-button").addEventListener("click", async () => {
    if (state.activeModel === "user-groups" || state.activeModel === "cases") {
      await loadReferences();
    }
    renderEditForm("edit");
    toggleView("edit");
    updateHeader();
  });

  document.getElementById("cancel-edit").addEventListener("click", () => {
    toggleView(state.selectedRecord ? "detail" : "list");
    updateHeader();
  });

  document.getElementById("delete-button").addEventListener("click", async () => {
    const config = getConfig();
    if (!state.selectedRecord) {
      return;
    }

    const confirmed = window.confirm(`Delete this ${config.label.slice(0, -1).toLowerCase()} record? This action cannot be undone.`);
    if (!confirmed) {
      return;
    }

    try {
      await apiRequest(`${config.endpoint}/${state.selectedRecord.id}`, { method: "DELETE" });
      state.selectedRecord = null;
      toggleView("list");
      await refreshCurrentModel();
      setStatus(`${config.label.slice(0, -1) || config.label} deleted.`);
    } catch (error) {
      setStatus(error.message, true);
    }
  });

  document.getElementById("case-comment-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    if (state.activeModel !== "cases" || !state.selectedRecord) {
      return;
    }

    const input = document.getElementById("case-comment-input");
    const content = String(input.value || "").trim();
    if (!content) {
      setStatus("Comment content is required.", true);
      return;
    }

    try {
      await apiRequest("/api/comments", {
        method: "POST",
        body: JSON.stringify({
          case_id: Number(state.selectedRecord.id),
          content
        })
      });
      input.value = "";
      await loadCaseComments(state.selectedRecord.id);
      await loadAuditRecords(getConfig().targetType, state.selectedRecord.id);
      renderCaseComments();
      renderAuditRecords();
      setStatus("Comment posted.");
    } catch (error) {
      setStatus(error.message, true);
    }
  });

  document.getElementById("logout-button").addEventListener("click", async () => {
    try {
      await apiRequest("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.href = "/login";
    }
  });
}

async function boot() {
  try {
    await apiRequest("/api/auth/me");
    registerEvents();
    await loadReferences();
    await switchModel("users");
    setStatus("Data loaded.");
  } catch (error) {
    setStatus(error.message, true);
  }
}

boot();
