const crypto = require("node:crypto");
const caseModel = require("../models/caseModel");

const semanticSnapshotCache = new Map();
const STOP_WORDS = new Set([
  "a",
  "all",
  "an",
  "and",
  "are",
  "assigned",
  "be",
  "by",
  "cases",
  "find",
  "for",
  "from",
  "give",
  "greater",
  "in",
  "is",
  "list",
  "me",
  "of",
  "on",
  "or",
  "replied",
  "score",
  "show",
  "than",
  "that",
  "the",
  "to",
  "where",
  "with",
  "works"
]);

function normalizeToken(value) {
  return String(value || "").trim().toLowerCase();
}

function tokenizePrompt(prompt) {
  return Array.from(new Set(
    normalizeToken(prompt)
      .split(/[^a-z0-9_]+/)
      .filter((token) => token.length >= 2 && !STOP_WORDS.has(token))
  ));
}

function collectPrimitiveFacts(value, currentPath, collector) {
  if (collector.length >= 24) {
    return;
  }

  if (Array.isArray(value)) {
    const scalarItems = value
      .filter((item) => item === null || ["string", "number", "boolean"].includes(typeof item))
      .slice(0, 6);
    if (scalarItems.length > 0 && currentPath) {
      collector.push({
        path: currentPath,
        value: scalarItems.map((item) => String(item)).join(", ")
      });
    }
    for (const item of value) {
      if (collector.length >= 24) {
        return;
      }
      if (item && typeof item === "object") {
        collectPrimitiveFacts(item, currentPath, collector);
      }
    }
    return;
  }

  if (!value || typeof value !== "object") {
    if (currentPath) {
      collector.push({
        path: currentPath,
        value: value === null || value === undefined ? "" : String(value)
      });
    }
    return;
  }

  for (const [key, nestedValue] of Object.entries(value)) {
    if (collector.length >= 24) {
      return;
    }
    const nextPath = currentPath ? `${currentPath}.${key}` : key;
    collectPrimitiveFacts(nestedValue, nextPath, collector);
  }
}

function buildSearchableText(record, facts) {
  const parts = [
    record.case_title,
    record.wf_name,
    record.stage_code,
    record.last_edited_by,
    ...(record.comment_authors || []),
    ...(record.comment_user_names || []),
    ...(record.comment_contents || []).slice(0, 5),
    ...facts.map((item) => `${item.path} ${item.value}`)
  ];

  return parts
    .filter((item) => item !== null && item !== undefined && String(item).trim() !== "")
    .map((item) => String(item).toLowerCase())
    .join(" ");
}

function createCaseSnapshot(record) {
  const facts = [];
  collectPrimitiveFacts(record.case_data, "", facts);

  return {
    id: Number(record.id),
    title: record.case_title || "",
    workflow: record.wf_name || "",
    stage: record.stage_code || "",
    lastEditedBy: record.last_edited_by || "",
    lastEditedAt: record.last_edited_at || "",
    commentAuthors: Array.from(new Set([...(record.comment_authors || []), ...(record.comment_user_names || [])])).slice(0, 8),
    commentPreview: (record.comment_contents || []).slice(0, 3).map((item) => String(item).slice(0, 180)),
    keyFacts: facts,
    searchText: buildSearchableText(record, facts)
  };
}

function buildVisibilityFingerprint(visibleCases) {
  const summary = visibleCases.map((item) => [
    item.id,
    item.stage_code,
    item.updated_at,
    item.last_edited_at,
    (item.comment_contents || []).length
  ].join("|")).join(";");

  return crypto.createHash("md5").update(summary).digest("hex");
}

function getCachedSnapshotBundle(userId, visibleCases) {
  const fingerprint = buildVisibilityFingerprint(visibleCases);
  const cacheKey = `${userId}:${fingerprint}`;
  const existing = semanticSnapshotCache.get(cacheKey);

  if (existing) {
    return existing;
  }

  const snapshots = visibleCases.map(createCaseSnapshot);
  const bundle = { fingerprint, snapshots };
  semanticSnapshotCache.set(cacheKey, bundle);

  if (semanticSnapshotCache.size > 20) {
    const firstKey = semanticSnapshotCache.keys().next().value;
    semanticSnapshotCache.delete(firstKey);
  }

  return bundle;
}

function scoreSnapshot(snapshot, tokens) {
  if (tokens.length === 0) {
    return 0;
  }

  const titleText = normalizeToken(snapshot.title);
  const workflowText = normalizeToken(snapshot.workflow);
  const stageText = normalizeToken(snapshot.stage);
  const authorText = snapshot.commentAuthors.map(normalizeToken).join(" ");
  const searchText = snapshot.searchText;

  let score = 0;
  for (const token of tokens) {
    if (titleText.includes(token)) {
      score += 8;
    }
    if (workflowText.includes(token) || stageText.includes(token)) {
      score += 5;
    }
    if (authorText.includes(token)) {
      score += 6;
    }
    if (searchText.includes(token)) {
      score += 2;
    }
  }

  return score;
}

function selectCandidateSnapshots(snapshots, prompt, limit) {
  if (snapshots.length <= limit) {
    return snapshots;
  }

  const tokens = tokenizePrompt(prompt);
  const ranked = snapshots
    .map((snapshot) => ({
      snapshot,
      score: scoreSnapshot(snapshot, tokens)
    }))
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      const leftTime = Date.parse(left.snapshot.lastEditedAt || 0);
      const rightTime = Date.parse(right.snapshot.lastEditedAt || 0);
      if (rightTime !== leftTime) {
        return rightTime - leftTime;
      }

      return left.snapshot.id - right.snapshot.id;
    });

  return ranked.slice(0, limit).map((item) => item.snapshot);
}

async function buildSemanticSearchContext(userId, prompt, candidateLimit) {
  const visibleCases = await caseModel.listAllCasesForAi(userId);
  const bundle = getCachedSnapshotBundle(userId, visibleCases);
  const candidates = selectCandidateSnapshots(bundle.snapshots, prompt, candidateLimit);

  return {
    visibleCases,
    fingerprint: bundle.fingerprint,
    candidates,
    candidateIds: new Set(candidates.map((item) => Number(item.id)))
  };
}

module.exports = {
  buildSemanticSearchContext
};
