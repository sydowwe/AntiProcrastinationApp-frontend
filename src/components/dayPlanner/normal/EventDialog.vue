<template>
<MyDialog
	:title="!isEdit ? 'Add New Event' : 'Edit Event'"
	v-model="store.dialog"
	@confirmed="save"
	maxWidth="500px"
>
	<VForm ref="form" @keyup.native.enter="save" @submit="save" validate-on="submit">
		<VRow>
			<VCol cols="12">
				<ActivitySelectOrQuickEditFormField ref="activityFormField" view-name="Planner task" :isEdit></ActivitySelectOrQuickEditFormField>
			</VCol>

			<VCol cols="12">
				<TimeRangePicker v-model:start="start" v-model:end="end"></TimeRangePicker>
			</VCol>

			<VCol cols="12" sm="6" class="d-flex align-center">
				<VMenu :closeOnContentClick="false">
					<template v-slot:activator="{ props }">
						<VBtn
							class="pr-3"
							v-bind="props"
							variant="outlined"
							prependIcon="palette"
							:readonly="isEdit"
						>
							Color
							<VSheet
								:color="store.editingEvent.color"
								class="ml-2"
								rounded="xl"
								width="20"
								height="20"
							/>
						</VBtn>
					</template>
					<template v-slot:default>
						<VColorPicker v-model="store.editingEvent.color"/>
					</template>
				</VMenu>
			</VCol>

			<VCol cols="12" sm="6">
				<VSwitch
					label="Is background"
					color="primary"
					v-model="store.editingEvent.isBackground"
					hideDetails
				/>
			</VCol>
		</VRow>
	</VForm>
</MyDialog>
</template>

<script setup lang="ts">
import {computed, ref, watch} from 'vue'
import MyDialog from '@/components/dialogs/MyDialog.vue'
import ActivitySelectOrQuickEditFormField from '@/components/ActivitySelectOrQuickEditFormField.vue';
import type {VForm} from 'vuetify/components';
import TimeRangePicker from '@/components/general/dateTime/TimeRangePicker.vue';
import {Time} from '@/utils/Time.ts';
import {useDayPlannerStore} from '@/stores/dayPlanner/dayPlannerStore.ts';
import type {PlannerTaskRequest} from '@/dtos/request/activityPlanning/PlannerTaskRequest.ts';

const form = ref<InstanceType<typeof VForm>>();
const activityFormField = ref<InstanceType<typeof ActivitySelectOrQuickEditFormField>>();

const store = useDayPlannerStore()

const start = ref<Time>(new Time(0, 0))
const end = ref<Time>(new Time(0, 0))

const isEdit = computed(() => store.editedId !== undefined)
const allowedStep = (m: number) => m % 10 === 0

watch(() => store.dialog, (value) => {
	if (value) {
		// Initialize start and end Time objects from the store's editing event
		if (store.editingEvent.start) {
			start.value = new Time(store.editingEvent.start.getHours(), store.editingEvent.start.getMinutes())
		} else {
			start.value = new Time(0, 0)
		}

		if (store.editingEvent.end) {
			end.value = new Time(store.editingEvent.end.getHours(), store.editingEvent.end.getMinutes())
		} else {
			end.value = new Time(0, 0)
		}
	}
})

async function save() {
	const isValid = await form.value?.validate()
	if (!isValid) {
		return;
	}

	const activityFormFieldResult = await activityFormField.value?.execAndReturnStatus();
	if (!activityFormFieldResult) {
		return;
	}

	store.editingEvent.activityId = activityFormFieldResult.activityId
	const startTimestamp = new Date(store.viewedDate)
	startTimestamp.setHours(start.value.hours, start.value.minutes, 0, 0)
	const endTimestamp = new Date(store.viewedDate)
	if (end.value.getInMinutes - start.value.getInMinutes < 0) {
		endTimestamp.setDate(endTimestamp.getDate() + 1)
	}
	endTimestamp.setHours(end.value.hours, end.value.minutes, 0, 0)

	store.editingEvent.startTime = startTimestamp
	store.editingEvent.end = endTimestamp
	if (store.editedId) {
		emit('edit', store.editedId, store.editingEvent)
	} else {
		emit('create', store.editingEvent)
	}

	store.dialog = false
}

const emit = defineEmits<{
	(e: 'edit', id: number, event: PlannerTaskRequest): void
	(e: 'create', event: PlannerTaskRequest): void
}>()
</script>