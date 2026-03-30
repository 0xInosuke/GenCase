function sanitizeFilePart(value) {
  return String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    || "case";
}

function formatDateTime(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toISOString();
}

function buildFilename(caseExport, extension) {
  const caseRecord = caseExport?.case || {};
  const titlePart = sanitizeFilePart(caseRecord.case_title);
  const idPart = sanitizeFilePart(caseRecord.id);
  return `case_${idPart}_${titlePart}.${extension}`;
}

function triggerDownload(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function stringifyJson(caseExport) {
  return JSON.stringify(caseExport, null, 2);
}

function stringifyMarkdown(caseExport) {
  const caseRecord = caseExport?.case || {};
  const comments = Array.isArray(caseExport?.comments) ? caseExport.comments : [];

  const headerLines = [
    `# Case Export: ${caseRecord.case_title || caseRecord.id || "Case"}`,
    "",
    "## Case Summary",
    "",
    `- Exported At: ${formatDateTime(caseExport?.exported_at)}`,
    `- Case ID: ${caseRecord.id ?? ""}`,
    `- Workflow ID: ${caseRecord.workflow_id ?? ""}`,
    `- Workflow Name: ${caseRecord.wf_name ?? ""}`,
    `- Case Title: ${caseRecord.case_title ?? ""}`,
    `- Stage Code: ${caseRecord.stage_code ?? ""}`,
    `- Created At: ${formatDateTime(caseRecord.created_at)}`,
    `- Updated At: ${formatDateTime(caseRecord.updated_at)}`,
    "",
    "## Case Data",
    "",
    "```json",
    JSON.stringify(caseRecord.case_data ?? {}, null, 2),
    "```",
    "",
    "## Comments",
    ""
  ];

  if (comments.length === 0) {
    headerLines.push("No comments.");
    return headerLines.join("\n");
  }

  const commentSections = comments.flatMap((comment, index) => ([
    `### Comment ${index + 1}`,
    `- Author: ${comment.author ?? ""}`,
    `- Created Time: ${formatDateTime(comment.created_time)}`,
    `- Content:`,
    "",
    comment.content || "",
    ""
  ]));

  return [...headerLines, ...commentSections].join("\n");
}

export function downloadCaseExportJson(caseExport) {
  triggerDownload(
    buildFilename(caseExport, "json"),
    stringifyJson(caseExport),
    "application/json;charset=utf-8"
  );
}

export function downloadCaseExportMarkdown(caseExport) {
  triggerDownload(
    buildFilename(caseExport, "md"),
    stringifyMarkdown(caseExport),
    "text/markdown;charset=utf-8"
  );
}
