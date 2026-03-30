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
      { key: "id", label: "ID", sortable: true, width: "84px" },
      { key: "display_name", label: "Display Name", sortable: true, width: "minmax(220px, 1.4fr)" },
      { key: "status_code", label: "Status Code", sortable: true, width: "130px" }
    ],
    detailFields: [
      { key: "id", label: "ID", span: "half", tone: "meta" },
      { key: "user_name", label: "Username", span: "half" },
      { key: "display_name", label: "Display Name", span: "half" },
      { key: "status_code", label: "Status Code", span: "half" },
      { key: "created_at", label: "Created At", span: "half", tone: "meta" },
      { key: "updated_at", label: "Updated At", span: "half", tone: "meta" }
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
      { key: "id", label: "ID", sortable: true, width: "84px" },
      { key: "group_name", label: "Group Name", sortable: true, width: "minmax(220px, 1.4fr)" },
      { key: "status_code", label: "Status Code", sortable: true, width: "130px" }
    ],
    detailFields: [
      { key: "id", label: "ID", span: "half", tone: "meta" },
      { key: "group_name", label: "Group Name", span: "half" },
      { key: "status_code", label: "Status Code", span: "half" },
      { key: "created_at", label: "Created At", span: "half", tone: "meta" },
      { key: "updated_at", label: "Updated At", span: "half", tone: "meta" }
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
      { key: "id", label: "ID", sortable: true, width: "84px" },
      { key: "display_name", label: "Display Name", sortable: true, width: "minmax(220px, 1.2fr)" },
      { key: "group_name", label: "Group Name", sortable: true, width: "minmax(200px, 1fr)" },
      { key: "status_code", label: "Status Code", sortable: true, width: "130px" }
    ],
    detailFields: [
      { key: "id", label: "ID", span: "half", tone: "meta" },
      { key: "user_id", label: "User ID", span: "half" },
      { key: "display_name", label: "Display Name", span: "half" },
      { key: "group_id", label: "Group ID", span: "half" },
      { key: "group_name", label: "Group Name", span: "half" },
      { key: "status_code", label: "Status Code", span: "half" },
      { key: "created_at", label: "Created At", span: "half", tone: "meta" },
      { key: "updated_at", label: "Updated At", span: "half", tone: "meta" }
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
      { key: "id", label: "ID", sortable: true, width: "84px" },
      { key: "wf_name", label: "Workflow Name", sortable: true, width: "minmax(260px, 1.6fr)" },
      { key: "status_code", label: "Status Code", sortable: true, width: "130px" }
    ],
    detailFields: [
      { key: "id", label: "ID", span: "half", tone: "meta" },
      { key: "wf_name", label: "Workflow Name", span: "half" },
      { key: "status_code", label: "Status Code", span: "half" },
      { key: "created_at", label: "Created At", span: "half", tone: "meta" },
      { key: "updated_at", label: "Updated At", span: "half", tone: "meta" },
      { key: "wf_data", label: "Workflow Data", span: "full" }
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
      { key: "id", label: "ID", sortable: true, width: "84px" },
      { key: "case_title", label: "Case Title", sortable: true, width: "minmax(280px, 1.8fr)" },
      { key: "wf_name", label: "Workflow", sortable: true, width: "minmax(220px, 1.2fr)" },
      { key: "stage_code", label: "Stage", sortable: true, width: "150px" }
    ],
    detailFields: [
      { key: "id", label: "ID", span: "half", tone: "meta" },
      { key: "case_title", label: "Case Title", span: "half" },
      { key: "wf_name", label: "Workflow Name", span: "half" },
      { key: "stage_code", label: "Stage Code", span: "half" },
      { key: "created_at", label: "Created At", span: "half", tone: "meta" },
      { key: "updated_at", label: "Updated At", span: "half", tone: "meta" },
      { key: "case_data", label: "Case Data", span: "full" }
    ],
    createFields: [
      { key: "workflow_id", label: "Workflow", type: "workflow-select" },
      { key: "case_title", label: "Case Title", type: "text" },
      { key: "stage_code", label: "Stage Code", type: "stage-select" },
      { key: "case_data", label: "Case Data", type: "case-data-editor" }
    ],
    editFields: [
      { key: "workflow_id", label: "Workflow", type: "workflow-readonly" },
      { key: "case_title", label: "Case Title", type: "text" },
      { key: "stage_code", label: "Stage Code", type: "stage-select" },
      { key: "case_data", label: "Case Data", type: "case-data-editor" }
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
  auditExpanded: true,
  referenceData: {
    users: [],
    groups: [],
    workflows: []
  },
  toastTimer: null
};

