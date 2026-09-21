import common from '@/_common/_locales/common.en.ts'
import appCommon from './common.en.ts'
import activity from '@/core/activity/_locales/activity.en.ts'
import activityHistory from '@/core/activityHistory/_locales/activityHistory.en.ts'
import activityTracking from '@/core/activityTracking/_locales/activityTracking.en.ts'
import historyDashboard from '@/core/historyDashboard/_locales/historyDashboard.en.ts'
import dayPlanner from '@/core/dayPlanner/_locales/dayPlanner.en.ts'
import todoList from '@/core/todoList/_locales/todoList.en.ts'
import leisure from '@/core/leisure/_locales/leisure.en.ts'
import googleCalendar from '@/core/googleCalendar/_locales/googleCalendar.en.ts'
import home from '@/core/home/_locales/home.en.ts'
import frameworkUser from '@/_common/modules/user/_locales/user.en.ts'
import appUser from '@/core/user/_locales/user.en.ts'
import scheduler from '@/_common/modules/scheduler/_locales/scheduler.en.ts'
import reminders from '@/_common/modules/reminders/_locales/reminders.en.ts'
import remindersDashboard from '@/_common/modules/reminders/_locales/remindersDashboard.en.ts'

// The framework's `common` has been complete in English since `e04dad2` (it was once only
// `notifications.*` and `reminderPreference.*`). Spread it first, same position as SK.ts's
// `...common`, so `appCommon` and the app's own modules still win every collision. `appCommon`
// carries the EN `$vuetify` (Vuetify's own export) and this app's wordings for a few framework
// namespaces — see its top-of-file comment.
//
// `general`, `dateTime`, `controls` and `user` are merged rather than spread, mirroring SK.ts —
// see the comment there for why. `httpErrors` joined them 2026-09-21: the framework grew the typed
// 409/403 keys (`conflictUnique`, `conflictForeignKey`, …) and the app's wholesale copy would have
// resolved them to raw keys, which is exactly the leak the merge exists to prevent.
const EN = {
	...common,
	...appCommon,
	...activity,
	...activityHistory,
	...activityTracking,
	...historyDashboard,
	...dayPlanner,
	...todoList,
	...leisure,
	...googleCalendar,
	...home,
	...frameworkUser,
	// `scheduler`, `reminders` and `reminderDashboard` are namespaces nothing else defines, so their
	// position in this spread is irrelevant — mirrors SK.ts.
	...scheduler,
	...reminders,
	...remindersDashboard,
	httpErrors: { ...common.httpErrors, ...appCommon.httpErrors },
	general: { ...common.general, ...appCommon.general },
	dateTime: { ...common.dateTime, ...appCommon.dateTime },
	controls: { ...common.controls, ...appCommon.controls },
	user: { ...frameworkUser.user, ...appUser.user },
	// `calendar` joined 2026-09-21 (B19), mirroring SK.ts: the app's copy carries the `holidays`
	// table the framework has no counterpart for, so it no longer has to stay a complete replacement.
	calendar: { ...common.calendar, ...appCommon.calendar },
}
export default EN
