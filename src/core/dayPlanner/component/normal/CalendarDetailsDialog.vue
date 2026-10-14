<template>
	<MyDialog
		v-model="model"
		:title="$t('planner.calendar.dayDetailsTitle')"
		maxWidth="600px"
		@confirmed="save"
	>
		<VForm
			ref="form"
			class="pt-2"
			validateOn="submit"
			@submit="save"
		>
			<div class="d-flex flex-column ga-4">
				<!-- Wake-up and Bed Time -->
				<div class="d-flex justify-center">
					<TimeRangePicker
						v-model:start="data.wakeUpTime"
						v-model:end="data.bedTime"
						startIcon="sun"
						endIcon="moon"
					/>
				</div>

				<!-- Label -->
				<VTextField
					v-model="data.label"
					:label="$t('planner.calendar.dayLabelLabel')"
					prependIcon="tag"
					:placeholder="$t('planner.calendar.dayLabelPlaceholder')"
					clearable
					hideDetails
				/>

				<!-- Day Type, Location & Weather -->
				<!-- Stacked below `sm`: side by side in a phone-width dialog, Location was left 76 px and read "L…". -->
				<div class="d-flex flex-column flex-sm-row ga-4">
					<VSelect
						v-model="data.dayType"
						:label="$t('planner.calendar.dayTypeLabel')"
						:items="dayTypeOptions"
						prependIcon="calendar-day"
						:maxWidth="smAndUp ? '200px' : undefined"
						hideDetails
					/>
					<VSelect
						v-model="data.location"
						:label="$t('planner.calendar.locationLabel')"
						:items="locationOptions"
						prependIcon="location-dot"
						clearable
						hideDetails
					/>
				</div>
				<div
					v-if="isAwayDayType(data.dayType)"
					class="d-flex align-start ga-2 text-caption text-medium-emphasis"
				>
					<VIconSmall
						icon="umbrella-beach"
						class="mt-1"
					/>
					<span>{{ $t('planner.calendar.awayDayHint') }}</span>
				</div>
				<!-- F4-02: a stretch is marked once for all its days, so it opens its own dialog rather than
				     being a field of this one. -->
				<div class="d-flex align-center flex-wrap ga-2">
					<template v-if="current?.timeAwayId != null">
						<VIconSmall icon="umbrella-beach" />
						<span class="text-body-2">
							{{ $t('planner.timeAway.partOf', { name: current.timeAwayName }) }}
						</span>
						<VBtn
							variant="text"
							color="secondaryOutline"
							size="small"
							:loading="timeAwayBusy"
							@click="editTimeAway"
						>
							{{ $t('planner.timeAway.edit') }}
						</VBtn>
					</template>
					<VBtn
						v-else
						variant="tonal"
						color="secondaryOutline"
						prependIcon="umbrella-beach"
						:loading="timeAwayBusy"
						@click="markTimeAway"
					>
						{{ $t('planner.timeAway.markAction') }}
					</VBtn>
				</div>
				<VTextField
					v-model="data.weather"
					:label="$t('planner.calendar.weatherLabel')"
					prependIcon="cloud-sun"
					:placeholder="$t('planner.calendar.weatherPlaceholder')"
					clearable
					hideDetails
				/>
				<!-- Notes -->
				<VTextarea
					v-model="data.notes"
					:label="$t('planner.calendar.notesLabel')"
					prependIcon="note-sticky"
					rows="4"
					autoGrow
					:placeholder="$t('planner.calendar.notesPlaceholder')"
				/>
			</div>
		</VForm>
	</MyDialog>
</template>

