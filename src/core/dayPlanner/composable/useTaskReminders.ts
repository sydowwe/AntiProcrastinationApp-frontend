import { watch } from 'vue'
import { useCurrentTime } from '@/_common/composable/general/useCurrentTime.ts'
import { requestNotificationPermission, showNotification } from '@/_common/utils/notifications.ts'
import { formatDateForApi } from '@/_common/utils/DateTimeHelper.ts'
import { isoDateInUserZone, minutesOfDayInUserZone } from '@/_common/composable/general/useUserClock.ts'
import { PlannerTaskStatus } from '@/core/dayPlanner/dto/enum/PlannerTaskStatus.ts'
import type { PlannerTask } from '@/core/dayPlanner/dto/response/PlannerTask.ts'

export function useTaskReminders(
	getTasks: () => PlannerTask[],
	getViewedDate: () => Date | string,
	getMinutesBefore: () => number = () => 10,
	getEnabled: () => boolean = () => true,
) {
	const { currentTime } = useCurrentTime()
	const notifiedTaskIds = new Set<number>()

	void requestNotificationPermission()

	watch(getViewedDate, () => notifiedTaskIds.clear())

	watch(
		currentTime,
		now => {
			if (!getEnabled()) return

			// `viewedDate` is a calendar day, read with its browser-local fields; the right-hand side
			// asks what day it is now, which is a question about the user's timezone.
			const viewedDate = new Date(getViewedDate())
			if (formatDateForApi(viewedDate) !== isoDateInUserZone()) return

			const nowMinutes = minutesOfDayInUserZone(now)

			for (const task of getTasks()) {
				if (task.id < 0) continue
				if (task.status !== PlannerTaskStatus.NotStarted) continue
				if (notifiedTaskIds.has(task.id)) continue

				const diff = task.startTime.getInMinutes - nowMinutes
				if (diff > 0 && diff <= getMinutesBefore()) {
					notifiedTaskIds.add(task.id)
					void showNotification(task.activity.name, `Starts in ${diff} minute${diff !== 1 ? 's' : ''}`)
				}
			}
		},
		{ immediate: true },
	)
}
