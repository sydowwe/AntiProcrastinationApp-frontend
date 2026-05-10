import { watch } from 'vue'
import { useCurrentTime } from '@/composables/general/useCurrentTime.ts'
import { checkNotificationPermission, showNotification } from '@/utils/notifications.ts'
import { PlannerTaskStatus } from '@/dtos/enum/PlannerTaskStatus.ts'
import type { PlannerTask } from '@/dtos/response/activityPlanning/PlannerTask.ts'

export function useTaskReminders(getTasks: () => PlannerTask[], getViewedDate: () => Date | string, minutesBefore = 10) {
	const { currentTime } = useCurrentTime()
	const notifiedTaskIds = new Set<number>()

	checkNotificationPermission()

	watch(getViewedDate, () => notifiedTaskIds.clear())

	watch(
		currentTime,
		now => {
			const today = new Date()
			const viewedDate = new Date(getViewedDate())
			if (
				viewedDate.getFullYear() !== today.getFullYear() ||
				viewedDate.getMonth() !== today.getMonth() ||
				viewedDate.getDate() !== today.getDate()
			)
				return

			const nowMinutes = now.getHours() * 60 + now.getMinutes()

			for (const task of getTasks()) {
				if (task.id < 0) continue
				if (task.status !== PlannerTaskStatus.NotStarted) continue
				if (notifiedTaskIds.has(task.id)) continue

				const diff = task.startTime.getInMinutes - nowMinutes
				if (diff > 0 && diff <= minutesBefore) {
					notifiedTaskIds.add(task.id)
					showNotification(task.activity.name, `Starts in ${diff} minute${diff !== 1 ? 's' : ''}`)
				}
			}
		},
		{ immediate: true },
	)
}
