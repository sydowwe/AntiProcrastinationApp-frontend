<template>
	<span class="d-inline-flex align-center ga-2">
		<VIcon
			:icon="scheduleType === ScheduleType.Cron ? 'terminal' : 'repeat'"
			size="14"
			class="text-medium-emphasis"
		/>
		<code
			v-if="scheduleType === ScheduleType.Cron"
			class="schedule-cron"
		>
			{{ cronExpression ?? '—' }}
		</code>
		<span v-else>{{ intervalLabel }}</span>
	</span>
</template>

<script setup lang="ts">
	import { computed } from 'vue'
	import { useI18n } from 'vue-i18n'
	import { ScheduleType } from '@/core/scheduler/dto/enum/ScheduleType.ts'
	import type { IntervalUnit } from '@/core/scheduler/dto/enum/IntervalUnit.ts'

	const { scheduleType, cronExpression, intervalValue, intervalUnit } = defineProps<{
		scheduleType: ScheduleType
		cronExpression: string | null
		intervalValue: number | null
		intervalUnit: IntervalUnit | null
	}>()

	const i18n = useI18n()

	const intervalLabel = computed(() => {
		if (intervalValue === null || intervalUnit === null) return '—'
		const unit = i18n.t(`scheduler.intervalUnit.${intervalUnit}`, intervalValue)
		return i18n.t('scheduler.schedule.everyInterval', { n: intervalValue, unit })
	})
</script>

<style scoped>
	.schedule-cron {
		font-family: monospace;
		font-size: 0.8125rem;
		background: rgba(var(--v-theme-on-surface), 0.07);
		padding: 1px 6px;
		border-radius: 4px;
	}
</style>
