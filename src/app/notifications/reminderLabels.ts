import type { InstallFrameworkOptions } from '@/_common/bootstrap/installFramework.ts'

// This app's map for `installFramework`'s `reminderLabels` option — the seam in
// `_common/modules/notifications/reminderPreference/utils/reminderLabels.ts` that N9 added next to
// `notificationTypeMeta.ts`. Values are i18n keys.
//
// `("Portal", "PersonalReminder")` — the reminders engine's own generic pair for anything a user creates
// themselves — needs no entry: the framework's `reminderPreference.ownerModule`/`kindName` keys already
// resolve it. The entries below are the identifiers this app's backend added on top of it:
//
//   - P1-03: `("Portal", "PlannedBlockStarting")`, the planner's automatic block reminders. Same owner
//     as the personal ones, a kind of its own so they can be muted separately.
//   - P1-02: `("TodoLists", "TodoItemDue")`, a to-do's due-time reminder.
export const reminderLabels: InstallFrameworkOptions['reminderLabels'] = {
	ownerModule: {
		TodoLists: 'toDoList.dueReminders.ownerModule',
	},
	kind: {
		PlannedBlockStarting: 'planner.autoReminders.kindName',
		TodoItemDue: 'toDoList.dueReminders.kindName',
	},
}
