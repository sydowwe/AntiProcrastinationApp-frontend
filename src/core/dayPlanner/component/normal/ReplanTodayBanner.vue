<!--
	The day view's way into "Re-plan the rest of today" (FO4). Today only, and only once a block that the
	re-plan could move has actually passed unstarted. No count: it says the plan slipped, not by how much.
	Dismissible for as long as the view stays open.
-->
<template>
	<SubtleCard
		v-if="shown"
		color="warning"
		icon="fa-shuffle"
		closable
		class="mx-4 mt-2"
		@close="dismissed = true"
	>
		<div class="d-flex align-center flex-wrap ga-3">
			<p class="text-body-2 ma-0 flex-grow-1">{{ $t('planner.replan.bannerText') }}</p>
			<VBtn
				variant="tonal"
				color="warningDark"
				prependIcon="fa-shuffle"
				:loading="previewing"
				@click="replan"
			>
				{{ $t('planner.replan.button') }}
			</VBtn>
		</div>
	</SubtleCard>
</template>

<script setup lang="ts">
	import { computed, ref } from 'vue'
	import SubtleCard from '@/_common/component/feedback/SubtleCard.vue'
	import { useCurrentTime } from '@/_common/composable/general/useCurrentTime.ts'
	import { isoDateInUserZone, minutesOfDayInUserZone } from '@/_common/composable/general/useUserClock.ts'
	import { formatDateForApi } from '@/_common/utils/DateTimeHelper.ts'
	import { useDayPlannerStore } from '@/core/dayPlanner/store/dayPlannerStore.ts'
	import { useDayReplan } from '@/core/dayPlanner/composable/useDayReplan.ts'
	import { isMissedAndMovable } from '@/core/dayPlanner/utils/replanCandidates.ts'
	import type { PlannerTask } from '@/core/dayPlanner/dto/response/PlannerTask.ts'

	const emit = defineEmits<{ replanned: [] }>()

	const store = useDayPlannerStore()
	const { currentTime } = useCurrentTime()
	const { replanRestOfToday, previewing } = useDayReplan()

	const dismissed = ref(false)

	// A calendar day on the left, "what day is it now" in the user's zone on the right; see `useUserClock`.
	// Re-wrapped because the store persists to sessionStorage: after a reload `viewedDate` is an ISO string, and
	// `formatDateForApi` on it threw inside this computed — which blanked the whole day view.
	const viewedIsoDate = computed(() => formatDateForApi(new Date(store.viewedDate)))
	const isToday = computed(() => viewedIsoDate.value === isoDateInUserZone(currentTime.value))

	const shown = computed(() => {
		if (dismissed.value || !isToday.value) return false
		const now = minutesOfDayInUserZone(currentTime.value)
		return store.tasks.some(task => isMissedAndMovable(task as PlannerTask, now))
	})

	async function replan() {
		const result = await replanRestOfToday(viewedIsoDate.value, store.tasks as PlannerTask[])
		if (result) emit('replanned')
	}
</script>
