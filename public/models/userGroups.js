export function createUserGroupsConfig() {
  return {
    label: "User Groups",
    endpoint: "/api/user-groups",
    targetType: "user_group",
    listColumns: [
      { key: "id", label: "ID", sortable: true, width: "84px" },
      { key: "display_name", label: "Display Name", sortable: true, width: "minmax(220px, 1.2fr)" },
      { key: "group_name", label: "Group Name", sortable: true, width: "minmax(200px, 1fr)" },
      { key: "status_code", label: "Status Code", sortable: true, width: "130px" }
    ],
    detailFields: [
      { key: "id", label: "ID", span: "half", tone: "meta" },
      { key: "user_id", label: "User ID", span: "half" },
      { key: "display_name", label: "Display Name", span: "half" },
      { key: "group_id", label: "Group ID", span: "half" },
      { key: "group_name", label: "Group Name", span: "half" },
      { key: "status_code", label: "Status Code", span: "half" },
      { key: "created_at", label: "Created At", span: "half", tone: "meta" },
      { key: "updated_at", label: "Updated At", span: "half", tone: "meta" }
    ],
    createFields: [
      { key: "user_id", label: "User", type: "user-select" },
      { key: "group_id", label: "Group", type: "group-select" },
      { key: "status_code", label: "Status Code", type: "status" }
    ],
    editFields: [
      { key: "user_id", label: "User", type: "user-select" },
      { key: "group_id", label: "Group", type: "group-select" },
      { key: "status_code", label: "Status Code", type: "status" }
    ],
    buildCreatePayload(formData) {
      return {
        user_id: Number(formData.user_id),
        group_id: Number(formData.group_id),
        status_code: formData.status_code
      };
    },
    buildUpdatePayload(_currentRecord, formData) {
      return {
        user_id: Number(formData.user_id),
        group_id: Number(formData.group_id),
        status_code: formData.status_code
      };
    }
  };
}

