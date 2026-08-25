<template>
	<VContainer class="d-flex justify-center py-12">
		<VAlert
			v-if="failed"
			type="warning"
			variant="tonal"
			maxWidth="520"
			:title="$t('planner.taskLink.notFoundTitle')"
			:text="$t('planner.taskLink.notFoundText')"
		>
			<template #append>
				<VBtn
					variant="text"
					:to="{ name: 'plannerCalendar' }"
				>
					{{ $t('planner.taskLink.toCalendar') }}
				</VBtn>
			</template>
		</VAlert>
		<VProgressCircular
			v-else
			indeterminate
			color="primary"
			size="48"
		/>
	</VContainer>
</template>

<script setup lang="ts">
	/**
	 * Turns a planner-task id into the dated planner URL that can actually show it.
	 *
	 * The planner is addressed by DATE (`/day-planner/:date`), but the things that link INTO it know a
	 * task id and nothing else — a notification's `subject` says `{ kind: 'plannerTask', id }`. Bridging
	 * that needs two reads (task → `calendarId` → the calendar's date), which is asynchronous, while the
	 * kind → path map in `public/notification-subject-routes.js` has to stay a synchronous string
	 * builder: the service worker resolves push clicks through the same map with no app, no router and
	 * no API client in scope.
	 *
	 * So the map points here, and the asynchronous half happens in the app, once, in one place. Anything
	 * else that learns a bare task id can link here too.
	 *
	 * `replace`, not `push`: this view is a redirect, and leaving it in history means Back lands on a
	 * spinner that immediately redirects forward again.
	 */
	import { onMounted, ref } from 'vue'
	import { useRoute, useRouter } from 'vue-router'
	import { useTaskPlannerCrud } from '@/core/dayPlanner/api/plannerTaskApi.ts'
	import { useCalendarQuery } from '@/core/activityHistory/api/calendarApi.ts'
	import { usStringToUrlString } from '@/_common/utils/DateTimeHelper.ts'

	const route = useRoute()
	const router = useRouter()
	const { fetchById: fetchTaskById } = useTaskPlannerCrud()
	const { fetchById: fetchCalendarById } = useCalendarQuery()

	const failed = ref(false)

	onMounted(async () => {
		const id = Number(route.params.id)
		if (!Number.isFinite(id)) {
			failed.value = true
			return
		}

		try {
			const task = await fetchTaskById(id)
			const calendar = await fetchCalendarById(task.calendarId)

			// `Calendar.date` is an API date-only string (`yyyy-MM-dd`, possibly with a time part). Taking
			// the first ten characters rather than parsing to a `Date` is deliberate: a round trip through
			// `Date` re-interprets the value in the browser's zone and can land on the previous day for
			// anyone west of UTC, which would open the wrong planner day.
			const isoDate = calendar.date.slice(0, 10)

			await router.replace({
				name: 'dayPlanner',
				params: { date: usStringToUrlString(isoDate) },
				// Read by DayPlannerView once its tasks have loaded — see `useQueryFocusTarget`.
				query: { focus: String(id) },
			})
		} catch {
			// A dangling reference is expected, not exceptional: notification history outlives the
			// entities it names (the server does not existence-check a subject, because that would put a
			// per-row read on the bell list). The axios interceptor has already surfaced the failure; this
			// only decides what stays on screen.
			failed.value = true
		}
	})
</script>
