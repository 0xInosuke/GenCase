function renderNestedBlocks(value, path, deps) {
  const { escapeHtml, formatDetailValue } = deps;

  if (!value || typeof value !== "object") {
    return `<div class="detail-nested-block"><p>${escapeHtml(path[path.length - 1] || "Value")}</p><div class="detail-nested-value">${escapeHtml(formatDetailValue(value))}</div></div>`;
  }

  const entries = Array.isArray(value)
    ? value.map((item, index) => [String(index), item])
    : Object.entries(value);

  return `
    <div class="detail-nested">
      <div class="detail-nested-level">
        ${entries.map(([key, childValue]) => {
          const isObject = childValue && typeof childValue === "object";
          const blockClass = isObject ? "detail-nested-block detail-nested-block--full" : "detail-nested-block";
          return `
            <section class="${blockClass}">
              <p>${escapeHtml(key)}</p>
              ${isObject
                ? renderNestedBlocks(childValue, [...path, key], deps)
                : `<div class="detail-nested-value">${escapeHtml(formatDetailValue(childValue))}</div>`}
            </section>
          `;
        }).join("")}
      </div>
    </div>
  `;
}

export function renderDetail({
  config,
  state,
  escapeHtml,
  formatDetailValue,
  isMultilineValue,
  getDetailItemClass,
  formatDateTime
}) {
  const target = document.getElementById("detail-content");
  document.getElementById("detail-title").textContent = `${config.label} Detail`;

  const detailHtml = config.detailFields.map((field) => {
    const rawValue = state.selectedRecord?.[field.key];
    const formattedValue = field.key.endsWith("_at") || field.key === "timestamp"
      ? formatDateTime(rawValue)
      : formatDetailValue(rawValue);
    const nestedValue = state.activeModel === "cases" && field.key === "case_data"
      ? renderNestedBlocks(rawValue, [], { escapeHtml, formatDetailValue })
      : "";
    const isNestedCaseData = Boolean(nestedValue);
    const valueClass = isMultilineValue(rawValue, field) ? "detail-value detail-value--multiline" : "detail-value";
    const valueTag = isMultilineValue(rawValue, field) ? "pre" : "div";

    return `
      <div class="${getDetailItemClass(field)}">
        <p>${field.label}</p>
        ${isNestedCaseData ? nestedValue : `<${valueTag} class="${valueClass}">${escapeHtml(formattedValue)}</${valueTag}>`}
      </div>
    `;
  }).join("");

  const workflowGuideLink = state.activeModel === "workflows"
    ? `
      <div class="detail-item detail-item--full detail-item--meta">
        <p>Workflow JSON Guide</p>
        <div class="detail-value">
          <a href="/WORKFLOW.md" target="_blank" rel="noopener noreferrer">Open WORKFLOW.md</a>
        </div>
      </div>
    `
    : "";

  target.innerHTML = `${detailHtml}${workflowGuideLink}`;
}
