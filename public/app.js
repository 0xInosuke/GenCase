const state = {
  users: [],
  groups: [],
  userGroups: []
};

function setStatus(message, isError = false) {
  const el = document.getElementById("status-message");
  el.textContent = message;
  el.style.color = isError ? "#b42318" : "#1b1a18";
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

function renderTable(targetId, columns, rows, handlers) {
  const target = document.getElementById(targetId);
  if (rows.length === 0) {
    target.innerHTML = "<p>No records.</p>";
    return;
  }

  const headerHtml = columns.map((column) => `<th>${column.label}</th>`).join("");
  const rowHtml = rows.map((row) => `
    <tr>
      ${columns.map((column) => `<td>${row[column.key] ?? ""}</td>`).join("")}
      <td>
        <div class="table-actions">
          <button type="button" data-action="edit" data-id="${row.id}">Edit</button>
          <button type="button" class="danger" data-action="delete" data-id="${row.id}">Delete</button>
        </div>
      </td>
    </tr>
  `).join("");

  target.innerHTML = `
    <table>
      <thead>
        <tr>${headerHtml}<th>Actions</th></tr>
      </thead>
      <tbody>${rowHtml}</tbody>
    </table>
  `;

  target.querySelectorAll("[data-action='edit']").forEach((button) => {
    button.addEventListener("click", () => handlers.onEdit(Number(button.dataset.id)));
  });
  target.querySelectorAll("[data-action='delete']").forEach((button) => {
    button.addEventListener("click", () => handlers.onDelete(Number(button.dataset.id)));
  });
}

function populateSelect(selectId, items, labelKey) {
  const select = document.getElementById(selectId);
  select.innerHTML = items
    .map((item) => `<option value="${item.id}">${item[labelKey]} (#${item.id})</option>`)
    .join("");
}

function resetUserForm() {
  document.getElementById("user-id").value = "";
  document.getElementById("user-name").value = "";
  document.getElementById("user-password").value = "";
  document.getElementById("user-status-code").value = "1";
}

function resetGroupForm() {
  document.getElementById("group-id").value = "";
  document.getElementById("group-name").value = "";
  document.getElementById("group-status-code").value = "1";
}

function resetUserGroupForm() {
  document.getElementById("user-group-id").value = "";
  document.getElementById("user-group-status-code").value = "1";
}

async function loadUsers() {
  state.users = await apiRequest("/api/users");
  renderTable(
    "user-table",
    [
      { key: "id", label: "ID" },
      { key: "user_name", label: "Username" },
      { key: "user_password", label: "Password" },
      { key: "status_code", label: "Status" }
    ],
    state.users,
    {
      onEdit(id) {
        const item = state.users.find((entry) => entry.id === id);
        document.getElementById("user-id").value = item.id;
        document.getElementById("user-name").value = item.user_name;
        document.getElementById("user-password").value = item.user_password;
        document.getElementById("user-status-code").value = item.status_code;
      },
      async onDelete(id) {
        await apiRequest(`/api/users/${id}`, { method: "DELETE" });
        await loadAll();
      }
    }
  );
  populateSelect("user-group-user-id", state.users, "user_name");
}

async function loadGroups() {
  state.groups = await apiRequest("/api/groups");
  renderTable(
    "group-table",
    [
      { key: "id", label: "ID" },
      { key: "group_name", label: "Group Name" },
      { key: "status_code", label: "Status" }
    ],
    state.groups,
    {
      onEdit(id) {
        const item = state.groups.find((entry) => entry.id === id);
        document.getElementById("group-id").value = item.id;
        document.getElementById("group-name").value = item.group_name;
        document.getElementById("group-status-code").value = item.status_code;
      },
      async onDelete(id) {
        await apiRequest(`/api/groups/${id}`, { method: "DELETE" });
        await loadAll();
      }
    }
  );
  populateSelect("user-group-group-id", state.groups, "group_name");
}

async function loadUserGroups() {
  state.userGroups = await apiRequest("/api/user-groups");
  renderTable(
    "user-group-table",
    [
      { key: "id", label: "ID" },
      { key: "user_id", label: "User ID" },
      { key: "user_name", label: "Username" },
      { key: "group_id", label: "Group ID" },
      { key: "group_name", label: "Group Name" },
      { key: "status_code", label: "Status" }
    ],
    state.userGroups,
    {
      onEdit(id) {
        const item = state.userGroups.find((entry) => entry.id === id);
        document.getElementById("user-group-id").value = item.id;
        document.getElementById("user-group-user-id").value = item.user_id;
        document.getElementById("user-group-group-id").value = item.group_id;
        document.getElementById("user-group-status-code").value = item.status_code;
      },
      async onDelete(id) {
        await apiRequest(`/api/user-groups/${id}`, { method: "DELETE" });
        await loadAll();
      }
    }
  );
}

async function loadAll() {
  try {
    await Promise.all([loadUsers(), loadGroups(), loadUserGroups()]);
    setStatus("Data loaded.");
  } catch (error) {
    setStatus(error.message, true);
  }
}

function registerForms() {
  document.getElementById("user-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const id = document.getElementById("user-id").value;
    const payload = {
      user_name: document.getElementById("user-name").value,
      user_password: document.getElementById("user-password").value,
      status_code: Number(document.getElementById("user-status-code").value)
    };

    try {
      await apiRequest(id ? `/api/users/${id}` : "/api/users", {
        method: id ? "PUT" : "POST",
        body: JSON.stringify(payload)
      });
      resetUserForm();
      await loadAll();
      setStatus("User saved.");
    } catch (error) {
      setStatus(error.message, true);
    }
  });

  document.getElementById("group-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const id = document.getElementById("group-id").value;
    const payload = {
      group_name: document.getElementById("group-name").value,
      status_code: Number(document.getElementById("group-status-code").value)
    };

    try {
      await apiRequest(id ? `/api/groups/${id}` : "/api/groups", {
        method: id ? "PUT" : "POST",
        body: JSON.stringify(payload)
      });
      resetGroupForm();
      await loadAll();
      setStatus("Group saved.");
    } catch (error) {
      setStatus(error.message, true);
    }
  });

  document.getElementById("user-group-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const id = document.getElementById("user-group-id").value;
    const payload = {
      user_id: Number(document.getElementById("user-group-user-id").value),
      group_id: Number(document.getElementById("user-group-group-id").value),
      status_code: Number(document.getElementById("user-group-status-code").value)
    };

    try {
      await apiRequest(id ? `/api/user-groups/${id}` : "/api/user-groups", {
        method: id ? "PUT" : "POST",
        body: JSON.stringify(payload)
      });
      resetUserGroupForm();
      await loadAll();
      setStatus("User-group relation saved.");
    } catch (error) {
      setStatus(error.message, true);
    }
  });

  document.getElementById("reload-users").addEventListener("click", loadUsers);
  document.getElementById("reload-groups").addEventListener("click", loadGroups);
  document.getElementById("reload-user-groups").addEventListener("click", loadUserGroups);
  document.getElementById("user-reset").addEventListener("click", resetUserForm);
  document.getElementById("group-reset").addEventListener("click", resetGroupForm);
  document.getElementById("user-group-reset").addEventListener("click", resetUserGroupForm);
}

registerForms();
loadAll();
