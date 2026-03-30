export function createInitialState() {
  return {
    activeModel: "users",
    view: "list",
    records: {
      users: [],
      groups: [],
      "user-groups": [],
      workflows: [],
      cases: []
    },
    pagination: {
      users: { page: 1, page_size: 20, total_pages: 0, total_count: 0 },
      groups: { page: 1, page_size: 20, total_pages: 0, total_count: 0 },
      "user-groups": { page: 1, page_size: 20, total_pages: 0, total_count: 0 },
      workflows: { page: 1, page_size: 20, total_pages: 0, total_count: 0 },
      cases: { page: 1, page_size: 20, total_pages: 0, total_count: 0 }
    },
    search: {
      users: "",
      groups: "",
      "user-groups": "",
      workflows: "",
      cases: ""
    },
    sort: {
      users: { sortBy: "id", sortDir: "asc" },
      groups: { sortBy: "id", sortDir: "asc" },
      "user-groups": { sortBy: "id", sortDir: "asc" },
      workflows: { sortBy: "id", sortDir: "asc" },
      cases: { sortBy: "id", sortDir: "asc" }
    },
    selectedRecord: null,
    caseComments: [],
    auditRecords: [],
    auditExpanded: true,
    referenceData: {
      users: [],
      groups: [],
      workflows: []
    },
    toastTimer: null
  };
}

