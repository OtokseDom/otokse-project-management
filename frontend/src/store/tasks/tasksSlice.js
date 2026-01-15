// ...existing code...
export const createTasksSlice = (set, get) => ({
	// ...existing code...
	// Merge/replace tasks from backend (bulk update)
	mergeTasks: (updatedTasks) =>
		set((state) => {
			const updatedMap = new Map(updatedTasks.map((t) => [t.id, t]));
			return {
				tasks: state.tasks.map((t) => updatedMap.get(t.id) || t),
			};
		}),
	tasks: [],
	tasksLoaded: false, // flag to know if fetched
	tasksLoading: false, // flag to know if loading
	setTasks: (tasks) => set({ tasks, tasksLoaded: true }),
	setTasksLoaded: (loaded) => set({ tasksLoaded: loaded }),
	setTasksLoading: (loading) => set({ tasksLoading: loading }),
	addTask: (task) =>
		set((state) => ({
			tasks: [task, ...state.tasks],
		})),

	updateTask: (id, updates) =>
		set((state) => ({
			tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
		})),

	updateMultipleTasks: (updates) =>
		set((state) => ({
			tasks: state.tasks.map((t) => {
				const update = updates.find((u) => u.id === t.id);
				return update ? { ...t, ...update.data } : t;
			}),
		})),
	removeTask: (id) =>
		set((state) => ({
			tasks: state.tasks.filter((t) => t.id !== id),
		})),

	// Task History
	taskHistory: [],
	selectedTaskHistory: {},

	setTaskHistory: (taskHistory) => set({ taskHistory }),
	setSelectedTaskHistory: (selectedTaskHistory) => set({ selectedTaskHistory }),

	addTaskHistory: (taskHistory) =>
		set((state) => ({
			taskHistory: [...state.taskHistory, taskHistory],
		})),

	updateTaskHistory: (id, updates) =>
		set((state) => ({
			taskHistory: state.taskHistory.map((t) => (t.id === id ? { ...t, ...updates } : t)),
		})),

	removeTaskHistory: (id) =>
		set((state) => ({
			taskHistory: state.taskHistory.filter((t) => t.id !== id),
		})),

	// Relations
	relations: {},

	setRelations: (relations) => set({ relations }),

	addRelation: (relation) =>
		set((state) => ({
			relations: {
				...state.relations,
				children: [...state.relations.children, relation],
			},
		})),

	updateRelation: (id, updates) =>
		set((state) => ({
			relations: state.relations.map((t) => (t.id === id ? { ...t, ...updates } : t)),
		})),

	removeRelation: (id) =>
		set((state) => ({
			relations: state.relations.filter((t) => t.id !== id),
		})),

	// Tab
	activeTab: "update",
	setActiveTab: (activeTab) => set({ activeTab }),
	// Calendar
	selectedUser: null,
	setSelectedUser: (selectedUser) => set({ selectedUser }),
	// Multi-select users
	options: [],
	setOptions: (options) => set({ options }),
	addOption: (option) =>
		set((state) => ({
			options: [...state.options, option],
		})),
	// Move task position
	updateTaskPosition: (taskId, newStatusId, newPosition) =>
		set((state) => {
			const tasks = [...state.tasks];
			const task = tasks.find((t) => t.id === taskId);
			if (!task) return { tasks };

			const oldStatusId = task.status_id;
			const oldPosition = task.position;

			// Remove task from old column and shift
			tasks.filter((t) => t.status_id === oldStatusId && t.position > oldPosition).forEach((t) => t.position--);

			// Shift tasks in new column
			tasks.filter((t) => t.status_id === newStatusId && t.position >= newPosition).forEach((t) => t.position++);

			// Update moved task
			task.status_id = newStatusId;
			task.position = newPosition;

			return { tasks };
		}),
	// Merge backend authoritative data
	mergeTaskPositions: (affectedTasks) =>
		set((state) => {
			const affectedMap = new Map();
			affectedTasks.forEach((t) => affectedMap.set(t.id, t));

			return {
				tasks: state.tasks.map((t) => affectedMap.get(t.id) ?? t),
			};
		}),
	// Position management
	taskPositions: {}, // { "context-contextId": { taskId: position } }

	setTaskPositions: (context, contextId, positions) =>
		set((state) => {
			const positionMap = {};
			positions.forEach((pos) => {
				positionMap[pos.task_id] = pos.position;
			});
			return {
				taskPositions: {
					...state.taskPositions,
					[`${context}-${contextId}`]: positionMap,
				},
			};
		}),

	updateTaskPositionLocal: (context, contextId, updatedPositions) =>
		set((state) => {
			const key = `${context}-${contextId}`;
			const positionMap = { ...state.taskPositions[key] };

			// Update all affected tasks
			updatedPositions.forEach((pos) => {
				positionMap[pos.task_id] = pos.position;
			});

			return {
				taskPositions: {
					...state.taskPositions,
					[key]: positionMap,
				},
			};
		}),

	getTaskPositionMap: (context, contextId) => {
		const state = get();
		return state.taskPositions[`${context}-${contextId}`] || {};
	},

	// Helper to get sorted tasks by position
	getSortedTasks: (tasks, context, contextId) => {
		const state = get();
		const positionMap = state.taskPositions[`${context}-${contextId}`] || {};

		// Filter parent tasks only
		const parentTasks = tasks.filter((t) => !t.parent_id);

		// Separate positioned and unpositioned tasks
		const positioned = [];
		const unpositioned = [];

		parentTasks.forEach((task) => {
			if (positionMap[task.id] !== undefined) {
				positioned.push(task);
			} else {
				unpositioned.push(task);
			}
		});

		// Sort positioned by position
		positioned.sort((a, b) => positionMap[a.id] - positionMap[b.id]);

		// Sort unpositioned by id
		unpositioned.sort((a, b) => a.id - b.id);

		// Return positioned first, then unpositioned
		return [...positioned, ...unpositioned];
	},

	// ... new: positions loaded tracking per context/contextId
	positionsLoaded: {}, // { "context-contextId": true }

	// mark a context as loaded/unloaded
	setPositionsLoaded: (context, contextId, loaded = true) =>
		set((state) => {
			const key = `${context}-${contextId ?? "null"}`;
			return { positionsLoaded: { ...state.positionsLoaded, [key]: loaded } };
		}),
	// helper to read loaded flag (useful outside React component if needed)
	isPositionsLoaded: (context, contextId) => {
		const key = `${context}-${contextId ?? "null"}`;
		return !!get().positionsLoaded[key];
	},

	// Task Filters
	taskFilters: {
		dateRange: { from: null, to: null },
		selectedUsers: [],
	},
	setTaskFilters: (filters) => set({ taskFilters: filters }),
	setTaskDateRange: (from, to) =>
		set((state) => ({
			taskFilters: {
				...state.taskFilters,
				dateRange: { from, to },
			},
		})),
	setTaskSelectedUsers: (users) =>
		set((state) => ({
			taskFilters: {
				...state.taskFilters,
				selectedUsers: users,
			},
		})),
	clearTaskFilters: () =>
		set({
			taskFilters: {
				dateRange: { from: null, to: null },
				selectedUsers: [],
			},
		}),
});
