<template>
	<VForm
		ref="form"
		class="d-flex flex-column ga-4 pt-2"
		validateOn="submit"
		@submit.prevent="onConfirm"
	>
		<VTextField
			v-model="request.name"
			:label="t('planner.timeAway.nameLabel')"
			:placeholder="t('planner.timeAway.namePlaceholder')"
			prependIcon="tag"
			:rules="[requiredRule]"
			:errorMessages="nameError"
			counter="100"
			maxlength="100"
			autofocus
		/>

		<div class="d-flex align-center flex-wrap ga-3">
			<span class="text-medium-emphasis">{{ t('planner.timeAway.kindLabel') }}</span>
			<MyBtnToggle
				v-model="request.kind"
				:label="t('planner.timeAway.kindLabel')"
				mandatory
				variant="outlined"
				color="secondaryOutline"
				density="comfortable"
			>
				<VBtn
					v-for="kind in awayDayTypes"
					:key="kind"
					:value="kind"
					:prependIcon="getDayTypeIcon(kind)"
				>
					{{ t(`planner.dayType.${kind}`) }}
				</VBtn>
			</MyBtnToggle>
		</div>

		<div>
			<DateRangePicker
				ref="picker"
				v-model="range"
				v-model:mode="rangeMode"
				:label="t('planner.timeAway.datesLabel')"
				:maxDays="MAX_SPAN_DAYS - 1"
				hideDetails
			/>
			<!-- The overlap 400 names the stretch it runs into; it belongs here, not in a snackbar. -->
			<div
				v-if="rangeError"
				class="text-error text-caption mt-2"
				role="alert"
			>
				{{ rangeError }}
			</div>
		</div>

		<VSelect
			v-model="request.templateId"
			:label="t('planner.timeAway.templateLabel')"
			:items="templateOptions"
			itemValue="id"
			itemTitle="name"
			prependIcon="layer-group"
			:hint="t('planner.timeAway.templateHint')"
			persistentHint
			:errorMessages="templateError"
			clearable
		/>

		<VSelect
			v-model="request.location"
			:label="t('planner.timeAway.locationLabel')"
			:items="locationOptions"
			prependIcon="location-dot"
			clearable
			hideDetails
		/>

		<VTextarea
			v-model="request.notes"
			:label="t('planner.timeAway.notesLabel')"
			prependIcon="note-sticky"
			rows="2"
			autoGrow
			counter="1000"
			maxlength="1000"
		/>
	</VForm>
</template>

