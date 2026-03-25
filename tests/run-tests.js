const assert = require("node:assert/strict");
const app = require("../src/app");

let server;
let baseUrl;

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options
  });

  if (response.status === 204) {
    return { status: response.status, body: null };
  }

  return {
    status: response.status,
    body: await response.json()
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

    const deleteUserGroup = await request(`/api/user-groups/${createdUserGroupId}`, {
      method: "DELETE"
    });
    assert.equal(deleteUserGroup.status, 204);

    const deleteGroup = await request(`/api/groups/${createdGroupId}`, {
      method: "DELETE"
    });
    assert.equal(deleteGroup.status, 204);

    const deleteUser = await request(`/api/users/${createdUserId}`, {
      method: "DELETE"
    });
    assert.equal(deleteUser.status, 204);

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
