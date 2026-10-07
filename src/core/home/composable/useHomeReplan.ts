import type { Ref } from 'vue'
import type { PlannerTask } from '@/core/dayPlanner/dto/response/PlannerTask.ts'
import { useDayReplan } from '@/core/dayPlanner/composable/useDayReplan.ts'
import { todayIsoDate } from '@/core/home/composable/useDashboardRefresh.ts'

/**
 * "Re-plan the rest of today" (FO4) as the home page offers it: from the now bar in missed mode and from
 * the planner card's header. Whether to offer it is `canReplan` in useTodayPlan.ts.
 *
 * Takes the plan from the caller's own `useTodayPlan()` rather than calling it again: each call registers
 * a dashboard-refresh consumer (see the note above `nowMinutes` there).
 *
 * The flow itself is `dayPlanner`'s, which home may use: it is the app's composition layer (home.routes.ts).
 */
export function useHomeReplan(plan: { tasks: Ref<PlannerTask[]>; reload: () => Promise<void> }) {
	const { replanRestOfToday, previewing } = useDayReplan()

	async function replan() {
		const result = await replanRestOfToday(todayIsoDate.value, plan.tasks.value)
		if (result) await plan.reload()
	}

	return { previewing, replan }
}
