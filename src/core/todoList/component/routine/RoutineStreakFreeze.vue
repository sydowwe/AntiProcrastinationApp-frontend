<template>
	<!--
		Renders nothing unless the server reports a freeze budget. Until the endpoint in
		prompts/todo-motivation/backend/R1-backend.md exists, `freezesRemaining` is null everywhere and
		this component is invisible — no placeholder text, no invented number.
	-->
	<div
		v-if="timePeriod.supportsFreeze"
		class="d-flex align-center ga-2 flex-wrap"
	>
		<VTooltip
			:text="remainingTooltip"
			location="bottom"
		>
			<template #activator="{ props: tooltipProps }">
				<span
					v-bind="tooltipProps"
					class="text-caption d-flex align-center ga-1"
					:class="remaining > 0 ? 'text-info' : 'text-medium-emphasis'"
					style="cursor: default"
				>
					<VIcon
						icon="snowflake"
						size="12"
					/>
					{{ $t('routineTodoList.freeze.remaining', { count: remaining }, remaining) }}
				</span>
			</template>
		</VTooltip>

		<VBtn
			v-if="miss"
			size="x-small"
			variant="tonal"
			color="primaryOutline"
			prependIcon="snowflake"
			:loading="isSpending"
			@click="onCoverMiss"
		>
			{{ $t('routineTodoList.freeze.coverMiss') }}
		</VBtn>
	</div>
</template>

<script setup lang="ts">
	import { computed, ref } from 'vue'
	import { useI18n } from 'vue-i18n'
	import { useStreakFreeze } from '@/core/todoList/composable/useStreakFreeze.ts'
	import type { RoutineTimePeriodEntity } from '@/core/todoList/dto/response/routine/RoutineTimePeriodEntity.ts'

	const { timePeriod } = defineProps<{ timePeriod: RoutineTimePeriodEntity }>()

	const emit = defineEmits<{ freezeSpent: [] }>()

	const { t } = useI18n()
	const { coverableMiss, requestFreeze } = useStreakFreeze()

	const isSpending = ref(false)

	const remaining = computed(() => timePeriod.freezesRemaining ?? 0)

	// The one miss the user can still rescue, if any. Null hides the button entirely.
	const miss = computed(() => coverableMiss(timePeriod))

	const remainingTooltip = computed(() => {
		if (timePeriod.freezeBudgetResetsAt) {
			return t('routineTodoList.freeze.remainingTooltipWithReset', {
				budget: timePeriod.freezeBudget ?? remaining.value,
				date: new Date(timePeriod.freezeBudgetResetsAt).toLocaleDateString(undefined, {
					month: 'short',
					day: 'numeric',
				}),
			})
		}
		return t('routineTodoList.freeze.remainingTooltip', { budget: timePeriod.freezeBudget ?? remaining.value })
	})

	async function onCoverMiss() {
		if (!miss.value) return
		isSpending.value = true
		try {
			const updated = await requestFreeze(timePeriod, miss.value)
			// The server owns the recomputed streak and budget, so the group is reloaded rather than patched.
			if (updated) emit('freezeSpent')
		} finally {
			isSpending.value = false
		}
	}
</script>
