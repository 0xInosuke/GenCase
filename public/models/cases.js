export function createCasesConfig(parseJsonInput) {
  return {
    label: "Cases",
    endpoint: "/api/cases",
    targetType: "case",
    listColumns: [
      { key: "id", label: "ID", sortable: true, width: "84px" },
      { key: "case_title", label: "Case Title", sortable: true, width: "minmax(460px, 3fr)" },
      { key: "wf_name", label: "Workflow", sortable: true, width: "minmax(220px, 1.2fr)" },
      { key: "stage_code", label: "Stage", sortable: true, width: "150px", cellType: "stage-badge" },
      { key: "last_edited_by", label: "Last Edited By", sortable: true, width: "145px" },
      { key: "last_edited_at", label: "Last Edited Date", sortable: true, width: "165px", cellType: "datetime" }
    ],
    detailFields: [
      { key: "id", label: "ID", span: "half", tone: "meta" },
      { key: "case_title", label: "Case Title", span: "half" },
      { key: "wf_name", label: "Workflow Name", span: "half" },
      { key: "stage_code", label: "Stage Code", span: "half" },
      { key: "created_at", label: "Created At", span: "half", tone: "meta" },
      { key: "updated_at", label: "Updated At", span: "half", tone: "meta" },
      { key: "case_data", label: "Case Data", span: "full" }
    ],
    createFields: [
      { key: "workflow_id", label: "Workflow", type: "workflow-select" },
      { key: "case_title", label: "Case Title", type: "text" },
      { key: "stage_code", label: "Stage Code", type: "stage-select" },
      { key: "case_data", label: "Case Data", type: "case-data-editor" }
    ],
    editFields: [
      { key: "workflow_id", label: "Workflow", type: "workflow-readonly" },
      { key: "case_title", label: "Case Title", type: "text" },
      { key: "stage_code", label: "Stage Code", type: "stage-select" },
      { key: "case_data", label: "Case Data", type: "case-data-editor" }
    ],
    buildCreatePayload(formData) {
      return {
        workflow_id: Number(formData.workflow_id),
        case_title: formData.case_title,
        stage_code: formData.stage_code,
        case_data: parseJsonInput(formData.case_data, "Case Data")
      };
    },
    buildUpdatePayload(_currentRecord, formData) {
      return {
        case_title: formData.case_title,
        stage_code: formData.stage_code,
        case_data: parseJsonInput(formData.case_data, "Case Data")
      };
    }
  };
}

