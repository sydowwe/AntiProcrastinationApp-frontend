<template>
	<VCard
		variant="outlined"
		class="pa-4"
	>
		<div class="d-flex align-start justify-space-between ga-3">
			<div
				class="d-flex flex-column ga-1"
				style="min-width: 0"
			>
				<div class="d-flex align-center flex-wrap ga-2">
					<h3 class="text-subtitle-1 font-weight-bold text-break">{{ timeAway.name }}</h3>
					<DayTypeChip
						:dayType="timeAway.kind"
						isTonal
					/>
					<VChip
						v-if="isOngoing"
						size="small"
						variant="tonal"
						color="success"
					>
						{{ t('planner.timeAway.ongoing') }}
					</VChip>
				</div>
				<div class="text-body-2 text-medium-emphasis">
					{{ dateRangeText }} ·
					{{ t('planner.timeAway.length', { count: timeAway.lengthInDays }, timeAway.lengthInDays) }}
				</div>
				<div
					v-if="timeAway.location || timeAway.templateName"
					class="d-flex flex-wrap align-center ga-3 text-caption text-medium-emphasis"
				>
					<span
						v-if="timeAway.location"
						class="d-flex align-center ga-1"
					>
						<VIconSmall :icon="LOCATION_ICONS[timeAway.location]" />
						{{ t(`planner.location.${timeAway.location}`) }}
					</span>
					<span
						v-if="timeAway.templateName"
						class="d-flex align-center ga-1"
					>
						<VIconSmall icon="layer-group" />
						{{ timeAway.templateName }}
					</span>
				</div>
				<p
					v-if="timeAway.notes"
					class="text-body-2 ma-0 mt-1 text-pre-wrap"
				>
					{{ timeAway.notes }}
				</p>
			</div>
			<div class="d-flex flex-shrink-0 ga-1">
				<VIconBtn
					variant="text"
					icon="pen"
					:aria-label="t('planner.timeAway.editNamed', { name: timeAway.name })"
					@click="emit('edit', timeAway)"
				/>
				<VIconBtn
					variant="text"
					color="error"
					icon="trash"
					:loading="deleting"
					:aria-label="t('planner.timeAway.deleteNamed', { name: timeAway.name })"
					@click="emit('delete', timeAway)"
				/>
			</div>
		</div>
	</VCard>
</template>

<script setup lang="ts">
	import { computed } from 'vue'
	import { useI18n } from 'vue-i18n'
	import { formatLocalized } from '@/_common/utils/DateTimeHelper.ts'
	import { isoDateInUserZone } from '@/_common/composable/general/useUserClock.ts'
	import DayTypeChip from '@/core/dayPlanner/component/misc/DayTypeChip.vue'
	import { LOCATION_ICONS } from '@/core/dayPlanner/dto/enum/Location.ts'
	import type { TimeAway } from '@/core/dayPlanner/dto/response/TimeAway.ts'

	const { timeAway, deleting = false } = defineProps<{
		timeAway: TimeAway
		deleting?: boolean
	}>()

	const emit = defineEmits<{
		edit: [timeAway: TimeAway]
		delete: [timeAway: TimeAway]
	}>()

	const { t } = useI18n()

	// ISO dates compare as strings; "today" is the user's, not the browser's (useUserClock).
	const isOngoing = computed(() => {
		const today = isoDateInUserZone()
		return timeAway.startDate <= today && today <= timeAway.endDate
	})

	const dateRangeText = computed(() => {
		const start = timeAway.start
		const end = timeAway.end
		if (!start || !end) return `${timeAway.startDate} – ${timeAway.endDate}`
		if (timeAway.startDate === timeAway.endDate) return formatLocalized(start, 'll')
		return t('planner.timeAway.dateRange', { start: formatLocalized(start, 'll'), end: formatLocalized(end, 'll') })
	})
</script>
