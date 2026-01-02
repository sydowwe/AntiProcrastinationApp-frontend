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

			<VCol cols="12">
				<VIdSelect
					:label="$t('toDoList.urgency')"
					v-model="store.editingEvent.priorityId"
					:clearable="false"
					:items="priorityOptions"
					required
					:rules="[requiredRule]"
				></VIdSelect>
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

			<VCol cols="12" sm="6">
				<VSwitch
					label="Is optional"
					color="primary"
					v-model="store.editingEvent.isOptional"
					hideDetails
				/>
			</VCol>

			<VCol cols="12" sm="6">
				<VTextField
					v-model="store.editingEvent.location"
					label="Location"
					prependIcon="map-marker"
					clearable
				/>
			</VCol>

			<VCol cols="12">
				<VTextarea v-model="store.editingEvent.notes" label="Notes" rows="3" autoGrow></VTextarea>
			</VCol>
		</VRow>
	</VForm>
</MyDialog>
</template>

<script setup lang="ts">
import {computed, onMounted, ref, watch} from 'vue'
import MyDialog from '@/components/dialogs/MyDialog.vue'
import ActivitySelectOrQuickEditFormField from '@/components/ActivitySelectOrQuickEditFormField.vue';
import type {VForm} from 'vuetify/components';
import TimeRangePicker from '@/components/general/dateTime/TimeRangePicker.vue';
import {Time} from '@/utils/Time.ts';
import {useDayPlannerStore} from '@/stores/dayPlanner/dayPlannerStore.ts';
import type {PlannerTaskRequest} from '@/dtos/request/activityPlanning/PlannerTaskRequest.ts';
import {TaskPriority} from '@/dtos/response/activityPlanning/TaskPriority.ts';
import {useGeneralRules} from '@/composables/rules/RulesComposition.ts';
import {useTaskUrgencyCrud} from '@/composables/ConcretesCrudComposable.ts';

const {fetchAll} = useTaskUrgencyCrud()
const {requiredRule} = useGeneralRules()
const form = ref<InstanceType<typeof VForm>>();
const activityFormField = ref<InstanceType<typeof ActivitySelectOrQuickEditFormField>>();

const store = useDayPlannerStore()

const start = ref<Time>(new Time(0, 0))
const end = ref<Time>(new Time(0, 0))
const priorityOptions = ref([] as TaskPriority[]);

const isEdit = computed(() => store.editedId !== undefined)
const allowedStep = (m: number) => m % 10 === 0

onMounted(async function() {
	priorityOptions.value = await fetchAll();
	setDefaultUrgency();
})

function setDefaultUrgency() {
	if (!store.editingEvent.priorityId) {
		store.editingEvent.priorityId = priorityOptions.value.find((item) => item.priority === 1)?.id ?? null;
	}
}

watch(() => store.dialog, (value) => {
	if (value) {
		// Initialize start and end Time objects from the store's editing event
		if (store.editingEvent.startTime) {
			start.value = new Time(store.editingEvent.startTime.hours, store.editingEvent.startTime.minutes)
		} else {
			start.value = new Time(0, 0)
		}

		if (store.editingEvent.endTime) {
			end.value = new Time(store.editingEvent.endTime.hours, store.editingEvent.endTime.minutes)
		} else {
			end.value = new Time(0, 0)
		}

		// Set default priority if not editing
		if (!isEdit.value) {
			setDefaultUrgency()
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

	// Set the Time objects
	store.editingEvent.startTime = start.value
	store.editingEvent.endTime = end.value

	// Set the date (handle date change if time wraps past midnight)
	const viewedDate = store.viewedDate instanceof Date ? store.viewedDate : new Date(store.viewedDate)
	store.editingEvent.date = new Date(viewedDate)

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