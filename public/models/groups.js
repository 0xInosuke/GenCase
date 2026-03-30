export function createGroupsConfig() {
  return {
    label: "Groups",
    endpoint: "/api/groups",
    targetType: "group",
    listColumns: [
      { key: "id", label: "ID", sortable: true, width: "84px" },
      { key: "group_name", label: "Group Name", sortable: true, width: "minmax(220px, 1.4fr)" },
      { key: "status_code", label: "Status Code", sortable: true, width: "130px" }
    ],
    detailFields: [
      { key: "id", label: "ID", span: "half", tone: "meta" },
      { key: "group_name", label: "Group Name", span: "half" },
      { key: "status_code", label: "Status Code", span: "half" },
      { key: "created_at", label: "Created At", span: "half", tone: "meta" },
      { key: "updated_at", label: "Updated At", span: "half", tone: "meta" }
    ],
    createFields: [
      { key: "group_name", label: "Group Name", type: "text" },
      { key: "status_code", label: "Status Code", type: "status" }
    ],
    editFields: [
      { key: "group_name", label: "Group Name", type: "text" },
      { key: "status_code", label: "Status Code", type: "status" }
    ],
    buildCreatePayload(formData) {
      return {
        group_name: formData.group_name,
        status_code: formData.status_code
      };
    },
    buildUpdatePayload(_currentRecord, formData) {
      return {
        group_name: formData.group_name,
        status_code: formData.status_code
      };
    }
  };
}

