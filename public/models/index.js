import { createUsersConfig } from "./users.js";
import { createGroupsConfig } from "./groups.js";
import { createUserGroupsConfig } from "./userGroups.js";
import { createWorkflowsConfig } from "./workflows.js";
import { createCasesConfig } from "./cases.js";

export function createModelConfigs(parseJsonInput) {
  return {
    users: createUsersConfig(),
    groups: createGroupsConfig(),
    "user-groups": createUserGroupsConfig(),
    workflows: createWorkflowsConfig(parseJsonInput),
    cases: createCasesConfig(parseJsonInput)
  };
}

