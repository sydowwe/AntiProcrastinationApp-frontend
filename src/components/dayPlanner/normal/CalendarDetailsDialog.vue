<template>
<MyDialog
	title="Day Details"
	v-model="model"
	@confirmed="save"
	maxWidth="600px"
>
	<VForm ref="form" @submit="save" validate-on="submit">
		<VRow>
			<!-- Wake-up and Bed Time -->
			<VCol class="d-flex justify-center" cols="12">
				<TimeRangePicker
					v-model:start="data.wakeUpTime"
					v-model:end="data.bedTime"
					startIcon="sun"
					endIcon="moon"
				/>
			</VCol>

			<!-- Label -->
			<VCol cols="12">
				<VTextField
					v-model="data.label"
					label="Day Label"
					prependIcon="tag"
					placeholder="e.g., Project Deadline, Birthday..."
					clearable
					hideDetails
				/>
			</VCol>

			<!-- Day Type -->
			<VCol cols="12" sm="6">
				<VSelect
					v-model="data.dayType"
					label="Day Type"
					:items="dayTypeOptions"
					prependIcon="calendar-day"
					hideDetails
				/>
			</VCol>

			<!-- Weather -->
			<VCol cols="12" sm="6">
				<VTextField
					v-model="data.weather"
					label="Weather"
					prependIcon="cloud-sun"
					placeholder="e.g., Sunny, Rainy..."
					clearable
					hideDetails
				/>
			</VCol>

			<!-- Notes -->
			<VCol cols="12">
				<VTextarea
					v-model="data.notes"
					label="Notes"
					prependIcon="note-sticky"
					rows="4"
					autoGrow
					placeholder="Add any notes about this day..."
				/>
			</VCol>
		</VRow>
	</VForm>
</MyDialog>
</template>

<script setup lang="ts">
import {ref, watch} from 'vue'
import MyDialog from '@/components/dialogs/MyDialog.vue'
import TimeRangePicker from '@/components/general/dateTime/TimeRangePicker.vue'
import type {VForm} from 'vuetify/components'
import {CalendarRequest} from '@/dtos/request/activityPlanning/CalendarRequest.ts'
import {DayType} from '@/dtos/enum/DayType.ts'
import type {Calendar} from '@/dtos/response/activityPlanning/Calendar.ts'
import {useCalendarQuery} from '@/composables/ConcretesCrudComposable.ts';
import {useSnackbar} from '@/composables/general/SnackbarComposable.ts';

const {updateWithResponse} = useCalendarQuery()
const {showErrorSnackbar} = useSnackbar()

const model = defineModel<boolean>({required: true})
const form = ref<InstanceType<typeof VForm>>()
const data = ref<CalendarRequest>(new CalendarRequest())

const dayTypeOptions = Object.values(DayType)

const props = defineProps<{
	calendar: Calendar | undefined
}>()

// Watch for calendar changes to populate form
watch(() => props.calendar, (calendar) => {
	if (calendar) {
		data.value = CalendarRequest.fromResponse(calendar)
	}
}, {immediate: true})

async function save() {
	const isValid = await form.value?.validate()
	if (!isValid || !props.calendar?.id) {
		return
	}
	await updateWithResponse(props.calendar?.id, data.value).then(
		updatedEntity => {
			emit('updated', updatedEntity)
			model.value = false
		}).catch(() => {
		showErrorSnackbar('Failed to update calendar')
	})
}

const emit = defineEmits<{
	updated: [updatedEntity: Calendar]
}>()
</script>
