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
			<!-- MyDateInput hardcodes `hideDetails`, so the message cannot live under the field itself
			     without a framework change; it sits beside the pair instead. -->
			<div
				v-if="customRangeError"
				class="text-error text-caption"
				style="max-width: 220px"
			>
				{{ customRangeError }}
			</div>
		</template>
	</div>
</template>

<script setup lang="ts">
	import { computed, ref, watch } from 'vue'
	import { useI18n } from 'vue-i18n'
	import { ActivityDateRangeTypeEnum } from '@/core/activityHistory/dto/request/ActivityDateRangeTypeEnum.ts'
	import MyDateInput from '@/_common/component/dateTime/MyDateInput.vue'
	import { formatDateForApi } from '@/_common/utils/DateTimeHelper.ts'
	import { MAX_CUSTOM_RANGE_DAYS, inclusiveDaySpan } from '@/core/historyDashboard/dto/request/customRange.ts'

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

	/**
	 * The three `endDate` rejections `summary/*` returns, checked before the request rather than after
	 * (B3). Each maps to its own message: an inverted range reports as inverted and never as "too long",
	 * which is the distinction the raw 400 prose also makes. Presence is not checked separately — the
	 * picker cannot produce an absent `dateTo`.
	 */
	const customRangeError = computed<string | null>(() => {
		if (selectedRangeType.value !== ActivityDateRangeTypeEnum.CustomRange) return null
		const span = inclusiveDaySpan(dateFrom.value, dateTo.value)
		if (span < 1) return t('historyDashboard.dateRange.rangeInverted')
		if (span > MAX_CUSTOM_RANGE_DAYS) {
			return t('historyDashboard.dateRange.rangeTooLong', { max: MAX_CUSTOM_RANGE_DAYS })
		}
		return null
	})

	function emitValues() {
		const dateFromStr = formatDateForApi(dateFrom.value)

		switch (selectedRangeType.value) {
			case ActivityDateRangeTypeEnum.ThreeDays:
			case ActivityDateRangeTypeEnum.Week:
			case ActivityDateRangeTypeEnum.TwoWeeks:
			case ActivityDateRangeTypeEnum.Month:
			case ActivityDateRangeTypeEnum.ThreeMonths:
			case ActivityDateRangeTypeEnum.Year:
				rangeType.value = selectedRangeType.value
				date.value = dateFromStr
				// Only `CustomRange` reads `endDate` (B3 §3), so clearing it is cosmetic on the wire —
				// it is cleared so a stale value never reaches the URL and reads as a range the user picked.
				endDate.value = undefined
				break
			case ActivityDateRangeTypeEnum.CustomRange:
				// Hold the last valid range while the picked one would be rejected: emitting would fire
				// four requests that all 400 and clear all four panels behind the message.
				if (customRangeError.value !== null) return
				rangeType.value = selectedRangeType.value
				date.value = dateFromStr
				// Inclusive — the last day the user picked, never `endDate + 1` (B3 §2).
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
