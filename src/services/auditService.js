const crypto = require("node:crypto");
const auditModel = require("../models/auditModel");

function stableSerialize(value) {
  if (value === null || value === undefined) {
    return "null";
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerialize(item)).join(",")}]`;
  }

  if (typeof value === "object") {
    const keys = Object.keys(value).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${stableSerialize(value[key])}`).join(",")}}`;
  }

  return JSON.stringify(value);
}

function md5Of(value) {
  return crypto.createHash("md5").update(stableSerialize(value)).digest("hex");
}

function buildDataAuditValue(changes) {
  return `md5:${md5Of(changes)}`;
}

async function createEntries(entries, queryFn) {
  for (const entry of entries) {
    await auditModel.create(entry, queryFn);
  }
}

function buildUpdateAuditEntries({
  userId,
  targetId,
  targetType,
  previousRecord,
  nextRecord,
  statusField = "status_code",
  statusChangeType = "STATUS_CHANGE",
  dataFields = [],
  protectedFields = []
}) {
  const entries = [];

  if (statusField && previousRecord?.[statusField] !== nextRecord?.[statusField]) {
    entries.push({
      user_id: userId,
      target_id: targetId,
      target_type: targetType,
      change_type: statusChangeType,
      old_value: String(previousRecord?.[statusField] ?? ""),
      new_value: String(nextRecord?.[statusField] ?? "")
    });
  }

  for (const field of protectedFields) {
    const oldValue = previousRecord?.[field.name];
    const newValue = nextRecord?.[field.name];
    if (stableSerialize(oldValue) !== stableSerialize(newValue)) {
      entries.push({
        user_id: userId,
        target_id: targetId,
        target_type: targetType,
        change_type: field.changeType,
        old_value: "",
        new_value: ""
      });
    }
  }

  const oldData = {};
  const newData = {};

  for (const field of dataFields) {
    const oldValue = previousRecord?.[field];
    const newValue = nextRecord?.[field];
    if (stableSerialize(oldValue) !== stableSerialize(newValue)) {
      oldData[field] = oldValue ?? null;
      newData[field] = newValue ?? null;
    }
  }

  if (Object.keys(oldData).length > 0) {
    entries.push({
      user_id: userId,
      target_id: targetId,
      target_type: targetType,
      change_type: "DATA_CHANGE",
      old_value: buildDataAuditValue(oldData),
      new_value: buildDataAuditValue(newData)
    });
  }

  return entries;
}

function buildCommentAuditEntry({ userId, caseId, commentId }) {
  return {
    user_id: userId,
    target_id: caseId,
    target_type: "case",
    change_type: "ADD_COMMENTS",
    old_value: "0",
    new_value: String(commentId)
  };
}

module.exports = {
  buildCommentAuditEntry,
  buildUpdateAuditEntries,
  createEntries
};
