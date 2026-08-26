import type { InstallFrameworkOptions } from '@/_common/bootstrap/installFramework.ts'

// This app's map for `installFramework`'s `reminderLabels` option — the seam in
// `_common/modules/notifications/reminderPreference/utils/reminderLabels.ts` that N9 added next to
// `notificationTypeMeta.ts`.
//
// Deliberately empty. This frontend never creates a reminder under any `ownerModule` other than the
// reminders engine's own generic `("Portal", "PersonalReminder")` pair — confirmed by grepping
// `src/core` for `ownerModule`/`ReminderKey` construction, which has zero hits, and by the comment at
// `core/dayPlanner/view/DayPlannerSettingsView.vue:120-125`, which names that pair as the only
// delivery switch this app's reminders go through. `reminderLabels.ts` already resolves `Portal` and
// `PersonalReminder` through the framework's own `reminderPreference.ownerModule`/`kindName` i18n
// keys, so this app has no identifier of its own to register. Left as an empty, wired map rather than
// omitted entirely, so the next `ownerModule` this app's backend introduces has an obvious place to
// land instead of another cold read of this seam.
export const reminderLabels: InstallFrameworkOptions['reminderLabels'] = {
	ownerModule: {},
	kind: {},
}
