<template>
	<div class="d-flex align-center ga-4 flex-wrap">
		<VSelect
			v-model="selectedRangeType"
			:label="$t('historyDashboard.dateRange.rangeLength')"
			:items="rangeTypeItems"
			itemTitle="title"
			itemValue="value"
			variant="outlined"
			density="compact"
			hideDetails
			style="min-width: 140px; max-width: 140px"
		/>

		<MyDateInput
			v-model="dateFrom"
			:label="$t('historyDashboard.dateRange.from')"
			hideDetails
			:max="dateTo ?? today"
			density="compact"
		/>
		<template v-if="selectedRangeType === ActivityDateRangeTypeEnum.CustomRange">
			<MyDateInput
				v-model="dateTo"
				:label="$t('historyDashboard.dateRange.to')"
				hideDetails
				:min="dateFrom"
				:max="today"
				density="compact"
			/>
		</template>
	</div>
</template>

<script setup lang="ts">
	import { computed, ref, watch } from 'vue'
	import { useI18n } from 'vue-i18n'
	import { ActivityDateRangeTypeEnum } from '@/core/activityHistory/dto/request/ActivityDateRangeTypeEnum.ts'
	import MyDateInput from '@/_common/component/dateTime/MyDateInput.vue'
	import { formatDateForApi } from '@/_common/utils/DateTimeHelper.ts'

	const date = defineModel<string>('date', { required: true })

	const rangeType = defineModel<ActivityDateRangeTypeEnum>('rangeType', { required: true })

	const endDate = defineModel<string | undefined>('endDate', { required: true })

	const { t } = useI18n()
	const today = new Date()
	const selectedRangeType = ref<ActivityDateRangeTypeEnum>(rangeType.value)

	const rangeTypeItems = computed(() => [
		{ title: t('historyDashboard.dateRange.threeDays'), value: ActivityDateRangeTypeEnum.ThreeDays },
		{ title: t('historyDashboard.dateRange.sevenDays'), value: ActivityDateRangeTypeEnum.Week },
		{ title: t('historyDashboard.dateRange.twoWeeks'), value: ActivityDateRangeTypeEnum.TwoWeeks },
		{ title: t('historyDashboard.dateRange.month'), value: ActivityDateRangeTypeEnum.Month },
		{ title: t('historyDashboard.dateRange.threeMonths'), value: ActivityDateRangeTypeEnum.ThreeMonths },
		{ title: t('historyDashboard.dateRange.year'), value: ActivityDateRangeTypeEnum.Year },
		{ title: t('historyDashboard.dateRange.customRange'), value: ActivityDateRangeTypeEnum.CustomRange },
	])

	// --- Custom Range state ---
	const dateFrom = ref<Date>(date.value ? new Date(date.value) : new Date())
	const dateTo = ref<Date>(endDate.value ? new Date(endDate.value) : new Date())

	function emitValues() {
		const dateFromStr = formatDateForApi(dateFrom.value)
		rangeType.value = selectedRangeType.value

		switch (selectedRangeType.value) {
			case ActivityDateRangeTypeEnum.ThreeDays:
			case ActivityDateRangeTypeEnum.Week:
			case ActivityDateRangeTypeEnum.TwoWeeks:
			case ActivityDateRangeTypeEnum.Month:
			case ActivityDateRangeTypeEnum.ThreeMonths:
			case ActivityDateRangeTypeEnum.Year:
				date.value = dateFromStr
				endDate.value = undefined
				break
			case ActivityDateRangeTypeEnum.CustomRange:
				date.value = dateFromStr
				endDate.value = formatDateForApi(dateTo.value)
				break
		}
	}

	watch([selectedRangeType, dateFrom], () => emitValues(), { immediate: true })
	watch(
		dateTo,
		() => {
			if (selectedRangeType.value === ActivityDateRangeTypeEnum.CustomRange) emitValues()
		},
		{},
	)
</script>
