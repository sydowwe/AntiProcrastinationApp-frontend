<template>
	<div class="d-flex align-center ga-4 flex-wrap">
		<!--
			Presets are the primary control, not the two-date picker: "what did I do today" is most
			sessions, and "today" is one click from anywhere including custom.
		-->
		<VChipGroup
			:modelValue="activePreset"
			mandatory
			selectedClass="text-primary"
			@update:modelValue="onPresetSelect"
		>
			<VChip
				v-for="option in presetOptions"
				:key="option.value"
				:value="option.value"
				size="small"
				variant="outlined"
			>
				{{ option.label }}
			</VChip>
			<VChip
				value="custom"
				size="small"
				variant="outlined"
			>
				{{ $t('activityTracking.range.custom') }}
			</VChip>
		</VChipGroup>

		<!-- Only the custom chip reveals the full picker; the presets keep the header compact. -->
		<DateRangePicker
			v-if="activePreset === 'custom'"
			v-model="customRange"
			mode="range"
			:maxDays="MAX_RANGE_DAYS"
			hideDetails
			density="compact"
		/>

		<span
			v-else-if="isRangeMode"
			class="text-caption text-medium-emphasis"
		>
			{{ spanLabel }}
		</span>
	</div>
</template>

<script setup lang="ts">
	import { computed, ref, watch } from 'vue'
	import DateRangePicker from '@/_common/component/dateTime/DateRangePicker.vue'
	import { formatToDate } from '@/_common/utils/DateTimeHelper.ts'
	import {
		useActivityRangePresets,
		daySpanCount,
		isSameDay,
		MAX_RANGE_DAYS,
		type ActivityRangePreset,
	} from '@/core/activityTracking/composable/useActivityRangePresets.ts'

	const { dateFrom, dateTo } = defineProps<{
		dateFrom: Date
		dateTo: Date
	}>()

	// One event carrying both endpoints rather than two models: the dashboard refetches on any date
	// change, and two separate updates would fire a round against a half-applied span.
	const emit = defineEmits<{
		change: [dateFrom: Date, dateTo: Date]
	}>()

	// `MAX_RANGE_DAYS` is the contract's own cap, not a picker preference — the framework picker
	// defaults to 31, which would refuse the "last 30 days" preset's own neighbourhood the moment
	// someone nudged an endpoint.
	const { presetOptions, resolve, detect } = useActivityRangePresets()

	const today = new Date()

	const isRangeMode = computed(() => daySpanCount(dateFrom, dateTo) > 1)

	/**
	 * Derived from the dates rather than stored. That keeps the URL canonical — a link shared while
	 * "last 7 days" was active reopens on those seven absolute days later, correctly showing as custom
	 * rather than silently re-resolving to a different week.
	 */
	const detectedPreset = computed<ActivityRangePreset>(() => detect(dateFrom, dateTo))

	// Sticky: once the user opens the custom picker it stays open even while the dates they type happen
	// to match a preset, so the inputs do not vanish mid-edit.
	const isCustomPinned = ref(false)
	const activePreset = computed<ActivityRangePreset>(() => (isCustomPinned.value ? 'custom' : detectedPreset.value))

	const spanLabel = computed(() => `${formatToDate(dateFrom)} – ${formatToDate(dateTo)}`)

	const customRange = ref<{ start: Date | null; end: Date | null }>({ start: dateFrom, end: dateTo })

	watch(
		() => [dateFrom, dateTo] as const,
		([from, to]) => {
			if (isSameDay(customRange.value.start ?? from, from) && isSameDay(customRange.value.end ?? to, to)) {
				return
			}
			customRange.value = { start: from, end: to }
		},
	)

	watch(customRange, value => {
		if (!value.start || !value.end) return
		// The framework picker caps the span length but not its end, so an end in the future is
		// reachable there. Clamping here rather than rejecting keeps a mistyped year usable.
		const end = value.end > today ? today : value.end
		const start = value.start > end ? end : value.start
		if (isSameDay(start, dateFrom) && isSameDay(end, dateTo)) return
		emit('change', start, end)
	})

	function onPresetSelect(value: unknown) {
		const preset = value as ActivityRangePreset
		if (preset === 'custom') {
			isCustomPinned.value = true
			return
		}
		isCustomPinned.value = false
		const span = resolve(preset)
		emit('change', span.dateFrom, span.dateTo)
	}
</script>
