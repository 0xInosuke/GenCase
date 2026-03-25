function clampPageSize(value) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return 20;
  }

  return Math.min(parsed, 100);
}

function parsePositiveInteger(value, fallback) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

function normalizeSort(sortBy, sortDir, allowedFields, defaultField) {
  const resolvedField = allowedFields.includes(sortBy) ? sortBy : defaultField;
  const resolvedDirection = String(sortDir || "asc").toLowerCase() === "desc" ? "DESC" : "ASC";

  return {
    sortBy: resolvedField,
    sortDir: resolvedDirection
  };
}

function buildPagedResult(result, page, pageSize) {
  const totalCount = Number(result.rows[0]?.total_count || 0);

  return {
    items: result.rows.map(({ total_count, ...row }) => row),
    pagination: {
      page,
      page_size: pageSize,
      total_count: totalCount,
      total_pages: totalCount === 0 ? 0 : Math.ceil(totalCount / pageSize)
    }
  };
}

module.exports = {
  buildPagedResult,
  clampPageSize,
  normalizeSort,
  parsePositiveInteger
};
