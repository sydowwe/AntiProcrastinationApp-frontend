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

// The framework's `common` is now PARTIAL in English (N11: only `notifications.*` and
// `reminderPreference.*` — see the comment atop `@/_common/_locales/common.en.ts` for what is
// still Slovak-only there). Spread it first, same position as SK.ts's `...common`, so `appCommon`
// and the app's own modules still win every collision — `appCommon` carries the EN `$vuetify` and
// `httpErrors` translations that stand in for the framework's still-untranslated namespaces (see
// its top-of-file comment).
//
// `user` is merged rather than spread, mirroring SK.ts — see the comment there for why.
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
	// `scheduler` is a namespace nothing else defines, so its position in this spread is irrelevant —
	// mirrors SK.ts.
	...scheduler,
	user: { ...frameworkUser.user, ...appUser.user },
}
export default EN
