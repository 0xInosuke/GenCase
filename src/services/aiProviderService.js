const { getAiConfig } = require("../config/env");

const ALLOWED_FIELDS = new Set([
  "case_title",
  "wf_name",
  "stage_code",
  "last_edited_by",
  "comment_authors",
  "comment_user_names",
  "comment_contents"
]);

const ALLOWED_OPERATORS = new Set([
  "eq",
  "contains",
  "gt",
  "gte",
  "lt",
  "lte",
  "in"
]);

const CASE_SEARCH_DESIGN_GUIDE = `
You translate natural-language case search requests into a strict JSON plan for GenCase.

Business rules:
- Search only applies to cases already visible to the logged-in user.
- Do not generate SQL.
- Do not invent new fields or actions.
- Supported top-level fields: case_title, wf_name, stage_code, last_edited_by, comment_authors, comment_user_names, comment_contents.
- JSON fields must use case_data.<path>, for example case_data.owner or case_data.metadata.score.
- Supported operators: eq, contains, gt, gte, lt, lte, in.
- Use contains for text fragments or array membership checks.
- Use eq for exact matches.
- Use gt/gte/lt/lte only for numeric comparisons.
- Use in only when the value should be an array.
- Combine conditions with match = "and" or "or".

Output JSON shape:
{
  "explanation": "short plain-language summary",
  "plan": {
    "match": "and",
    "conditions": [
      { "field": "case_data.metadata.score", "operator": "gt", "value": 5 }
    ]
  }
}

Examples:
- "give me all cases that risk score greater than 5"
  => case_data.metadata.score gt 5
- "list all cases assigned to bob or bob works on"
  => or over case_data.owner, case_data.assignee, case_data.assigned_to, case_data.participants
- "all cases alice replied"
  => comment_authors contains "alice" or comment_user_names contains "alice"
`;

const SEMANTIC_CASE_SEARCH_GUIDE = `
You help GenCase perform semantic case search over pre-filtered candidate case summaries.

Business rules:
- Only use the candidate cases provided in the prompt.
- Return only case IDs from that candidate list.
- Do not invent IDs or fields.
- Prefer recall over strict wording matches when the case summary clearly matches the user's intent.
- If nothing matches, return an empty array.

Output JSON shape:
{
  "explanation": "short plain-language summary",
  "matched_case_ids": [12, 19]
}
`;

const SEMANTIC_INTENT_GUIDE = `
You analyze a natural-language GenCase search request before candidate selection.

Business rules:
- Summarize the user's intent clearly.
- Extract the major filters or concepts that should matter during candidate selection.
- Do not invent database fields or IDs.

Output JSON shape:
{
  "summary": "short summary of the user's search intent",
  "signals": ["risk score above 5", "replied by bob"]
}
`;

function buildContextBlock(context = {}) {
  const lines = [];

  if (Number.isInteger(context.visibleCaseCount)) {
    lines.push(`Visible case count: ${context.visibleCaseCount}`);
  }

  if (Array.isArray(context.workflowNames) && context.workflowNames.length > 0) {
    lines.push(`Visible workflow names: ${context.workflowNames.join(", ")}`);
  }

  if (Array.isArray(context.stageCodes) && context.stageCodes.length > 0) {
    lines.push(`Visible stage codes: ${context.stageCodes.join(", ")}`);
  }

  if (Array.isArray(context.commentAuthors) && context.commentAuthors.length > 0) {
    lines.push(`Observed comment authors: ${context.commentAuthors.join(", ")}`);
  }

  if (Array.isArray(context.jsonPaths) && context.jsonPaths.length > 0) {
    lines.push(`Observed case_data paths: ${context.jsonPaths.join(", ")}`);
  }

  if (context.zeroResultRetry === true) {
    lines.push("Previous search plan returned zero visible results. Broaden carefully using the observed paths when appropriate.");
  }

  if (context.previousPlan) {
    lines.push(`Previous zero-result plan: ${JSON.stringify(context.previousPlan)}`);
  }

  if (lines.length === 0) {
    return "";
  }

  return `\n\nLive GenCase search context:\n${lines.map((line) => `- ${line}`).join("\n")}`;
}

function isCaseDataField(field) {
  return typeof field === "string" && /^case_data(?:\.[A-Za-z0-9_]+)+$/.test(field);
}

function validateCondition(condition) {
  if (!condition || typeof condition !== "object" || Array.isArray(condition)) {
    throw new Error("AI plan conditions must be objects.");
  }

  if (Array.isArray(condition.conditions)) {
    return validatePlan(condition);
  }

  const field = String(condition.field || "").trim();
  const operator = String(condition.operator || "").trim();

  if (!ALLOWED_FIELDS.has(field) && !isCaseDataField(field)) {
    throw new Error(`AI plan field is not supported: ${field || "<empty>"}`);
  }

  if (!ALLOWED_OPERATORS.has(operator)) {
    throw new Error(`AI plan operator is not supported: ${operator || "<empty>"}`);
  }

  if (operator === "in" && !Array.isArray(condition.value)) {
    throw new Error("AI plan operator 'in' requires an array value.");
  }

  return {
    field,
    operator,
    value: condition.value
  };
}

function validatePlan(plan) {
  if (!plan || typeof plan !== "object" || Array.isArray(plan)) {
    throw new Error("AI plan must be a JSON object.");
  }

  const match = String(plan.match || "and").toLowerCase();
  if (!["and", "or"].includes(match)) {
    throw new Error("AI plan match must be 'and' or 'or'.");
  }

  if (!Array.isArray(plan.conditions) || plan.conditions.length === 0) {
    throw new Error("AI plan must contain at least one condition.");
  }

  return {
    match,
    conditions: plan.conditions.map(validateCondition)
  };
}

