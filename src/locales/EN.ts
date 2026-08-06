import appCommon from './common.en.ts'
import activity from '@/core/activity/_locales/activity.en.ts'
import activityHistory from '@/core/activityHistory/_locales/activityHistory.en.ts'
import activityTracking from '@/core/activityTracking/_locales/activityTracking.en.ts'
import dayPlanner from '@/core/dayPlanner/_locales/dayPlanner.en.ts'
import todoList from '@/core/todoList/_locales/todoList.en.ts'
import leisure from '@/core/leisure/_locales/leisure.en.ts'
import googleCalendar from '@/core/googleCalendar/_locales/googleCalendar.en.ts'
import home from '@/core/home/_locales/home.en.ts'
import user from '@/core/user/_locales/user.en.ts'

// The framework ships a Slovak-only `common`, so unlike SK.ts this aggregator has nothing to
// spread from @/_common/_locales — `appCommon` carries the EN `$vuetify` and `httpErrors`
// translations that stand in for it (see its top-of-file comment).
const EN = {
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
export default EN
