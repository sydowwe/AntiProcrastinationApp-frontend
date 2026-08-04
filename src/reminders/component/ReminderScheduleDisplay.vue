<template>
	<span class="d-inline-flex align-center ga-2">
		<VIcon
			:icon="scheduleIcon"
			size="14"
			class="text-medium-emphasis"
		/>
		<code
			v-if="scheduleType === ReminderScheduleType.RecurringCron"
			class="schedule-cron"
		>
			{{ cronExpression ?? '—' }}
		</code>
		<span v-else-if="scheduleType === ReminderScheduleType.RecurringInterval">{{ intervalLabel }}</span>
		<span v-else>{{ oneShotLabel }}</span>
	</span>
</template>

<script setup lang="ts">
	import { computed } from 'vue'
	import { useI18n } from 'vue-i18n'
	import { ReminderScheduleType } from '@/core/reminders/dto/enum/ReminderScheduleType.ts'
	import type { IntervalPreset } from '@/core/reminders/dto/enum/IntervalPreset.ts'
	import { useReminderFormat } from '@/core/reminders/composable/useReminderFormat.ts'

	const { scheduleType, cronExpression, intervalPreset, dueAt } = defineProps<{
		scheduleType: ReminderScheduleType
		cronExpression?: string | null
		intervalPreset?: IntervalPreset | null
		dueAt?: Date | null
	}>()

	const i18n = useI18n()
	const { formatInstant } = useReminderFormat()

	const scheduleIcon = computed(() => {
		switch (scheduleType) {
			case ReminderScheduleType.RecurringCron:
				return 'terminal'
			case ReminderScheduleType.RecurringInterval:
				return 'repeat'
			default:
				return 'calendar-day'
		}
	})

	const intervalLabel = computed(() => (intervalPreset ? i18n.t(`reminders.intervalPreset.${intervalPreset}`) : '—'))

	const oneShotLabel = computed(() =>
		dueAt
			? i18n.t('reminders.schedule.dueDate', { date: formatInstant(dueAt) })
			: i18n.t('reminders.scheduleType.OneShot'),
	)
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