<script setup lang="ts">
	import { computed, ref, watch } from 'vue'
	import MyDialog from '@/_common/component/dialog/MyDialog.vue'
	import TimeRangePicker from '@/_common/component/dateTime/TimeRangePicker.vue'
	import type { VForm } from 'vuetify/components'
	import { CalendarRequest } from '@/core/dayPlanner/dto/request/CalendarRequest.ts'
	import { DayType } from '@/_common/dto/enum/DayType.ts'
	import { isAwayDayType } from '@/core/dayPlanner/dto/enum/awayDayType.ts'
	import { Location } from '@/core/dayPlanner/dto/enum/Location.ts'
	import type { Calendar } from '@/core/dayPlanner/dto/response/Calendar.ts'
	import { useCalendarQuery } from '@/core/activityHistory/api/calendarApi.ts'
	import { useSnackbar } from '@/_common/composable/general/SnackbarComposable.ts'
	import { useI18n } from 'vue-i18n'
	import { useDisplay } from 'vuetify'
	import { parseDateFromApi } from '@/_common/utils/DateTimeHelper.ts'
	import { useTimeAwayCrud } from '@/core/dayPlanner/api/timeAwayApi.ts'
	import { useTimeAwayDialog } from '@/core/dayPlanner/composable/useTimeAwayDialog.ts'
	import type { TimeAwayStamp } from '@/core/dayPlanner/dto/response/TimeAwayStamp.ts'

	const props = defineProps<{
		calendar?: Calendar
	}>()
	const emit = defineEmits<{
		updated: [updatedEntity: Calendar]
	}>()
	const model = defineModel<boolean>({ required: true })
	const { updateWithResponse, fetchById: fetchCalendarById } = useCalendarQuery()
	const { fetchById: fetchTimeAwayById } = useTimeAwayCrud()
	const { openTimeAwayDialog } = useTimeAwayDialog()
	const { showErrorSnackbar } = useSnackbar()
	const { t } = useI18n()
	const { smAndUp } = useDisplay()

	const form = ref<InstanceType<typeof VForm>>()
	const data = ref<CalendarRequest>(new CalendarRequest())
	// The day as last read: the prop, or the server's copy after a stretch was marked from here. The
	// calendar grid does not hand back a new prop after its refresh, so the prop alone would go stale.
	const current = ref<Calendar>()
	const timeAwayBusy = ref(false)

	const locationOptions = Object.values(Location).map(v => ({ title: t(`planner.location.${v}`), value: v }))
	const overrideDayTypes = [DayType.Vacation, DayType.SickDay, DayType.Special]

	function getNaturalDayType(): DayType {
		// dayIndex 6 or 7 = weekend (Saturday/Sunday). Optional: a throw here, from a render with no row
		// yet, left the dialog dead for the life of the page.
		if (props.calendar?.dayIndex === 6 || props.calendar?.dayIndex === 7) {
			return DayType.Weekend
		}
		return DayType.Workday
	}

	const dayTypeOptions = computed(() => {
		const naturalType = getNaturalDayType()
		// Show natural type + override types (Vacation, SickDay, Special)
		return [naturalType, ...overrideDayTypes].map(v => ({ title: t(`planner.dayType.${v}`), value: v }))
	})

	// Watch for calendar changes to populate form
	watch(
		() => props.calendar,
		calendar => {
			if (calendar) {
				current.value = calendar
				data.value = CalendarRequest.fromResponse(calendar)
			}
		},
		{ immediate: true },
	)

	async function markTimeAway() {
		const date = current.value ? parseDateFromApi(current.value.date) : null
		if (!date) return
		await afterStamp(await openTimeAwayDialog({ start: date, end: date }))
	}

	async function editTimeAway() {
		const timeAwayId = current.value?.timeAwayId
		if (timeAwayId == null) return
		timeAwayBusy.value = true
		// A failed read has already raised the interceptor's snackbar.
		const timeAway = await fetchTimeAwayById(timeAwayId).catch(() => null)
		timeAwayBusy.value = false
		if (!timeAway) return
		await afterStamp(await openTimeAwayDialog({ timeAway }))
	}

	// The stamp changed this day's type (and maybe its location) on the server. Re-read it, so a Save
	// here cannot write the old type back over the stretch's, and tell the parent to refresh.
	async function afterStamp(stamp: TimeAwayStamp | null) {
		const id = current.value?.id
		if (!stamp || id == null) return
		timeAwayBusy.value = true
		try {
			const fresh = await fetchCalendarById(id)
			current.value = fresh
			data.value = CalendarRequest.fromResponse(fresh)
			emit('updated', fresh)
		} catch {
			// The stretch is saved; only this re-read failed, and the interceptor has said so.
		} finally {
			timeAwayBusy.value = false
		}
	}

	async function save() {
		const isValid = await form.value?.validate()
		const id = props.calendar?.id
		if (!isValid?.valid || !id) {
			return
		}
		await updateWithResponse(id, data.value)
			.then(updatedEntity => {
				emit('updated', updatedEntity)
				model.value = false
			})
			.catch(() => {
				showErrorSnackbar(t('planner.feedback.calendarUpdateFailed'))
			})
	}
</script>
