const assert = require("node:assert/strict");
const { createServer } = require("node:http");
const app = require("../src/app");
const { queryUser } = require("../src/config/database");

let server;
let baseUrl;
let aiMockServer;
let aiMockBaseUrl = "";
let authCookie = "";
const externalApiKey = "key1243456756756";
let testCaseCounter = 0;

function markTestCase(label) {
  testCaseCounter += 1;
  console.log(`#testcase#${testCaseCounter} ${label}: pass`);
}

async function loginAs(userName, userPassword) {
  const login = await request("/api/auth/login", {
    method: "POST",
    useAuth: false,
    body: JSON.stringify({
      user_name: userName,
      user_password: userPassword
    })
  });
  return login;
}

async function logoutCurrent() {
  return request("/api/auth/logout", { method: "POST" });
}

async function requestExternal(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    "x-api-key": options.apiKey || externalApiKey,
    ...(options.headers || {})
  };

  const response = await fetch(`${baseUrl}${path}`, {
    headers,
    redirect: options.redirect || "follow",
    ...options
  });

  if (response.status === 204) {
    return { status: response.status, body: null, headers: response.headers };
  }

  const contentType = response.headers.get("content-type") || "";
  const body = contentType.includes("application/json") ? await response.json() : await response.text();

  return {
    status: response.status,
    body,
    headers: response.headers
  };
}

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

async function startAiMockServer() {
  aiMockServer = createServer(async (req, res) => {
    let rawBody = "";
    for await (const chunk of req) {
      rawBody += chunk;
    }

    const parsedBody = rawBody ? JSON.parse(rawBody) : {};
    const prompt = String(parsedBody?.messages?.find((item) => item.role === "user")?.content || "").toLowerCase();
    const systemPrompt = String(parsedBody?.messages?.find((item) => item.role === "system")?.content || "").toLowerCase();

    let payload;
    if (prompt.includes("risk score")) {
      payload = {
        explanation: "Find visible cases whose risk score is greater than 5.",
        plan: {
          match: "and",
          conditions: [
            { field: "case_data.metadata.score", operator: "gt", value: 5 }
          ]
        }
      };
    } else if (prompt.includes("quality score")) {
      payload = systemPrompt.includes("previous search plan returned zero visible results")
        ? {
            explanation: "Retry with the observed score path.",
            plan: {
              match: "and",
              conditions: [
                { field: "case_data.metadata.score", operator: "gt", value: 5 }
              ]
            }
          }
        : {
            explanation: "Initial guess uses a narrower score path.",
            plan: {
              match: "and",
              conditions: [
                { field: "case_data.quality.score", operator: "gt", value: 5 }
              ]
            }
          };
    } else if (prompt.includes("bob")) {
      payload = {
        explanation: "Find visible cases connected to Bob.",
        plan: {
          match: "or",
          conditions: [
            { field: "case_data.owner", operator: "eq", value: "bob" },
            { field: "case_data.assignee", operator: "eq", value: "bob" },
            { field: "case_data.assigned_to", operator: "eq", value: "bob" },
            { field: "case_data.participants", operator: "contains", value: "bob" }
          ]
        }
      };
    } else {
      payload = {
        explanation: "Fallback search by case title.",
        plan: {
          match: "and",
          conditions: [
            { field: "case_title", operator: "contains", value: "case" }
          ]
        }
      };
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      choices: [
        {
          message: {
            content: JSON.stringify(payload)
          }
        }
      ]
    }));
  });

  await new Promise((resolve) => {
    aiMockServer.listen(0, "127.0.0.1", () => {
      const address = aiMockServer.address();
      aiMockBaseUrl = `http://127.0.0.1:${address.port}/v1/chat/completions`;
      resolve();
    });
  });

  process.env.AI_API_URL = aiMockBaseUrl;
  process.env.AI_API_KEY = "test-ai-key";
  process.env.AI_MODEL = "test-ai-model";
  process.env.AI_TIMEOUT_MS = "5000";
}

