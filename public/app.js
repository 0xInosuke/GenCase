const STATUS_CODES = ["ACT", "INACT", "DEL", "PEND"];

const modelConfigs = {
  users: {
    label: "Users",
    endpoint: "/api/users",
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
  }
};

const state = {
  activeModel: "users",
  view: "list",
  records: {
    users: [],
    groups: [],
    "user-groups": []
  },
  pagination: {
    users: { page: 1, page_size: 20, total_pages: 0, total_count: 0 },
    groups: { page: 1, page_size: 20, total_pages: 0, total_count: 0 },
    "user-groups": { page: 1, page_size: 20, total_pages: 0, total_count: 0 }
  },
  search: {
    users: "",
    groups: "",
    "user-groups": ""
  },
  sort: {
    users: { sortBy: "id", sortDir: "asc" },
    groups: { sortBy: "id", sortDir: "asc" },
    "user-groups": { sortBy: "id", sortDir: "asc" }
  },
  selectedRecord: null,
  referenceData: {
    users: [],
    groups: []
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
  const [usersResult, groupsResult] = await Promise.all([
    apiRequest("/api/users?page=1&page_size=100&sort_by=display_name&sort_dir=asc"),
    apiRequest("/api/groups?page=1&page_size=100&sort_by=group_name&sort_dir=asc")
  ]);

  state.referenceData.users = usersResult.items;
  state.referenceData.groups = groupsResult.items;
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
      ${config.listColumns.map((column) => `<td>${row[column.key] ?? ""}</td>`).join("")}
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
  target.innerHTML = config.detailFields.map((field) => `
    <div class="detail-item">
      <p>${field.label}</p>
      <strong>${state.selectedRecord?.[field.key] ?? ""}</strong>
    </div>
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

  return `<input name="${field.key}" type="${field.type}" value="${value}" required>`;
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

  form.onsubmit = async (event) => {
    event.preventDefault();
    const formData = Object.fromEntries(new FormData(form).entries());
    const payload = isCreate
      ? config.buildCreatePayload(formData)
      : config.buildUpdatePayload(state.selectedRecord, formData);

    try {
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
        renderDetail();
        toggleView("detail");
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
  renderDetail();
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
    if (state.activeModel === "user-groups") {
      await loadReferences();
    }
    renderEditForm("create");
    toggleView("edit");
    updateHeader();
  });

  document.getElementById("edit-button").addEventListener("click", async () => {
    if (state.activeModel === "user-groups") {
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
}

async function boot() {
  try {
    registerEvents();
    await loadReferences();
    await switchModel("users");
    setStatus("Data loaded.");
  } catch (error) {
    setStatus(error.message, true);
  }
}

boot();
