<template>
	<SubtleCard
		v-if="recap && recap.items.length > 0"
		color="successDark"
		icon="circle-check"
		coloredText
	>
		<p class="text-body-2 ma-0 mb-1">
			{{ $t('toDoList.recap.summary', { count: recap.items.length, time: formattedTotal }, recap.items.length) }}
		</p>
		<ul
			class="text-caption ma-0 pa-0"
			style="list-style: none"
			data-testid="daily-recap-items"
		>
			<!-- The &nbsp; is the row's text separator: a flex gap alone reads "Gym45m" to a screen reader. -->
			<li
				v-for="item in visibleItems"
				:key="item.itemId"
			>
				<span class="text-medium-emphasis">{{ item.name }}</span>
				<span
					v-if="item.timeLoggedSeconds > 0"
					class="font-weight-medium ms-1"
				>
					&nbsp;{{ formatItemTime(item.timeLoggedSeconds) }}
				</span>
			</li>
		</ul>
		<VBtn
			v-if="hiddenCount > 0"
			variant="text"
			size="x-small"
			color="successDark"
			class="mt-1 px-1"
			:aria-expanded="expanded"
			@click="expanded = !expanded"
		>
			{{
				expanded
					? $t('toDoList.recap.showLess')
					: $t('toDoList.recap.showMore', { count: hiddenCount }, hiddenCount)
			}}
		</VBtn>
	</SubtleCard>
</template>

<script setup lang="ts">
	import { computed, onMounted, ref } from 'vue'
	import SubtleCard from '@/_common/component/feedback/SubtleCard.vue'
	import { fromSeconds, fromSecondsDetailed } from '@/_common/utils/formatDuration.ts'
	import { useDailyRecap } from '@/core/todoList/composable/useDailyRecap.ts'

	/** Rows shown before "+ N more". A full day can list a dozen items, and the card sits above the list itself. */
	const MAX_VISIBLE = 5

	const { recap, ensureLoadedForToday } = useDailyRecap()

	onMounted(ensureLoadedForToday)

	const expanded = ref(false)

	const formattedTotal = computed(() => fromSeconds(recap.value?.totalTimeLoggedSeconds ?? 0))
	const visibleItems = computed(() => {
		const items = recap.value?.items ?? []
		return expanded.value ? items : items.slice(0, MAX_VISIBLE)
	})
	const hiddenCount = computed(() => Math.max(0, (recap.value?.items.length ?? 0) - MAX_VISIBLE))

	// A timer stopped inside its first minute is still time on the item; `fromSeconds` would floor it to "0m".
	function formatItemTime(seconds: number) {
		return seconds < 60 ? fromSecondsDetailed(seconds) : fromSeconds(seconds)
	}
</script>
