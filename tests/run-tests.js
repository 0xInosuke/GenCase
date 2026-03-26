const assert = require("node:assert/strict");
const app = require("../src/app");

let server;
let baseUrl;
let authCookie = "";

function getCookieHeader(response) {
  if (typeof response.headers.getSetCookie === "function") {
    const setCookies = response.headers.getSetCookie();
    if (setCookies.length > 0) {
      return setCookies[0].split(";")[0];
    }
  }

  const fallback = response.headers.get("set-cookie");
  return fallback ? fallback.split(";")[0] : "";
}

async function request(path, options = {}) {
  const useAuth = options.useAuth !== false;
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  if (useAuth && authCookie) {
    headers.Cookie = authCookie;
  }

  const response = await fetch(`${baseUrl}${path}`, {
    headers,
    redirect: options.redirect || "follow",
    ...options
  });

  const cookieHeader = getCookieHeader(response);
  if (cookieHeader) {
    authCookie = cookieHeader;
  }

  if (response.status === 204) {
    return { status: response.status, body: null, headers: response.headers };
  }

  const contentType = response.headers.get("content-type") || "";
  let body;
  if (contentType.includes("application/json")) {
    body = await response.json();
  } else {
    body = await response.text();
  }

  return {
    status: response.status,
    body,
    headers: response.headers
  };
}

async function main() {
  await new Promise((resolve) => {
    server = app.listen(0, "127.0.0.1", () => {
      const address = server.address();
      baseUrl = `http://127.0.0.1:${address.port}`;
      resolve();
    });
  });

  try {
    const health = await request("/api/health");
    assert.equal(health.status, 200);
    assert.equal(health.body.ok, true);

    const loginRedirect = await request("/", { redirect: "manual", useAuth: false });
    assert.equal(loginRedirect.status, 302);
    assert.equal(loginRedirect.headers.get("location"), "/login");

    const unauthorizedUsers = await request("/api/users", { useAuth: false });
    assert.equal(unauthorizedUsers.status, 401);

    const badLogin = await request("/api/auth/login", {
      method: "POST",
      useAuth: false,
      body: JSON.stringify({
        user_name: "alice",
        user_password: "wrong_password"
      })
    });
    assert.equal(badLogin.status, 401);

    const login = await request("/api/auth/login", {
      method: "POST",
      useAuth: false,
      body: JSON.stringify({
        user_name: "alice",
        user_password: "alice_password_123"
      })
    });
    assert.equal(login.status, 200);
    assert.ok(authCookie.includes("gencase_session="));

    const me = await request("/api/auth/me");
    assert.equal(me.status, 200);
    assert.equal(me.body.user_name, "alice");

    const userCreate = await request("/api/users", {
      method: "POST",
      body: JSON.stringify({
        user_name: "delta",
        display_name: "Delta User",
        user_password: "delta_password_123",
        status_code: "ACT"
      })
    });
    assert.equal(userCreate.status, 201);
    const createdUserId = userCreate.body.id;
    assert.equal(userCreate.body.display_name, "Delta User");

    const groupCreate = await request("/api/groups", {
      method: "POST",
      body: JSON.stringify({
        group_name: "auditor",
        status_code: "ACT"
      })
    });
    assert.equal(groupCreate.status, 201);
    const createdGroupId = groupCreate.body.id;

    const userGroupCreate = await request("/api/user-groups", {
      method: "POST",
      body: JSON.stringify({
        user_id: createdUserId,
        group_id: createdGroupId,
        status_code: "PEND"
      })
    });
    assert.equal(userGroupCreate.status, 201);
    const createdUserGroupId = userGroupCreate.body.id;

    const workflowCreate = await request("/api/workflows", {
      method: "POST",
      body: JSON.stringify({
        wf_name: "change_management",
        status_code: "ACT",
        wf_data: {
          name: "Change Management",
          description: "Track requested infrastructure changes through approvals.",
          stages: ["draft", "security_review", "approved"],
          access: {
            draft: ["editor"],
            security_review: ["admin", "editor"],
            approved: ["admin", "viewer"]
          }
        }
      })
    });
    assert.equal(workflowCreate.status, 201);
    const createdWorkflowId = workflowCreate.body.id;

    const users = await request("/api/users?search=Delta&sort_by=display_name&sort_dir=asc&page=1&page_size=20");
    assert.equal(users.status, 200);
    assert.ok(users.body.items.some((item) => item.id === createdUserId));
    assert.ok(users.body.pagination.total_count >= 1);

    const groups = await request("/api/groups");
    assert.equal(groups.status, 200);
    assert.ok(groups.body.items.some((item) => item.id === createdGroupId));

    const userGroups = await request("/api/user-groups");
    assert.equal(userGroups.status, 200);
    assert.ok(userGroups.body.items.some((item) => item.id === createdUserGroupId));

    const workflows = await request("/api/workflows?search=change&sort_by=wf_name&sort_dir=asc&page=1&page_size=20");
    assert.equal(workflows.status, 200);
    assert.ok(workflows.body.items.some((item) => item.id === createdWorkflowId));
    assert.ok(workflows.body.pagination.total_count >= 1);

    const updatedUser = await request(`/api/users/${createdUserId}`, {
      method: "PUT",
      body: JSON.stringify({
        user_name: "ignored_in_update",
        display_name: "Delta Updated",
        user_password: "delta_password_updated",
        status_code: "INACT"
      })
    });
    assert.equal(updatedUser.status, 200);
    assert.equal(updatedUser.body.user_name, "delta");
    assert.equal(updatedUser.body.display_name, "Delta Updated");
    assert.equal(updatedUser.body.status_code, "INACT");

    const updatedWorkflow = await request(`/api/workflows/${createdWorkflowId}`, {
      method: "PUT",
      body: JSON.stringify({
        wf_name: "change_management_v2",
        status_code: "PEND",
        wf_data: {
          name: "Change Management V2",
          description: "Updated approval workflow with implementation step.",
          stages: ["draft", "security_review", "implementation", "approved"],
          access: {
            draft: ["editor"],
            security_review: ["admin", "editor"],
            implementation: ["editor"],
            approved: ["admin", "viewer"]
          }
        }
      })
    });
    assert.equal(updatedWorkflow.status, 200);
    assert.equal(updatedWorkflow.body.wf_name, "change_management_v2");
    assert.equal(updatedWorkflow.body.status_code, "PEND");
    assert.equal(updatedWorkflow.body.wf_data.stages.length, 4);

    const deleteUserGroup = await request(`/api/user-groups/${createdUserGroupId}`, {
      method: "DELETE"
    });
    assert.equal(deleteUserGroup.status, 204);

    const deleteGroup = await request(`/api/groups/${createdGroupId}`, {
      method: "DELETE"
    });
    assert.equal(deleteGroup.status, 204);

    const deleteWorkflow = await request(`/api/workflows/${createdWorkflowId}`, {
      method: "DELETE"
    });
    assert.equal(deleteWorkflow.status, 204);

    const deleteUser = await request(`/api/users/${createdUserId}`, {
      method: "DELETE"
    });
    assert.equal(deleteUser.status, 204);

    const logout = await request("/api/auth/logout", {
      method: "POST"
    });
    assert.equal(logout.status, 204);

    const afterLogout = await request("/api/users", { useAuth: false });
    assert.equal(afterLogout.status, 401);

    console.log("All integration tests passed.");
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