function setStatus(message, isError = false) {
  const el = document.getElementById("page-toast");
  el.textContent = message;
  el.classList.remove("hidden");
  el.classList.toggle("is-error", isError);

  if (state.toastTimer) {
    window.clearTimeout(state.toastTimer);
  }

  state.toastTimer = window.setTimeout(() => {
    clearStatus();
  }, 2400);
}

function clearStatus() {
  const el = document.getElementById("page-toast");
  el.textContent = "";
  el.classList.add("hidden");
  el.classList.remove("is-error");

  if (state.toastTimer) {
    window.clearTimeout(state.toastTimer);
    state.toastTimer = null;
  }
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

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : { error: await response.text() };

  if (!response.ok) {
    const error = new Error(data.error || "Request failed.");
    error.status = response.status;
    throw error;
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

function isMultilineValue(value, field = null) {
  if (field?.span === "full") {
    return true;
  }

  return typeof value === "object" && value !== null;
}

function getDetailItemClass(field) {
  const classes = ["detail-item"];
  if (field?.span === "full") {
    classes.push("detail-item--full");
  }
  if (field?.tone === "meta") {
    classes.push("detail-item--meta");
  }
  return classes.join(" ");
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
  const colgroup = config.listColumns
    .map((column) => `<col style="width:${column.width || "auto"}">`)
    .join("");

  target.innerHTML = `
    <table>
      <colgroup>${colgroup}</colgroup>
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

  target.innerHTML = config.detailFields.map((field) => {
    const rawValue = state.selectedRecord?.[field.key];
    const formattedValue = field.key.endsWith("_at") || field.key === "timestamp"
      ? formatDateTime(rawValue)
      : formatDetailValue(rawValue);
    const nestedValue = state.activeModel === "cases" && field.key === "case_data"
      ? renderNestedBlocks(rawValue)
      : "";
    const isNestedCaseData = Boolean(nestedValue);
    const valueClass = isMultilineValue(rawValue, field) ? "detail-value detail-value--multiline" : "detail-value";
    const valueTag = isMultilineValue(rawValue, field) ? "pre" : "div";

    return `
      <div class="${getDetailItemClass(field)}">
        <p>${field.label}</p>
        ${isNestedCaseData ? nestedValue : `<${valueTag} class="${valueClass}">${escapeHtml(formattedValue)}</${valueTag}>`}
      </div>
    `;
  }).join("");
}

function renderNestedBlocks(value, path = []) {
  if (!value || typeof value !== "object") {
    return `<div class="detail-nested-block"><p>${escapeHtml(path[path.length - 1] || "Value")}</p><div class="detail-nested-value">${escapeHtml(formatDetailValue(value))}</div></div>`;
  }

  const entries = Array.isArray(value)
    ? value.map((item, index) => [String(index), item])
    : Object.entries(value);

  return `
    <div class="detail-nested">
      <div class="detail-nested-level">
        ${entries.map(([key, childValue]) => {
          const isObject = childValue && typeof childValue === "object";
          const blockClass = isObject ? "detail-nested-block detail-nested-block--full" : "detail-nested-block";
          return `
            <section class="${blockClass}">
              <p>${escapeHtml(key)}</p>
              ${isObject
                ? renderNestedBlocks(childValue, [...path, key])
                : `<div class="detail-nested-value">${escapeHtml(formatDetailValue(childValue))}</div>`}
            </section>
          `;
        }).join("")}
      </div>
    </div>
  `;
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
  const toggleButton = document.getElementById("toggle-audit-button");

  if (!state.selectedRecord) {
    section.classList.add("hidden");
    list.innerHTML = "";
    section.classList.remove("audit-collapsed");
    return;
  }

  section.classList.remove("hidden");
  section.classList.toggle("audit-collapsed", !state.auditExpanded);
  toggleButton.textContent = state.auditExpanded ? "Collapse" : "Expand";
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

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isCompositeJsonValue(value) {
  return isPlainObject(value) || Array.isArray(value);
}

function formatSimpleEditorValue(value) {
  if (value === null) {
    return "null";
  }
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  return String(value);
}

function parseSimpleEditorValue(value) {
  const raw = String(value ?? "");
  const trimmed = raw.trim();
  if (trimmed === "") {
    return "";
  }

  try {
    return JSON.parse(trimmed);
  } catch (_error) {
    return raw;
  }
}

function cloneJsonValue(value) {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch (_error) {
    return {};
  }
}

function normalizeCaseDataRoot(value) {
  if (isCompositeJsonValue(value)) {
    return value;
  }
  return {};
}

function formatJsonValueType(value) {
  if (Array.isArray(value)) {
    return "array";
  }
  if (value === null) {
    return "null";
  }
  return typeof value;
}

function setValueAtPath(target, path, nextValue) {
  if (path.length === 0) {
    return nextValue;
  }

  let cursor = target;
  for (let index = 0; index < path.length - 1; index += 1) {
    cursor = cursor[path[index]];
  }
  cursor[path[path.length - 1]] = nextValue;
  return target;
}

function renderCaseDataFriendlyTree(container, rootValue, onLeafChange) {
  container.innerHTML = "";

  function renderNodeChildren(parent, value, path, level) {
    if (isPlainObject(value)) {
      const entries = Object.entries(value);
      if (entries.length === 0) {
        const emptyNote = document.createElement("p");
        emptyNote.className = "readonly-note";
        emptyNote.textContent = "Empty object";
        parent.appendChild(emptyNote);
        return;
      }

      entries.forEach(([key, childValue]) => {
        renderEntry(parent, key, childValue, [...path, key], level);
      });
      return;
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        const emptyNote = document.createElement("p");
        emptyNote.className = "readonly-note";
        emptyNote.textContent = "Empty array";
        parent.appendChild(emptyNote);
        return;
      }

      value.forEach((childValue, index) => {
        renderEntry(parent, `[${index}]`, childValue, [...path, index], level);
      });
    }
  }

  function renderEntry(parent, keyLabel, value, path, level) {
    if (isCompositeJsonValue(value)) {
      const block = document.createElement("details");
      block.className = "json-tree-block";
      block.open = level < 2;
      block.innerHTML = `
        <summary>
          <span class="json-tree-key">${escapeHtml(String(keyLabel))}</span>
          <span class="json-tree-type">${escapeHtml(formatJsonValueType(value))}</span>
        </summary>
      `;

      const content = document.createElement("div");
      content.className = "json-tree-children";
      block.appendChild(content);
      renderNodeChildren(content, value, path, level + 1);
      parent.appendChild(block);
      return;
    }

    const row = document.createElement("div");
    row.className = "json-tree-leaf";
    row.innerHTML = `
      <div class="json-tree-leaf-label">
        <span class="json-tree-key">${escapeHtml(String(keyLabel))}</span>
        <span class="json-tree-type">${escapeHtml(formatJsonValueType(value))}</span>
      </div>
      <input type="text" value="${escapeHtml(formatSimpleEditorValue(value))}">
    `;

    const valueInput = row.querySelector("input");
    valueInput.addEventListener("input", () => {
      onLeafChange(path, valueInput.value);
    });

    parent.appendChild(row);
  }

  if (!isCompositeJsonValue(rootValue)) {
    const invalidRoot = document.createElement("p");
    invalidRoot.className = "readonly-note";
    invalidRoot.textContent = "Friendly mode supports object/array root values.";
    container.appendChild(invalidRoot);
    return;
  }

  const rootBlock = document.createElement("div");
  rootBlock.className = "json-tree-root";
  rootBlock.innerHTML = `
    <p class="readonly-note">Root (${escapeHtml(formatJsonValueType(rootValue))})</p>
  `;
  const rootChildren = document.createElement("div");
  rootChildren.className = "json-tree-children";
  rootBlock.appendChild(rootChildren);
  container.appendChild(rootBlock);
  renderNodeChildren(rootChildren, rootValue, [], 0);
}

function initCaseDataEditor(form, initialValue) {
  const editor = form.querySelector("[data-case-json-editor]");
  if (!editor) {
    return;
  }

  const modeButtons = Array.from(editor.querySelectorAll("[data-json-mode]"));
  const simplePanel = editor.querySelector("[data-json-simple]");
  const rawPanel = editor.querySelector("[data-json-raw]");
  const treeContainer = editor.querySelector("[data-json-tree]");
  const rawTextarea = editor.querySelector("[data-case-json-raw]");
  const hiddenField = editor.querySelector('textarea[name="case_data"]');
  let friendlyValue = {};

  function renderFriendly(value) {
    friendlyValue = cloneJsonValue(value);
    renderCaseDataFriendlyTree(treeContainer, friendlyValue, (path, rawInput) => {
      const nextValue = parseSimpleEditorValue(rawInput);
      friendlyValue = setValueAtPath(friendlyValue, path, nextValue);
      syncRawFromFriendly();
    });
  }

  function syncRawFromFriendly() {
    const jsonText = JSON.stringify(friendlyValue, null, 2);
    rawTextarea.value = jsonText;
    hiddenField.value = jsonText;
  }

  function setMode(mode) {
    const showSimple = mode === "simple";
    modeButtons.forEach((button) => {
      button.classList.toggle("active", button.dataset.jsonMode === mode);
    });
    simplePanel.classList.toggle("hidden", !showSimple);
    rawPanel.classList.toggle("hidden", showSimple);
  }

  function syncSimpleFromRaw(showError) {
    hiddenField.value = rawTextarea.value;

    try {
      const parsed = parseJsonInput(rawTextarea.value || "{}", "Case Data");
      if (!isCompositeJsonValue(parsed)) {
        throw new Error("Case Data must be a JSON object or array.");
      }
      renderFriendly(parsed);
      hiddenField.value = JSON.stringify(parsed, null, 2);
      return true;
    } catch (error) {
      if (showError) {
        setStatus(error.message, true);
      }
      return false;
    }
  }

  modeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const mode = button.dataset.jsonMode;
      if (mode === "simple") {
        if (!syncSimpleFromRaw(true)) {
          return;
        }
        setMode("simple");
        return;
      }
      syncRawFromFriendly();
      setMode("json");
    });
  });

  rawTextarea.addEventListener("input", () => {
    hiddenField.value = rawTextarea.value;
    syncSimpleFromRaw(false);
  });

  const initialRoot = normalizeCaseDataRoot(initialValue);
  renderFriendly(initialRoot);
  const initialJson = JSON.stringify(initialRoot, null, 2);
  rawTextarea.value = initialJson;
  hiddenField.value = initialJson;
  setMode("simple");
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
          <p class="readonly-note">Nested objects and arrays are shown level-by-level. Edit leaf values directly; changes sync to JSON editor.</p>
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
        try {
          await loadAuditRecords(config.targetType, saved.id);
          renderDetail();
          toggleView("detail");
          renderAuditRecords();
          updateHeader();
          setStatus(`${config.label.slice(0, -1) || config.label} updated.`);
        } catch (error) {
          const isCaseAccessLost = state.activeModel === "cases" && error.status === 403;
          if (!isCaseAccessLost) {
            throw error;
          }

          state.selectedRecord = null;
          toggleView("list");
          updateHeader();
          setStatus("Case updated. It is now in a stage you can no longer access.");
        }
      }
    } catch (error) {
      setStatus(error.message, true);
    }
  };

  if (state.activeModel === "cases") {
    initCaseDataEditor(form, isCreate ? null : state.selectedRecord?.case_data);
  }

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
  state.auditExpanded = false;
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
  clearStatus();
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
    clearStatus();
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
    clearStatus();
    toggleView(state.selectedRecord ? "detail" : "list");
    updateHeader();
  });

  document.getElementById("toggle-audit-button").addEventListener("click", () => {
    state.auditExpanded = !state.auditExpanded;
    renderAuditRecords();
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
