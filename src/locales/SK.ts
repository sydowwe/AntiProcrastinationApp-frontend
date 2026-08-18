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
import frameworkUser from '@/_common/modules/user/_locales/user.sk.ts'
import appUser from '@/core/user/_locales/user.sk.ts'
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
//
// `user` is now a namespace TWO files contribute to (`frameworkUser` + `appUser`), unlike every
// other namespace here which comes from exactly one source. It cannot simply be spread last like
// the others — a bare `...appUser` would replace the whole `user` key (including `authorization`,
// which `appUser` doesn't declare) wholesale. See the explicit merge below. If you add a locale
// namespace that a second file also wants to contribute to, follow this same pattern rather than
// a second `...` spread.
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
	...frameworkUser,
	// `scheduler`, `reminders` and `reminderDashboard` are namespaces nothing else defines, so their
	// position in this spread is irrelevant.
	...scheduler,
	...reminders,
	...remindersDashboard,
	// `user` is the one namespace two files contribute to: the framework owns auth, 2FA and
	// sessions; this app owns its preference and about/legal strings. Shallow spread would drop
	// one side wholesale, so merge the namespace itself and let the app win collisions.
	user: { ...frameworkUser.user, ...appUser.user },
}
export default SK
