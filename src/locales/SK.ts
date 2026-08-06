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
import user from '@/core/user/_locales/user.sk.ts'

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
}
export default SK