async function main() {
  await startAiMockServer();

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
    markTestCase("health endpoint");

    const loginRedirect = await request("/", { redirect: "manual", useAuth: false });
    assert.equal(loginRedirect.status, 302);
    assert.equal(loginRedirect.headers.get("location"), "/login");
    markTestCase("root redirects to login");

    const unauthorizedUsers = await request("/api/users", { useAuth: false });
    assert.equal(unauthorizedUsers.status, 401);
    markTestCase("unauthorized users request blocked");

    const unauthorizedAiSearch = await request("/api/ai/case-search", {
      method: "POST",
      useAuth: false,
      body: JSON.stringify({
        prompt: "give me all cases that risk score greater than 5"
      })
    });
    assert.equal(unauthorizedAiSearch.status, 401);
    markTestCase("unauthorized ai search blocked");

    const badLogin = await request("/api/auth/login", {
      method: "POST",
      useAuth: false,
      body: JSON.stringify({
        user_name: "alice",
        user_password: "wrong_password"
      })
    });
    assert.equal(badLogin.status, 401);
    markTestCase("invalid login rejected");

    const login = await loginAs("alice", "alice_password_123");
    assert.equal(login.status, 200);
    assert.ok(authCookie.includes("gencase_session="));
    assert.ok(Number.isInteger(login.body.visible_case_count));
    assert.ok(login.body.visible_case_count >= 1);
    markTestCase("alice login succeeds");

    const seededUsers = await request("/api/users?sort_by=id&sort_dir=asc&page=1&page_size=20");
    assert.equal(seededUsers.status, 200);
    assert.ok(seededUsers.body.pagination.total_count >= 3);
    markTestCase("seeded users list");

    const seededGroups = await request("/api/groups?sort_by=id&sort_dir=asc&page=1&page_size=20");
    assert.equal(seededGroups.status, 200);
    assert.ok(seededGroups.body.pagination.total_count >= 3);
    markTestCase("seeded groups list");

    const seededWorkflows = await request("/api/workflows?sort_by=id&sort_dir=asc&page=1&page_size=20");
    assert.equal(seededWorkflows.status, 200);
    assert.ok(seededWorkflows.body.pagination.total_count >= 1);
    markTestCase("seeded workflows list");

    const aliceCases = await request("/api/cases?sort_by=id&sort_dir=asc&page=1&page_size=200");
    assert.equal(aliceCases.status, 200);
    assert.ok(aliceCases.body.items.length >= 1);
    const aliceCaseIds = aliceCases.body.items.map((item) => Number(item.id));
    markTestCase("alice visible cases list");

    const aliceJsonCases = await request("/api/cases?search=%7B%22applicant%22%3A%7B%22region%22%3A%22APAC%22%7D%7D&sort_by=id&sort_dir=asc&page=1&page_size=200");
    assert.equal(aliceJsonCases.status, 200);
    assert.ok(aliceJsonCases.body.items.length >= 1);
    assert.ok(aliceJsonCases.body.items.some((item) => item.case_title === "Candidate A Onboarding"));
    const referenceCase = aliceJsonCases.body.items.find((item) => item.case_title === "Candidate A Onboarding") || aliceJsonCases.body.items[0];
    const referenceCaseId = Number(referenceCase.id);
    markTestCase("alice json case search");

    const aliceReferenceComments = await request(`/api/comments?case_id=${referenceCaseId}`);
    assert.equal(aliceReferenceComments.status, 200);
    assert.ok(aliceReferenceComments.body.length >= 1);
    assert.ok(aliceReferenceComments.body.some((item) => item.display_name === "Alice Chen"));
    markTestCase("alice visible case comments");

    const aliceCaseExport = await request(`/api/cases/${referenceCaseId}/export`);
    assert.equal(aliceCaseExport.status, 200);
    assert.equal(Number(aliceCaseExport.body.case.id), referenceCaseId);
    assert.ok(Array.isArray(aliceCaseExport.body.comments));
    assert.ok(aliceCaseExport.body.comments.length >= 1);
    assert.ok(aliceCaseExport.body.comments.some((item) => item.author === "Alice Chen"));
    assert.ok(typeof aliceCaseExport.body.exported_at === "string");
    markTestCase("alice case export");

    const invalidExternalAuth = await requestExternal("/external-api/cases", { apiKey: "invalid-key" });
    assert.equal(invalidExternalAuth.status, 401);
    markTestCase("invalid external api key rejected");

    const externalSeedCases = await requestExternal("/external-api/cases?sort_by=id&sort_dir=asc&page=1&page_size=200");
    assert.equal(externalSeedCases.status, 200);
    assert.ok(externalSeedCases.body.items.length >= 1);

    const externalSeedIds = externalSeedCases.body.items.map((item) => Number(item.id));
    markTestCase("external seeded cases list");

    const logoutAliceSeed = await logoutCurrent();
    assert.equal(logoutAliceSeed.status, 204);
    markTestCase("alice logout after seed checks");

    const loginBob = await loginAs("bob", "bob_password_123");
    assert.equal(loginBob.status, 200);
    const bobCases = await request("/api/cases?sort_by=id&sort_dir=asc&page=1&page_size=200");
    assert.equal(bobCases.status, 200);
    const bobCaseIds = bobCases.body.items.map((item) => Number(item.id));
    assert.ok(bobCaseIds.includes(referenceCaseId));
    markTestCase("bob login and case visibility");

    const bobForbiddenCaseId = aliceCaseIds.find((id) => !bobCaseIds.includes(id));
    assert.ok(bobForbiddenCaseId, "Expected at least one case visible to alice but not visible to bob.");
    assert.ok(externalSeedIds.includes(referenceCaseId));
    assert.ok(!externalSeedIds.includes(bobForbiddenCaseId));
    markTestCase("visibility differences between alice bob and external api");

    const bobJsonCases = await request("/api/cases?search=%7B%22applicant%22%3A%7B%22region%22%3A%22APAC%22%7D%7D&sort_by=id&sort_dir=asc&page=1&page_size=200");
    assert.equal(bobJsonCases.status, 200);
    assert.ok(bobJsonCases.body.items.length >= 1);
    assert.ok(bobJsonCases.body.items.some((item) => item.case_title === "Candidate A Onboarding"));
    markTestCase("bob json case search");

    const bobStageTransitionCreate = await request("/api/cases", {
      method: "POST",
      body: JSON.stringify({
        workflow_id: 1,
        case_title: "Bob Transition Case",
        stage_code: "draft",
        case_data: {
          owner: "bob",
          reason: "progress_to_next_stage"
        }
      })
    });
    assert.equal(bobStageTransitionCreate.status, 201);
    const bobTransitionCaseId = bobStageTransitionCreate.body.id;
    markTestCase("bob creates transition case");

    const bobStageTransitionUpdate = await request(`/api/cases/${bobTransitionCaseId}`, {
      method: "PUT",
      body: JSON.stringify({
        case_title: "Bob Transition Case",
        stage_code: "manager_review",
        case_data: {
          owner: "bob",
          reason: "progress_to_next_stage"
        }
      })
    });
    assert.equal(bobStageTransitionUpdate.status, 200);
    assert.equal(bobStageTransitionUpdate.body.stage_code, "manager_review");
    markTestCase("bob updates case to inaccessible destination stage");

    const bobStageTransitionAfterUpdate = await request(`/api/cases/${bobTransitionCaseId}`);
    assert.equal(bobStageTransitionAfterUpdate.status, 403);
    markTestCase("bob loses access after stage transition");

    const bobForbiddenCase = await request(`/api/cases/${bobForbiddenCaseId}`);
    assert.equal(bobForbiddenCase.status, 403);
    markTestCase("bob forbidden case detail");

    const bobForbiddenUpdate = await request(`/api/cases/${bobForbiddenCaseId}`, {
      method: "PUT",
      body: JSON.stringify({
        stage_code: "draft",
        case_data: { owner: "bob" }
      })
    });
    assert.equal(bobForbiddenUpdate.status, 403);
    markTestCase("bob forbidden case update");

    const bobForbiddenDelete = await request(`/api/cases/${bobForbiddenCaseId}`, {
      method: "DELETE"
    });
    assert.equal(bobForbiddenDelete.status, 403);
    markTestCase("bob forbidden case delete");

    const bobForbiddenComments = await request(`/api/comments?case_id=${bobForbiddenCaseId}`);
    assert.equal(bobForbiddenComments.status, 403);
    markTestCase("bob forbidden case comments");

    const bobForbiddenAudit = await request(`/api/audits?target_type=case&target_id=${bobForbiddenCaseId}`);
    assert.equal(bobForbiddenAudit.status, 403);
    markTestCase("bob forbidden case audit");

    const bobForbiddenExport = await request(`/api/cases/${bobForbiddenCaseId}/export`);
    assert.equal(bobForbiddenExport.status, 403);
    markTestCase("bob forbidden case export");

    const logoutBob = await logoutCurrent();
    assert.equal(logoutBob.status, 204);
    markTestCase("bob logout");

    const loginCharlie = await loginAs("charlie", "charlie_password_123");
    assert.equal(loginCharlie.status, 200);
    assert.ok(Number.isInteger(loginCharlie.body.visible_case_count));
    markTestCase("charlie login succeeds");

    const charlieCases = await request("/api/cases?page=1&page_size=200&sort_by=id&sort_dir=asc");
    assert.equal(charlieCases.status, 200);
    const charlieCaseIds = new Set(charlieCases.body.items.map((item) => Number(item.id)));
    assert.ok(charlieCases.body.pagination.total_count >= charlieCases.body.items.length);
    markTestCase("charlie cases list");

    if (!charlieCaseIds.has(bobForbiddenCaseId)) {
      const charlieForbiddenCase = await request(`/api/cases/${bobForbiddenCaseId}`);
      assert.equal(charlieForbiddenCase.status, 403);
    }
    markTestCase("charlie forbidden case detail when applicable");

    const logoutCharlie = await logoutCurrent();
    assert.equal(logoutCharlie.status, 204);
    markTestCase("charlie logout");

    const loginAlice = await loginAs("alice", "alice_password_123");
    assert.equal(loginAlice.status, 200);
    markTestCase("alice relogin");

    const me = await request("/api/auth/me");
    assert.equal(me.status, 200);
    assert.equal(me.body.user_name, "alice");
    markTestCase("auth me endpoint");

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
    markTestCase("user create");

    const userAuditAfterCreate = await request(`/api/audits?target_type=user&target_id=${createdUserId}`);
    assert.equal(userAuditAfterCreate.status, 200);
    assert.ok(
      userAuditAfterCreate.body.some((item) =>
        item.change_type === "STATUS_CHANGE" && item.old_value === "" && item.new_value === "ACT"
      )
    );
    assert.ok(userAuditAfterCreate.body.some((item) => item.change_type === "DATA_CHANGE"));
    assert.ok(userAuditAfterCreate.body.some((item) => item.change_type === "PASSWORD_CHANGE"));
    markTestCase("user create audit");

    const groupCreate = await request("/api/groups", {
      method: "POST",
      body: JSON.stringify({
        group_name: "auditor",
        status_code: "ACT"
      })
    });
    assert.equal(groupCreate.status, 201);
    const createdGroupId = groupCreate.body.id;
    markTestCase("group create");

    const groupAuditAfterCreate = await request(`/api/audits?target_type=group&target_id=${createdGroupId}`);
    assert.equal(groupAuditAfterCreate.status, 200);
    assert.ok(
      groupAuditAfterCreate.body.some((item) =>
        item.change_type === "STATUS_CHANGE" && item.old_value === "" && item.new_value === "ACT"
      )
    );
    assert.ok(groupAuditAfterCreate.body.some((item) => item.change_type === "DATA_CHANGE"));
    markTestCase("group create audit");

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
    markTestCase("user group create");

    const userGroupAuditAfterCreate = await request(`/api/audits?target_type=user_group&target_id=${createdUserGroupId}`);
    assert.equal(userGroupAuditAfterCreate.status, 200);
    assert.ok(
      userGroupAuditAfterCreate.body.some((item) =>
        item.change_type === "STATUS_CHANGE" && item.old_value === "" && item.new_value === "PEND"
      )
    );
    assert.ok(userGroupAuditAfterCreate.body.some((item) => item.change_type === "DATA_CHANGE"));
    markTestCase("user group create audit");

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
            draft: ["editor", "system1_api_key"],
            security_review: ["admin", "editor", "system1_api_key"],
            approved: ["admin", "viewer"]
          }
        }
      })
    });
    assert.equal(workflowCreate.status, 201);
    const createdWorkflowId = workflowCreate.body.id;
    markTestCase("workflow create");

    const workflowAuditAfterCreate = await request(`/api/audits?target_type=workflow&target_id=${createdWorkflowId}`);
    assert.equal(workflowAuditAfterCreate.status, 200);
    assert.ok(
      workflowAuditAfterCreate.body.some((item) =>
        item.change_type === "STATUS_CHANGE" && item.old_value === "" && item.new_value === "ACT"
      )
    );
    assert.ok(workflowAuditAfterCreate.body.some((item) => item.change_type === "DATA_CHANGE"));
    markTestCase("workflow create audit");

    const caseCreate = await request("/api/cases", {
      method: "POST",
      body: JSON.stringify({
        workflow_id: createdWorkflowId,
        case_title: "Infrastructure Rollout",
        stage_code: "draft",
        case_data: {
          title: "Infra Upgrade",
          severity: "high",
          owner: "alice"
        }
      })
    });
    assert.equal(caseCreate.status, 201);
    const createdCaseId = caseCreate.body.id;
    assert.equal(caseCreate.body.wf_name, "change_management");
    assert.equal(caseCreate.body.case_title, "Infrastructure Rollout");
    markTestCase("case create");

    const caseAuditAfterCreate = await request(`/api/audits?target_type=case&target_id=${createdCaseId}`);
    assert.equal(caseAuditAfterCreate.status, 200);
    assert.ok(
      caseAuditAfterCreate.body.some((item) =>
        item.change_type === "STATUS_CHANGE" && item.old_value === "" && item.new_value === "draft"
      )
    );
    assert.ok(caseAuditAfterCreate.body.some((item) => item.change_type === "DATA_CHANGE"));
    markTestCase("case create audit");

    const externalCaseCreate = await requestExternal("/external-api/cases", {
      method: "POST",
      body: JSON.stringify({
        workflow_id: createdWorkflowId,
        case_title: "External API Case",
        stage_code: "draft",
        case_data: {
          source: "system1",
          owner: "integration",
          severity: "medium"
        }
      })
    });
    assert.equal(externalCaseCreate.status, 201);
    const externalCreatedCaseId = externalCaseCreate.body.id;
    assert.equal(externalCaseCreate.body.case_title, "External API Case");
    markTestCase("external case create");

    const externalCreateAudit = await request(`/api/audits?target_type=case&target_id=${externalCreatedCaseId}`);
    assert.equal(externalCreateAudit.status, 200);
    assert.ok(
      externalCreateAudit.body.some((item) =>
        item.user_id === "system1_api_key"
        && item.change_type === "STATUS_CHANGE"
        && item.old_value === ""
        && item.new_value === "draft"
      )
    );
    assert.ok(
      externalCreateAudit.body.some((item) => item.user_id === "system1_api_key" && item.change_type === "DATA_CHANGE")
    );
    markTestCase("external case create audit");

    const externalList = await requestExternal("/external-api/cases?search=%7B%22source%22%3A%22system1%22%7D&sort_by=id&sort_dir=asc&page=1&page_size=20");
    assert.equal(externalList.status, 200);
    assert.ok(externalList.body.items.some((item) => item.id === externalCreatedCaseId));
    markTestCase("external case search");

    const externalNestedList = await requestExternal("/external-api/cases?search=%7B%22applicant%22%3A%7B%22region%22%3A%22APAC%22%7D%7D&sort_by=id&sort_dir=asc&page=1&page_size=20");
    assert.equal(externalNestedList.status, 200);
    assert.ok(externalNestedList.body.items.length >= 1);
    assert.ok(externalNestedList.body.items.some((item) => item.case_title === "Candidate A Onboarding"));
    markTestCase("external nested json search");

    const externalUpdatedCase = await requestExternal(`/external-api/cases/${externalCreatedCaseId}`, {
      method: "PUT",
      body: JSON.stringify({
        case_title: "External API Case Updated",
        stage_code: "security_review",
        case_data: {
          source: "system1",
          owner: "integration",
          severity: "high"
        }
      })
    });
    assert.equal(externalUpdatedCase.status, 200);
    assert.equal(externalUpdatedCase.body.case_title, "External API Case Updated");
    assert.equal(externalUpdatedCase.body.stage_code, "security_review");
    markTestCase("external case update");

    const externalAudit = await request(`/api/audits?target_type=case&target_id=${externalCreatedCaseId}`);
    assert.equal(externalAudit.status, 200);
    assert.ok(externalAudit.body.some((item) => item.user_id === "system1_api_key"));
    markTestCase("external case audit lookup");

    const commentCreate = await request("/api/comments", {
      method: "POST",
      body: JSON.stringify({
        case_id: createdCaseId,
        content: "Initial comment for this case."
      })
    });
    assert.equal(commentCreate.status, 201);
    assert.equal(commentCreate.body.display_name, "Alice Chen");
    markTestCase("case comment create");

    const commentList = await request(`/api/comments?case_id=${createdCaseId}`);
    assert.equal(commentList.status, 200);
    assert.ok(commentList.body.some((item) => item.content === "Initial comment for this case."));
    markTestCase("case comment list after create");

    const caseAuditAfterComment = await request(`/api/audits?target_type=case&target_id=${createdCaseId}`);
    assert.equal(caseAuditAfterComment.status, 200);
    assert.ok(caseAuditAfterComment.body.some((item) => item.change_type === "ADD_COMMENTS" && item.new_value === String(commentCreate.body.id)));
    markTestCase("comment audit on case");

    const commentDeleteNotAllowed = await request(`/api/comments/${commentCreate.body.id}`, {
      method: "DELETE"
    });
    assert.equal(commentDeleteNotAllowed.status, 404);
    markTestCase("comment delete not allowed");

    const invalidCaseStage = await request("/api/cases", {
      method: "POST",
      body: JSON.stringify({
        workflow_id: createdWorkflowId,
        case_title: "Invalid Stage Case",
        stage_code: "not_exists",
        case_data: {
          title: "Invalid Stage Case"
        }
      })
    });
    assert.equal(invalidCaseStage.status, 400);
    markTestCase("invalid case stage rejected");

    const users = await request("/api/users?search=Delta&sort_by=display_name&sort_dir=asc&page=1&page_size=20");
    assert.equal(users.status, 200);
    assert.ok(users.body.items.some((item) => item.id === createdUserId));
    assert.ok(users.body.pagination.total_count >= 1);
    markTestCase("users search");

    const groups = await request("/api/groups");
    assert.equal(groups.status, 200);
    assert.ok(groups.body.items.some((item) => item.id === createdGroupId));
    markTestCase("groups list includes created group");

    const userGroups = await request("/api/user-groups");
    assert.equal(userGroups.status, 200);
    assert.ok(userGroups.body.items.some((item) => item.id === createdUserGroupId));
    markTestCase("user groups list includes created relation");

    const workflows = await request("/api/workflows?search=change&sort_by=wf_name&sort_dir=asc&page=1&page_size=20");
    assert.equal(workflows.status, 200);
    assert.ok(workflows.body.items.some((item) => item.id === createdWorkflowId));
    assert.ok(workflows.body.pagination.total_count >= 1);
    markTestCase("workflows search");

    const cases = await request("/api/cases?search=Infrastructure&sort_by=case_title&sort_dir=asc&page=1&page_size=20");
    assert.equal(cases.status, 200);
    assert.ok(cases.body.items.some((item) => item.id === createdCaseId));
    assert.ok(cases.body.pagination.total_count >= 1);
    markTestCase("cases search");

    const casesByLastEditedAt = await request("/api/cases?sort_by=last_edited_at&sort_dir=desc&page=1&page_size=20");
    assert.equal(casesByLastEditedAt.status, 200);
    assert.ok(casesByLastEditedAt.body.items.some((item) => Object.hasOwn(item, "last_edited_at")));
    assert.ok(casesByLastEditedAt.body.items.some((item) => Object.hasOwn(item, "last_edited_by")));
    markTestCase("cases sort by last edited date");

    const casesByLastEditedBy = await request("/api/cases?sort_by=last_edited_by&sort_dir=asc&page=1&page_size=20");
    assert.equal(casesByLastEditedBy.status, 200);
    assert.ok(casesByLastEditedBy.body.items.some((item) => item.id === createdCaseId));
    markTestCase("cases sort by last edited by");

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
    markTestCase("user update");

    const userAudit = await request(`/api/audits?target_type=user&target_id=${createdUserId}`);
    assert.equal(userAudit.status, 200);
    assert.ok(userAudit.body.some((item) => item.change_type === "STATUS_CHANGE" && item.old_value === "ACT" && item.new_value === "INACT"));
    assert.ok(userAudit.body.some((item) => item.change_type === "DATA_CHANGE"));
    assert.ok(userAudit.body.some((item) => item.change_type === "PASSWORD_CHANGE" && item.old_value === "" && item.new_value === ""));
    markTestCase("user update audit");

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
    markTestCase("workflow update");

    const workflowAudit = await request(`/api/audits?target_type=workflow&target_id=${createdWorkflowId}`);
    assert.equal(workflowAudit.status, 200);
    assert.ok(workflowAudit.body.some((item) => item.change_type === "STATUS_CHANGE" && item.new_value === "PEND"));
    assert.ok(workflowAudit.body.some((item) => item.change_type === "DATA_CHANGE"));
    markTestCase("workflow update audit");

    const updatedCase = await request(`/api/cases/${createdCaseId}`, {
      method: "PUT",
      body: JSON.stringify({
        case_title: "Infrastructure Rollout",
        stage_code: "security_review",
        case_data: {
          title: "Infra Upgrade",
          severity: "high",
          owner: "alice"
        }
      })
    });
    assert.equal(updatedCase.status, 200);
    assert.equal(updatedCase.body.case_title, "Infrastructure Rollout");
    assert.equal(updatedCase.body.stage_code, "security_review");
    assert.equal(updatedCase.body.case_data.severity, "high");
    markTestCase("case stage update");

    const caseStatusAudit = await request(`/api/audits?target_type=case&target_id=${createdCaseId}`);
    assert.equal(caseStatusAudit.status, 200);
    assert.ok(caseStatusAudit.body.some((item) => item.change_type === "STATUS_CHANGE" && item.old_value === "draft" && item.new_value === "security_review"));
    markTestCase("case stage update audit");

    const updatedCaseData = await request(`/api/cases/${createdCaseId}`, {
      method: "PUT",
      body: JSON.stringify({
        case_title: "Infrastructure Rollout Updated",
        stage_code: "security_review",
        case_data: {
          title: "Infra Upgrade",
          severity: "critical",
          owner: "bob",
          metadata: {
            labels: ["prod", "network"],
            score: 87,
            checklist: {
              network: {
                dns: "done",
                firewall: "pending"
              }
            }
          },
          approved: true
        }
      })
    });
    assert.equal(updatedCaseData.status, 200);
    assert.equal(updatedCaseData.body.case_title, "Infrastructure Rollout Updated");
    assert.equal(updatedCaseData.body.case_data.severity, "critical");
    assert.deepEqual(updatedCaseData.body.case_data.metadata.labels, ["prod", "network"]);
    assert.equal(updatedCaseData.body.case_data.metadata.score, 87);
    assert.equal(updatedCaseData.body.case_data.metadata.checklist.network.dns, "done");
    assert.equal(updatedCaseData.body.case_data.metadata.checklist.network.firewall, "pending");
    assert.equal(updatedCaseData.body.case_data.approved, true);
    markTestCase("case data update");

    const caseAudit = await request(`/api/audits?target_type=case&target_id=${createdCaseId}`);
    assert.equal(caseAudit.status, 200);
    assert.ok(caseAudit.body.some((item) => item.change_type === "DATA_CHANGE"));
    markTestCase("case data update audit");

    const aiRiskSearch = await request("/api/ai/case-search", {
      method: "POST",
      body: JSON.stringify({
        prompt: "give me all cases that risk score greater than 5",
        page: 1,
        page_size: 50,
        sort_by: "id",
        sort_dir: "asc"
      })
    });
    assert.equal(aiRiskSearch.status, 200);
    assert.equal(aiRiskSearch.body.ai.plan.conditions[0].field, "case_data.metadata.score");
    assert.ok(aiRiskSearch.body.items.some((item) => Number(item.id) === Number(createdCaseId)));
    assert.ok(aiRiskSearch.body.items.every((item) => Number(item.case_data?.metadata?.score || 0) > 5));
    markTestCase("ai case search by risk score");

    const aiBobSearch = await request("/api/ai/case-search", {
      method: "POST",
      body: JSON.stringify({
        prompt: "list all cases assigned to bob or bob works on",
        page: 1,
        page_size: 50,
        sort_by: "last_edited_at",
        sort_dir: "desc"
      })
    });
    assert.equal(aiBobSearch.status, 200);
    assert.equal(aiBobSearch.body.ai.plan.match, "or");
    assert.ok(aiBobSearch.body.items.some((item) => Number(item.id) === Number(createdCaseId)));
    markTestCase("ai case search by bob relationship");

    const aiPlanReplay = await request("/api/ai/case-search", {
      method: "POST",
      body: JSON.stringify({
        plan: aiBobSearch.body.ai.plan,
        page: 1,
        page_size: 5,
        sort_by: "case_title",
        sort_dir: "asc"
      })
    });
    assert.equal(aiPlanReplay.status, 200);
    assert.ok(aiPlanReplay.body.pagination.total_count >= 1);
    assert.ok(aiPlanReplay.body.items.length <= 5);
    markTestCase("ai case search plan replay");

    const aiRetrySearch = await request("/api/ai/case-search", {
      method: "POST",
      body: JSON.stringify({
        prompt: "show all cases with quality score above 5",
        page: 1,
        page_size: 50,
        sort_by: "id",
        sort_dir: "asc"
      })
    });
    assert.equal(aiRetrySearch.status, 200);
    assert.ok(aiRetrySearch.body.items.some((item) => Number(item.id) === Number(createdCaseId)));
    assert.equal(aiRetrySearch.body.ai.plan.conditions[0].field, "case_data.metadata.score");
    markTestCase("ai case search retry after zero results");

    const aiLongPrompt = await request("/api/ai/case-search", {
      method: "POST",
      body: JSON.stringify({
        prompt: "x".repeat(1001),
        page: 1,
        page_size: 5
      })
    });
    assert.equal(aiLongPrompt.status, 400);
    markTestCase("ai case search prompt length enforced");

    const deleteUserGroup = await request(`/api/user-groups/${createdUserGroupId}`, {
      method: "DELETE"
    });
    assert.equal(deleteUserGroup.status, 204);
    markTestCase("user group delete");

    const userGroupAuditAfterDelete = await request(`/api/audits?target_type=user_group&target_id=${createdUserGroupId}`);
    assert.equal(userGroupAuditAfterDelete.status, 200);
    assert.ok(
      userGroupAuditAfterDelete.body.some((item) =>
        item.change_type === "REMOVE_USER_GROUP"
        && item.old_value === String(createdUserGroupId)
        && item.new_value === "0"
      )
    );
    markTestCase("user group delete audit");

    const deleteGroup = await request(`/api/groups/${createdGroupId}`, {
      method: "DELETE"
    });
    assert.equal(deleteGroup.status, 204);
    markTestCase("group delete");

    const groupAuditAfterDelete = await request(`/api/audits?target_type=group&target_id=${createdGroupId}`);
    assert.equal(groupAuditAfterDelete.status, 200);
    assert.ok(
      groupAuditAfterDelete.body.some((item) =>
        item.change_type === "REMOVE_GROUP"
        && item.old_value === String(createdGroupId)
        && item.new_value === "0"
      )
    );
    markTestCase("group delete audit");

    const deleteWorkflow = await request(`/api/workflows/${createdWorkflowId}`, {
      method: "DELETE"
    });
    assert.equal(deleteWorkflow.status, 400);
    markTestCase("workflow delete blocked while cases exist");

    const deleteCase = await request(`/api/cases/${createdCaseId}`, {
      method: "DELETE"
    });
    assert.equal(deleteCase.status, 204);
    markTestCase("case delete");

    const deletedCaseAudit = await queryUser(
      `SELECT change_type, old_value, new_value
       FROM tb_audit
       WHERE target_type = 'case'
         AND target_id = $1
       ORDER BY id DESC`,
      [createdCaseId]
    );
    assert.ok(
      deletedCaseAudit.rows.some((item) =>
        item.change_type === "REMOVE_CASE"
        && item.old_value === String(createdCaseId)
        && item.new_value === "0"
      )
    );
    markTestCase("case delete audit retained");

    const deleteExternalCase = await request(`/api/cases/${externalCreatedCaseId}`, {
      method: "DELETE"
    });
    assert.equal(deleteExternalCase.status, 204);
    markTestCase("external case delete");

    const deletedExternalCaseAudit = await queryUser(
      `SELECT user_id, change_type, old_value, new_value
       FROM tb_audit
       WHERE target_type = 'case'
         AND target_id = $1
       ORDER BY id DESC`,
      [externalCreatedCaseId]
    );
    assert.ok(
      deletedExternalCaseAudit.rows.some((item) =>
        item.change_type === "REMOVE_CASE"
        && item.old_value === String(externalCreatedCaseId)
        && item.new_value === "0"
      )
    );
    markTestCase("external case delete audit retained");

    const deleteWorkflowAfterCase = await request(`/api/workflows/${createdWorkflowId}`, {
      method: "DELETE"
    });
    assert.equal(deleteWorkflowAfterCase.status, 204);
    markTestCase("workflow delete after cases removed");

    const workflowAuditAfterDelete = await request(`/api/audits?target_type=workflow&target_id=${createdWorkflowId}`);
    assert.equal(workflowAuditAfterDelete.status, 200);
    assert.ok(
      workflowAuditAfterDelete.body.some((item) =>
        item.change_type === "REMOVE_WORKFLOW"
        && item.old_value === String(createdWorkflowId)
        && item.new_value === "0"
      )
    );
    markTestCase("workflow delete audit");

    const deleteUser = await request(`/api/users/${createdUserId}`, {
      method: "DELETE"
    });
    assert.equal(deleteUser.status, 204);
    markTestCase("user delete");

    const userAuditAfterDelete = await request(`/api/audits?target_type=user&target_id=${createdUserId}`);
    assert.equal(userAuditAfterDelete.status, 200);
    assert.ok(
      userAuditAfterDelete.body.some((item) =>
        item.change_type === "REMOVE_USER"
        && item.old_value === String(createdUserId)
        && item.new_value === "0"
      )
    );
    markTestCase("user delete audit");

    const logout = await logoutCurrent();
    assert.equal(logout.status, 204);
    markTestCase("final logout");

    const afterLogout = await request("/api/users", { useAuth: false });
    assert.equal(afterLogout.status, 401);
    markTestCase("post logout access blocked");

    console.log(`All integration tests passed. Total test cases: ${testCaseCounter}`);
  } finally {
    if (server) {
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

    if (aiMockServer) {
      await new Promise((resolve, reject) => {
        aiMockServer.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