function parseAiResponseBody(body) {
  const content = body?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new Error("AI provider returned an empty response.");
  }

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (_error) {
    throw new Error("AI provider returned invalid JSON content.");
  }

  return {
    explanation: String(parsed.explanation || "").trim(),
    plan: validatePlan(parsed.plan)
  };
}

function parseSemanticAiResponseBody(body, candidateIds) {
  const content = body?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new Error("AI provider returned an empty response.");
  }

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (_error) {
    throw new Error("AI provider returned invalid JSON content.");
  }

  const matchedIds = Array.isArray(parsed.matched_case_ids)
    ? parsed.matched_case_ids
      .map((item) => Number(item))
      .filter((item) => Number.isInteger(item) && candidateIds.has(item))
    : [];

  return {
    explanation: String(parsed.explanation || "").trim(),
    matchedCaseIds: Array.from(new Set(matchedIds))
  };
}

function parseSemanticIntentResponseBody(body) {
  const content = body?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new Error("AI provider returned an empty response.");
  }

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (_error) {
    throw new Error("AI provider returned invalid JSON content.");
  }

  return {
    summary: String(parsed.summary || "").trim(),
    signals: Array.isArray(parsed.signals)
      ? parsed.signals.map((item) => String(item || "").trim()).filter(Boolean).slice(0, 12)
      : []
  };
}

async function interpretCaseSearchPrompt(prompt, context = {}) {
  const config = getAiConfig();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const response = await fetch(config.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: config.model,
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `${CASE_SEARCH_DESIGN_GUIDE.trim()}${buildContextBlock(context)}`
          },
          {
            role: "user",
            content: String(prompt || "").trim()
          }
        ]
      })
    });

    if (!response.ok) {
      const details = await response.text();
      const error = new Error(`AI provider request failed with status ${response.status}.`);
      error.statusCode = 502;
      error.details = details;
      throw error;
    }

    const body = await response.json();
    return parseAiResponseBody(body);
  } catch (error) {
    if (error.name === "AbortError") {
      error.statusCode = 504;
      error.message = "AI provider request timed out.";
    }

    if (!error.statusCode) {
      error.statusCode = 502;
    }

    throw error;
  } finally {
    clearTimeout(timer);
  }
}

async function interpretSemanticCaseSearchPrompt(prompt, semanticContext = {}) {
  const config = getAiConfig();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeoutMs);
  const candidateSummaries = Array.isArray(semanticContext.candidates)
    ? semanticContext.candidates.map((item) => ({
      id: Number(item.id),
      title: item.title,
      workflow: item.workflow,
      stage: item.stage,
      lastEditedBy: item.lastEditedBy,
      commentAuthors: item.commentAuthors,
      commentPreview: item.commentPreview,
      keyFacts: item.keyFacts
    }))
    : [];
  const candidateIds = new Set(candidateSummaries.map((item) => Number(item.id)));

  try {
    const response = await fetch(config.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: config.model,
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `${SEMANTIC_CASE_SEARCH_GUIDE.trim()}

Visible case count: ${Number.isInteger(semanticContext.visibleCaseCount) ? semanticContext.visibleCaseCount : candidateSummaries.length}
Candidate case count: ${candidateSummaries.length}
Semantic intent summary: ${semanticContext.intent?.summary || ""}
Semantic intent signals: ${Array.isArray(semanticContext.intent?.signals) ? semanticContext.intent.signals.join(", ") : ""}
Candidate case summaries JSON:
${JSON.stringify(candidateSummaries)}`
          },
          {
            role: "user",
            content: String(prompt || "").trim()
          }
        ]
      })
    });

    if (!response.ok) {
      const details = await response.text();
      const error = new Error(`AI provider request failed with status ${response.status}.`);
      error.statusCode = 502;
      error.details = details;
      throw error;
    }

    const body = await response.json();
    return parseSemanticAiResponseBody(body, candidateIds);
  } catch (error) {
    if (error.name === "AbortError") {
      error.statusCode = 504;
      error.message = "AI provider request timed out.";
    }

    if (!error.statusCode) {
      error.statusCode = 502;
    }

    throw error;
  } finally {
    clearTimeout(timer);
  }
}

async function interpretSemanticIntentPrompt(prompt) {
  const config = getAiConfig();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const response = await fetch(config.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: config.model,
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: SEMANTIC_INTENT_GUIDE.trim()
          },
          {
            role: "user",
            content: String(prompt || "").trim()
          }
        ]
      })
    });

    if (!response.ok) {
      const details = await response.text();
      const error = new Error(`AI provider request failed with status ${response.status}.`);
      error.statusCode = 502;
      error.details = details;
      throw error;
    }

    const body = await response.json();
    return parseSemanticIntentResponseBody(body);
  } catch (error) {
    if (error.name === "AbortError") {
      error.statusCode = 504;
      error.message = "AI provider request timed out.";
    }

    if (!error.statusCode) {
      error.statusCode = 502;
    }

    throw error;
  } finally {
    clearTimeout(timer);
  }
}

module.exports = {
  interpretCaseSearchPrompt,
  interpretSemanticIntentPrompt,
  interpretSemanticCaseSearchPrompt,
  validatePlan
};
