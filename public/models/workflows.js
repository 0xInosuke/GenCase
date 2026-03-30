export function createWorkflowsConfig(parseJsonInput) {
  return {
    label: "Workflows",
    endpoint: "/api/workflows",
    targetType: "workflow",
    listColumns: [
      { key: "id", label: "ID", sortable: true, width: "84px" },
      { key: "wf_name", label: "Workflow Name", sortable: true, width: "minmax(260px, 1.6fr)" },
      { key: "status_code", label: "Status Code", sortable: true, width: "130px" }
    ],
    detailFields: [
      { key: "id", label: "ID", span: "half", tone: "meta" },
      { key: "wf_name", label: "Workflow Name", span: "half" },
      { key: "status_code", label: "Status Code", span: "half" },
      { key: "created_at", label: "Created At", span: "half", tone: "meta" },
      { key: "updated_at", label: "Updated At", span: "half", tone: "meta" },
      { key: "wf_data", label: "Workflow Data", span: "full" }
    ],
    createFields: [
      { key: "wf_name", label: "Workflow Name", type: "text" },
      { key: "status_code", label: "Status Code", type: "status" },
      { key: "wf_data", label: "Workflow Data (JSON)", type: "json" }
    ],
    editFields: [
      { key: "wf_name", label: "Workflow Name", type: "text" },
      { key: "status_code", label: "Status Code", type: "status" },
      { key: "wf_data", label: "Workflow Data (JSON)", type: "json" }
    ],
    buildCreatePayload(formData) {
      return {
        wf_name: formData.wf_name,
        status_code: formData.status_code,
        wf_data: parseJsonInput(formData.wf_data, "Workflow Data")
      };
    },
    buildUpdatePayload(_currentRecord, formData) {
      return {
        wf_name: formData.wf_name,
        status_code: formData.status_code,
        wf_data: parseJsonInput(formData.wf_data, "Workflow Data")
      };
    }
  };
}

