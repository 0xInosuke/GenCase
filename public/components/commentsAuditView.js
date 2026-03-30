export function renderCaseComments({
  state,
  escapeHtml,
  formatDateTime
}) {
  const section = document.getElementById("case-comments");
  const list = document.getElementById("case-comments-list");
  if (state.activeModel !== "cases" || !state.selectedRecord) {
    section.classList.add("hidden");
    list.innerHTML = "";
    return;
  }

  section.classList.remove("hidden");
  if (!Array.isArray(state.caseComments) || state.caseComments.length === 0) {
    list.innerHTML = "<p class=\"readonly-note\">No comments yet.</p>";
    return;
  }

  list.innerHTML = state.caseComments.map((comment) => `
    <article class="comment-item">
      <div class="comment-meta">
        <strong>${escapeHtml(comment.display_name || "Unknown User")}</strong>
        <span>${escapeHtml(formatDateTime(comment.created_time))}</span>
      </div>
      <p>${escapeHtml(comment.content || "")}</p>
    </article>
  `).join("");
}

export function renderAuditRecords({
  state,
  escapeHtml,
  formatDateTime,
  formatDetailValue
}) {
  const section = document.getElementById("audit-records");
  const list = document.getElementById("audit-records-list");
  const toggleButton = document.getElementById("toggle-audit-button");

  if (!state.selectedRecord) {
    section.classList.add("hidden");
    list.innerHTML = "";
    section.classList.remove("audit-collapsed");
    return;
  }

  section.classList.remove("hidden");
  section.classList.toggle("audit-collapsed", !state.auditExpanded);
  toggleButton.textContent = state.auditExpanded ? "Collapse" : "Expand";
  if (!Array.isArray(state.auditRecords) || state.auditRecords.length === 0) {
    list.innerHTML = "<p class=\"readonly-note\">No audit records yet.</p>";
    return;
  }

  list.innerHTML = state.auditRecords.map((audit) => `
    <article class="audit-item">
      <div class="comment-meta">
        <strong>${escapeHtml(audit.display_name || "System")}</strong>
        <span>${escapeHtml(formatDateTime(audit.timestamp))}</span>
      </div>
      <div><strong>${escapeHtml(audit.change_type)}</strong></div>
      <div><span class="readonly-note">Old Value</span><br><code>${escapeHtml(formatDetailValue(audit.old_value))}</code></div>
      <div><span class="readonly-note">New Value</span><br><code>${escapeHtml(formatDetailValue(audit.new_value))}</code></div>
    </article>
  `).join("");
}

