export function parseJsonInput(value, fieldLabel) {
  try {
    return JSON.parse(value);
  } catch (_error) {
    throw new Error(`${fieldLabel} format is invalid. Please enter valid JSON.`);
  }
}

export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

export function formatInlineValue(value) {
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  return String(value);
}

export function formatDetailValue(value) {
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }
  return String(value);
}

export function isMultilineValue(value, field = null) {
  if (field?.span === "full") {
    return true;
  }
  return typeof value === "object" && value !== null;
}

export function getDetailItemClass(field) {
  const classes = ["detail-item"];
  if (field?.span === "full") {
    classes.push("detail-item--full");
  }
  if (field?.tone === "meta") {
    classes.push("detail-item--meta");
  }
  return classes.join(" ");
}

export function formatDateTime(value) {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  return date.toLocaleString();
}

