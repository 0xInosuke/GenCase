export function createUsersConfig() {
  return {
    label: "Users",
    endpoint: "/api/users",
    targetType: "user",
    listColumns: [
      { key: "id", label: "ID", sortable: true, width: "84px" },
      { key: "display_name", label: "Display Name", sortable: true, width: "minmax(220px, 1.4fr)" },
      { key: "status_code", label: "Status Code", sortable: true, width: "130px" }
    ],
    detailFields: [
      { key: "id", label: "ID", span: "half", tone: "meta" },
      { key: "user_name", label: "Username", span: "half" },
      { key: "display_name", label: "Display Name", span: "half" },
      { key: "status_code", label: "Status Code", span: "half" },
      { key: "created_at", label: "Created At", span: "half", tone: "meta" },
      { key: "updated_at", label: "Updated At", span: "half", tone: "meta" }
    ],
    createFields: [
      { key: "user_name", label: "Username", type: "text" },
      { key: "display_name", label: "Display Name", type: "text" },
      { key: "user_password", label: "Password", type: "password" },
      { key: "status_code", label: "Status Code", type: "status" }
    ],
    editFields: [
      { key: "display_name", label: "Display Name", type: "text" },
      { key: "user_password", label: "Password", type: "password" },
      { key: "status_code", label: "Status Code", type: "status" }
    ],
    buildCreatePayload(formData) {
      return {
        user_name: formData.user_name,
        display_name: formData.display_name,
        user_password: formData.user_password,
        status_code: formData.status_code
      };
    },
    buildUpdatePayload(currentRecord, formData) {
      return {
        user_name: currentRecord.user_name,
        display_name: formData.display_name,
        user_password: formData.user_password,
        status_code: formData.status_code
      };
    }
  };
}

