import { create } from "zustand";
import { createTasksSlice } from "./tasks/tasksSlice";
import { createUsersSlice } from "./users/usersSlice";
import { createDashboardSlice } from "./dashboard/dashboardSlice";
import { createProjectsSlice } from "./projects/projectsSlice";
import { createUserSlice } from "./user/userSlice";
import { createCategoriesSlice } from "./categories/categoriesSlice";
import { createOrganizationSlice } from "./organization/organizationSlice";
import { createTaskStatusesSlice } from "./taskStatuses/taskStatusesSlice";
import { createKanbanColumnsSlice } from "./kanbanColumns/kanbanColumnsSlice";
import { createTaskDiscussionsSlice } from "./taskDiscussions/taskDiscussionsSlice";

export const useAppStore = create((set, get) => ({
	...createDashboardSlice(set),
	...createTaskStatusesSlice(set),
	...createProjectsSlice(set),
	...createTasksSlice(set, get),
	...createTaskDiscussionsSlice(set),
	...createUsersSlice(set),
	...createUserSlice(set),
	...createCategoriesSlice(set),
	...createOrganizationSlice(set),
	...createKanbanColumnsSlice(set),
}));
