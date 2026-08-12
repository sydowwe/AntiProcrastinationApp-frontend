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
		<p
			class="text-caption text-medium-emphasis ma-0"
			style="white-space: normal"
		>
			{{ itemNames }}
		</p>
	</SubtleCard>
</template>

<script setup lang="ts">
	import { computed, onMounted } from 'vue'
	import SubtleCard from '@/_common/component/feedback/SubtleCard.vue'
	import { fromSeconds } from '@/_common/utils/formatDuration.ts'
	import { useDailyRecap } from '@/core/todoList/composable/useDailyRecap.ts'

	const { recap, ensureLoadedForToday } = useDailyRecap()

	onMounted(ensureLoadedForToday)

	const formattedTotal = computed(() => fromSeconds(recap.value?.totalTimeLoggedSeconds ?? 0))
	const itemNames = computed(() => recap.value?.items.map(item => item.name).join(', ') ?? '')
</script>
