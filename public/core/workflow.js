export function getWorkflowById(referenceData, workflowId) {
  return referenceData.workflows.find((item) => Number(item.id) === Number(workflowId)) || null;
}

export function getCaseStagesByWorkflowId(referenceData, workflowId) {
  const workflow = getWorkflowById(referenceData, workflowId);
  const stages = workflow?.wf_data?.stages;
  if (!Array.isArray(stages)) {
    return [];
  }
  return stages.map((stage) => String(stage).trim()).filter(Boolean);
}

