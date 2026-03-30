export function renderList({
  config,
  state,
  escapeHtml,
  formatInlineValue,
  onSort,
  onOpenDetail
}) {
  const target = document.getElementById("list-table");
  const rows = state.records[state.activeModel];

  if (rows.length === 0) {
    target.innerHTML = "<p>No records found.</p>";
    return;
  }

  const headers = config.listColumns.map((column) => {
    if (!column.sortable) {
      return `<th>${column.label}</th>`;
    }

    const currentSort = state.sort[state.activeModel];
    const directionMarker = currentSort.sortBy === column.key ? (currentSort.sortDir === "asc" ? " [asc]" : " [desc]") : "";
    return `<th><button type="button" data-sort="${column.key}">${column.label}${directionMarker}</button></th>`;
  }).join("");

  const body = rows.map((row) => `
    <tr data-row-id="${row.id}">
      ${config.listColumns.map((column) => `<td>${escapeHtml(formatInlineValue(row[column.key]))}</td>`).join("")}
    </tr>
  `).join("");
  const colgroup = config.listColumns
    .map((column) => `<col style="width:${column.width || "auto"}">`)
    .join("");

  target.innerHTML = `
    <table>
      <colgroup>${colgroup}</colgroup>
      <thead><tr>${headers}</tr></thead>
      <tbody>${body}</tbody>
    </table>
  `;

  target.querySelectorAll("[data-sort]").forEach((button) => {
    button.addEventListener("click", async () => {
      await onSort(button.dataset.sort);
    });
  });

  target.querySelectorAll("[data-row-id]").forEach((rowEl) => {
    rowEl.addEventListener("click", async () => {
      await onOpenDetail(Number(rowEl.dataset.rowId));
    });
  });
}

export function renderPagination(state) {
  const pagination = state.pagination[state.activeModel];
  document.getElementById("page-indicator").textContent = pagination.total_pages === 0
    ? "No pages"
    : `Page ${pagination.page} / ${pagination.total_pages} (${pagination.total_count} records)`;
  document.getElementById("prev-page").disabled = pagination.page <= 1;
  document.getElementById("next-page").disabled = pagination.total_pages === 0 || pagination.page >= pagination.total_pages;
}