<script setup lang="ts">
	import { computed, onMounted, ref } from 'vue'
	import axios from 'axios'
	import { useI18n } from 'vue-i18n'
	import type { VForm } from 'vuetify/components'
	import { getDayTypeIcon } from '@/_common/dto/enum/DayType.ts'
	import type { DateRangeMode } from '@/_common/dto/DateRangeConfig.ts'
	import { extractServerFieldError, extractServerMessage } from '@/_common/axiosConfig.ts'
	import { useDialogApi } from '@/_common/composable/general/useDialog.ts'
	import { useSnackbar } from '@/_common/composable/general/SnackbarComposable.ts'
	import { useGeneralRules } from '@/_common/composable/general/rules/RulesComposition.ts'
	import DateRangePicker from '@/_common/component/dateTime/DateRangePicker.vue'
	import MyBtnToggle from '@/_common/component/inputs/MyBtnToggle.vue'
	import { awayDayTypes } from '@/core/dayPlanner/dto/enum/awayDayType.ts'
	import { Location } from '@/core/dayPlanner/dto/enum/Location.ts'
	import { TimeAwayRequest } from '@/core/dayPlanner/dto/request/TimeAwayRequest.ts'
	import type { TimeAway } from '@/core/dayPlanner/dto/response/TimeAway.ts'
	import type { TaskPlannerDayTemplate } from '@/core/dayPlanner/dto/response/template/TaskPlannerDayTemplate.ts'
	import { useTimeAwayCrud } from '@/core/dayPlanner/api/timeAwayApi.ts'
	import { useTaskPlannerDayTemplateTaskCrud } from '@/core/dayPlanner/api/taskPlannerDayTemplateApi.ts'
	import type { TimeAwayFormResult } from '@/core/dayPlanner/composable/useTimeAwayDialog.ts'

	const {
		timeAway = null,
		start = null,
		end = null,
	} = defineProps<{
		/** Set to edit that stretch; unset to mark a new one. */
		timeAway?: TimeAway | null
		/** Prefill for a new stretch — the selected days, or the one day the details dialog is on. */
		start?: Date | null
		end?: Date | null
	}>()

	// The server's ceiling, both ends counted (`PlannerBatchLimits.MaxCalendarIds`). The picker counts the
	// gap between the ends, hence the `- 1` where it is passed.
	const MAX_SPAN_DAYS = 366

	const { t } = useI18n()
	const dialogApi = useDialogApi<TimeAwayFormResult>()
	const { showErrorSnackbar } = useSnackbar()
	const { requiredRule } = useGeneralRules()
	const { createStretch, updateStretch } = useTimeAwayCrud()
	const { fetchAll: fetchAllTemplates } = useTaskPlannerDayTemplateTaskCrud()

	const form = ref<InstanceType<typeof VForm>>()
	const picker = ref<InstanceType<typeof DateRangePicker>>()
	const request = ref<TimeAwayRequest>(timeAway ? TimeAwayRequest.fromTimeAway(timeAway) : new TimeAwayRequest())
	const range = ref<{ start: Date | null; end: Date | null }>({
		start: timeAway?.start ?? start,
		end: timeAway?.end ?? end ?? start,
	})
	const rangeMode = ref<DateRangeMode>('range')
	const templates = ref<TaskPlannerDayTemplate[]>([])

	const nameError = ref<string>()
	const rangeError = ref<string | null>(null)
	const templateError = ref<string>()

	const locationOptions = Object.values(Location).map(v => ({ title: t(`planner.location.${v}`), value: v }))

	// Active templates only, plus the one the stretch already names even if it has since been switched
	// off — otherwise the select would show a bare id.
	const templateOptions = computed(() =>
		templates.value.filter(template => template.isActive || template.id === request.value.templateId),
	)

	onMounted(async () => {
		templates.value = await fetchAllTemplates().catch(() => [] as TaskPlannerDayTemplate[])
	})

	dialogApi.onConfirm(onConfirm)

	function clearServerErrors() {
		nameError.value = undefined
		rangeError.value = null
		templateError.value = undefined
	}

	/** True when the 400/404 named a field this form shows; the message then sits on that field. */
	function applyServerError(error: unknown): boolean {
		if (!axios.isAxiosError(error)) return false
		nameError.value = extractServerFieldError(error, 'name')
		rangeError.value = extractServerFieldError(error, 'startDate', 'endDate') ?? null
		templateError.value = extractServerFieldError(error, 'templateId')
		return nameError.value !== undefined || rangeError.value !== null || templateError.value !== undefined
	}

	async function onConfirm() {
		clearServerErrors()
		const { valid } = (await form.value?.validate()) ?? { valid: false }
		// The picker shows its own message for a reversed or too-long range and returns null for it.
		const picked = picker.value?.getDateRange()
		if (picker.value?.isValid() && (!picked?.start || !picked.end)) {
			rangeError.value = t('planner.timeAway.datesRequired')
		}
		if (!valid || !picked?.start || !picked.end) return

		request.value.startDate = picked.start
		request.value.endDate = picked.end
		dialogApi.setLoading(true)
		try {
			// Silent: the form places field errors itself, and only the rest reach a snackbar.
			const stamp = timeAway
				? await updateStretch(timeAway.id, request.value, { _silent: true })
				: await createStretch(request.value, { _silent: true })
			dialogApi.close({ stamp, name: request.value.name.trim() })
		} catch (error) {
			if (!applyServerError(error)) {
				const serverMessage = axios.isAxiosError(error) ? extractServerMessage(error) : undefined
				showErrorSnackbar(serverMessage ?? t('planner.timeAway.saveFailed'))
			}
		} finally {
			dialogApi.setLoading(false)
		}
	}
</script>
