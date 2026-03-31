const caseModel = require("../models/caseModel");

function collectJsonPathsFromValue(value, currentPath, collector) {
  if (Array.isArray(value)) {
    collector.add(currentPath);
    for (const item of value) {
      if (item && typeof item === "object") {
        collectJsonPathsFromValue(item, currentPath, collector);
      }
    }
    return;
  }

  if (!value || typeof value !== "object") {
    if (currentPath) {
      collector.add(currentPath);
    }
    return;
  }

  for (const [key, nestedValue] of Object.entries(value)) {
    const nextPath = currentPath ? `${currentPath}.${key}` : `case_data.${key}`;
    collector.add(nextPath);
    collectJsonPathsFromValue(nestedValue, nextPath, collector);
  }
}

function getFieldValue(record, field) {
  if (field === "case_title" || field === "wf_name" || field === "stage_code") {
    return record[field];
  }

  const path = field.replace(/^case_data\./, "").split(".");
  let current = record.case_data;
  for (const segment of path) {
    if (!current || typeof current !== "object") {
      return undefined;
    }
    current = current[segment];
  }
  return current;
}

function normalizeString(value) {
  return String(value ?? "").trim().toLowerCase();
}

function toNumber(value) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function valuesEqual(left, right) {
  const leftNumber = toNumber(left);
  const rightNumber = toNumber(right);
  if (leftNumber !== null && rightNumber !== null) {
    return leftNumber === rightNumber;
  }

  if (typeof left === "boolean" || typeof right === "boolean") {
    return left === right;
  }

  return normalizeString(left) === normalizeString(right);
}

function compareNumbers(actual, expected, operator) {
  const actualNumber = toNumber(actual);
  const expectedNumber = toNumber(expected);
  if (actualNumber === null || expectedNumber === null) {
    return false;
  }

  if (operator === "gt") {
    return actualNumber > expectedNumber;
  }
  if (operator === "gte") {
    return actualNumber >= expectedNumber;
  }
  if (operator === "lt") {
    return actualNumber < expectedNumber;
  }
  return actualNumber <= expectedNumber;
}

function matchCondition(record, condition) {
  if (Array.isArray(condition.conditions)) {
    return matchPlan(record, condition);
  }

  const actualValue = getFieldValue(record, condition.field);

  if (condition.operator === "eq") {
    return valuesEqual(actualValue, condition.value);
  }

  if (condition.operator === "contains") {
    if (Array.isArray(actualValue)) {
      return actualValue.some((item) => valuesEqual(item, condition.value));
    }

    return normalizeString(actualValue).includes(normalizeString(condition.value));
  }

  if (condition.operator === "in") {
    if (!Array.isArray(condition.value)) {
      return false;
    }

    if (Array.isArray(actualValue)) {
      return actualValue.some((item) => condition.value.some((expected) => valuesEqual(item, expected)));
    }

    return condition.value.some((expected) => valuesEqual(actualValue, expected));
  }

  return compareNumbers(actualValue, condition.value, condition.operator);
}

function matchPlan(record, plan) {
  if (plan.match === "or") {
    return plan.conditions.some((condition) => matchCondition(record, condition));
  }

  return plan.conditions.every((condition) => matchCondition(record, condition));
}

function compareForSort(left, right, sortBy, sortDir) {
  const leftValue = left?.[sortBy] ?? null;
  const rightValue = right?.[sortBy] ?? null;

  if (leftValue === rightValue) {
    return Number(left.id) - Number(right.id);
  }

  if (leftValue === null || leftValue === undefined || leftValue === "") {
    return 1;
  }
  if (rightValue === null || rightValue === undefined || rightValue === "") {
    return -1;
  }

  let result = 0;
  if (sortBy === "id" || sortBy === "workflow_id") {
    result = Number(leftValue) - Number(rightValue);
  } else if (sortBy === "last_edited_at" || sortBy === "created_at") {
    result = Date.parse(leftValue) - Date.parse(rightValue);
  } else {
    result = String(leftValue).localeCompare(String(rightValue), undefined, { sensitivity: "base" });
  }

  if (result === 0) {
    result = Number(left.id) - Number(right.id);
  }

  return sortDir === "desc" ? -result : result;
}

function runCaseSearchOnCases(visibleCases, plan, options) {
  const matchedCases = visibleCases
    .filter((item) => matchPlan(item, plan))
    .sort((left, right) => compareForSort(left, right, options.sortBy, options.sortDir));

  const totalCount = matchedCases.length;
  const totalPages = totalCount === 0 ? 0 : Math.ceil(totalCount / options.pageSize);
  const offset = (options.page - 1) * options.pageSize;

  return {
    items: matchedCases.slice(offset, offset + options.pageSize),
    pagination: {
      page: options.page,
      page_size: options.pageSize,
      total_pages: totalPages,
      total_count: totalCount
    }
  };
}

function buildSearchContextFromCases(visibleCases) {
  const workflowNames = new Set();
  const stageCodes = new Set();
  const jsonPaths = new Set();

  for (const item of visibleCases) {
    if (item.wf_name) {
      workflowNames.add(String(item.wf_name));
    }
    if (item.stage_code) {
      stageCodes.add(String(item.stage_code));
    }
    collectJsonPathsFromValue(item.case_data, "", jsonPaths);
  }

  return {
    visibleCaseCount: visibleCases.length,
    workflowNames: Array.from(workflowNames).sort((left, right) => left.localeCompare(right)).slice(0, 20),
    stageCodes: Array.from(stageCodes).sort((left, right) => left.localeCompare(right)).slice(0, 20),
    jsonPaths: Array.from(jsonPaths).sort((left, right) => left.localeCompare(right)).slice(0, 80)
  };
}

async function runCaseSearchForUser(userId, plan, options) {
  const visibleCases = await caseModel.listAllCasesForAi(userId);
  return runCaseSearchOnCases(visibleCases, plan, options);
}

module.exports = {
  runCaseSearchForUser,
  runCaseSearchOnCases,
  buildSearchContextFromCases
};
