/**
 * The three roles the app itself needs to reference by identity: a routine to-do, a normal to-do and a
 * planner task each land under a fixed role when quick-created.
 *
 * The member values are **stable keys, not display names**. That separation is the whole point of this
 * enum — quick-create used to resolve its role by GETting `/activity-role/by-name/To-do list task`,
 * which meant renaming that role in `/activity-settings/roles` (fully permitted, no protection on it)
 * silently broke quick-create from four dialogs.
 *
 * The value doubles as the locale sub-key: the label the user sees is `activities.systemRole.<value>`,
 * never the enum value itself.
 *
 * These are also the wire values: the server stores them as `Role.systemKey` and resolves
 * `GET /activity-role/by-system-key/{key}` from them, so do not recase or rename a member.
 */
export enum SystemActivityRole {
	ROUTINE_TASK = 'routineTask',
	TODO_LIST_TASK = 'todoListTask',
	PLANNER_TASK = 'plannerTask',
}
