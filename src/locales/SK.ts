import vuetifyLocale from '@/_common/_locales/vuetifyLocale.sk.ts'
import common from '@/_common/_locales/common.sk.ts'
import appCommon from './common.sk.ts'
import activity from '@/core/activity/_locales/activity.sk.ts'
import activityHistory from '@/core/activityHistory/_locales/activityHistory.sk.ts'
import activityTracking from '@/core/activityTracking/_locales/activityTracking.sk.ts'
import dayPlanner from '@/core/dayPlanner/_locales/dayPlanner.sk.ts'
import todoList from '@/core/todoList/_locales/todoList.sk.ts'
import leisure from '@/core/leisure/_locales/leisure.sk.ts'
import googleCalendar from '@/core/googleCalendar/_locales/googleCalendar.sk.ts'
import home from '@/core/home/_locales/home.sk.ts'
import user from '@/_common/modules/user/_locales/user.sk.ts'
import scheduler from '@/_common/modules/scheduler/_locales/scheduler.sk.ts'
// The reminders module ships from the framework submodule, so its strings do too. They are spread
// here rather than in `common` because the framework leaves module locales for the host to opt into.
import reminders from '@/_common/modules/reminders/_locales/reminders.sk.ts'
import remindersDashboard from '@/_common/modules/reminders/_locales/remindersDashboard.sk.ts'

// `common` (framework) is spread first so this app's own modules still win every collision — the
// two share six top-level namespaces (navigation, general, dateTime, controls, authorization,
// user) and object spread is shallow, so a colliding namespace is replaced wholesale, not merged.
// `appCommon` and the per-module locales below own those six between them and are spread after,
// which preserves this app's original strings exactly. What `common` contributes on top is
// `validation`, `export`, `notifications`, `reminderPreference`, `calendar`, `iconPicker` and
// `app` — namespaces this app doesn't define locally.
const SK = {
	...vuetifyLocale,
	...common,
	...appCommon,
	...activity,
	...activityHistory,
	...activityTracking,
	...dayPlanner,
	...todoList,
	...leisure,
	...googleCalendar,
	...home,
	...user,
	// `scheduler`, `reminders` and `reminderDashboard` are namespaces nothing else defines, so their
	// position in this spread is irrelevant.
	...scheduler,
	...reminders,
	...remindersDashboard,
}
export default SK
