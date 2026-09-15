import vuetifyLocale from '@/_common/_locales/vuetifyLocale.sk.ts'
import common from '@/_common/_locales/common.sk.ts'
import appCommon from './common.sk.ts'
import activity from '@/core/activity/_locales/activity.sk.ts'
import activityHistory from '@/core/activityHistory/_locales/activityHistory.sk.ts'
import activityTracking from '@/core/activityTracking/_locales/activityTracking.sk.ts'
import historyDashboard from '@/core/historyDashboard/_locales/historyDashboard.sk.ts'
import dayPlanner from '@/core/dayPlanner/_locales/dayPlanner.sk.ts'
import todoList from '@/core/todoList/_locales/todoList.sk.ts'
import leisure from '@/core/leisure/_locales/leisure.sk.ts'
import googleCalendar from '@/core/googleCalendar/_locales/googleCalendar.sk.ts'
import home from '@/core/home/_locales/home.sk.ts'
import frameworkUser from '@/_common/modules/user/_locales/user.sk.ts'
import appUser from '@/core/user/_locales/user.sk.ts'
import scheduler from '@/_common/modules/scheduler/_locales/scheduler.sk.ts'
// The reminders module ships from the framework submodule, so its strings do too. They are spread
// here rather than in `common` because the framework leaves module locales for the host to opt into.
import reminders from '@/_common/modules/reminders/_locales/reminders.sk.ts'
import remindersDashboard from '@/_common/modules/reminders/_locales/remindersDashboard.sk.ts'

// `common` (framework) is spread first so this app's own modules still win every collision.
// Object spread is SHALLOW: a colliding top-level namespace is replaced wholesale, not merged.
// That is what we want for `navigation` and `app` (the framework's copies are another app's
// sidebar and brand), and it is what `appCommon` and the per-module locales rely on.
//
// It is NOT what we want for a namespace two files both contribute to, where the framework's
// keys must survive and this app's must win collisions: `general`, `dateTime`, `controls` and
// `user`. Those four are merged explicitly at the bottom. Before that merge existed the app kept a
// hand-written "mirror" of the framework's keys in `common.sk.ts`, written per consumer rather
// than per namespace, and it leaked a raw key four times (`migration-revision.md` R5/R6/R11, then
// `dateTime.secondsShort` — F35). A framework component resolving a `general.*`/`dateTime.*`/
// `controls.*` key now needs nothing app-side. If you add a namespace a second file also wants to
// contribute to, add it to that merge rather than a second `...` spread.
const SK = {
	...vuetifyLocale,
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
	// position in this spread is irrelevant.
	...scheduler,
	...reminders,
	...remindersDashboard,
	// The namespaces two files contribute to — see the header. The framework's keys survive and
	// the app's win collisions. `user`: the framework owns auth, 2FA and sessions; this app owns
	// its preference and about/legal strings. `general`/`dateTime`/`controls`: the framework's
	// components resolve their own keys; this app adds its own and rewords a few.
	general: { ...common.general, ...appCommon.general },
	dateTime: { ...common.dateTime, ...appCommon.dateTime },
	controls: { ...common.controls, ...appCommon.controls },
	user: { ...frameworkUser.user, ...appUser.user },
}
export default SK
