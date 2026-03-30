import {
  parseJsonInput,
  escapeHtml,
  formatInlineValue,
  formatDetailValue,
  isMultilineValue,
  getDetailItemClass,
  formatDateTime
} from "./core/utils.js";
import { createInitialState } from "./core/state.js";
import { apiRequest } from "./core/api.js";
import { createModelConfigs } from "./models/index.js";
import { renderList as renderListView, renderPagination as renderPaginationView } from "./components/listView.js";
import { renderDetail as renderDetailView } from "./components/detailView.js";
import { renderCaseComments as renderCaseCommentsView, renderAuditRecords as renderAuditRecordsView } from "./components/commentsAuditView.js";
import { renderEditFormView } from "./components/editFormView.js";

const modelConfigs = createModelConfigs(parseJsonInput);
const state = createInitialState();

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

function getConfig(model = state.activeModel) {
  return modelConfigs[model];
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

async function loadCaseComments(caseId) {
  state.caseComments = await apiRequest(`/api/comments?case_id=${encodeURIComponent(caseId)}`);
}

async function loadAuditRecords(targetType, targetId) {
  state.auditRecords = await apiRequest(`/api/audits?target_type=${encodeURIComponent(targetType)}&target_id=${encodeURIComponent(targetId)}`);
}

function renderList() {
  renderListView({
    config: getConfig(),
    state,
    escapeHtml,
    formatInlineValue,
    onSort: async (sortBy) => {
      const modelSort = state.sort[state.activeModel];
      modelSort.sortDir = modelSort.sortBy === sortBy && modelSort.sortDir === "asc" ? "desc" : "asc";
      modelSort.sortBy = sortBy;
      state.pagination[state.activeModel].page = 1;
      await refreshCurrentModel();
    },
    onOpenDetail: async (id) => {
      await openDetail(id);
    }
  });
}

function renderPagination() {
  renderPaginationView(state);
}

function renderDetail() {
  renderDetailView({
    config: getConfig(),
    state,
    escapeHtml,
    formatDetailValue,
    isMultilineValue,
    getDetailItemClass,
    formatDateTime
  });
}

function renderCaseComments() {
  renderCaseCommentsView({
    state,
    escapeHtml,
    formatDateTime
  });
}

function renderAuditRecords() {
  renderAuditRecordsView({
    state,
    escapeHtml,
    formatDateTime,
    formatDetailValue
  });
}

function renderEditForm(mode) {
  const config = getConfig();
  renderEditFormView({
    state,
    config,
    mode,
    escapeHtml,
    parseJsonInput,
    setStatus,
    onSubmit: async ({ isCreate, formData }) => {
      try {
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
    },
    onCancel: () => {
      if (mode === "create") {
        toggleView("list");
      } else {
        toggleView("detail");
        renderDetail();
      }
      updateHeader();
    }
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
