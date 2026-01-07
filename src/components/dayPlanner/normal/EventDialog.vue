<template>
<MyDialog
	:title="!isEdit ? 'Add New Event' : 'Edit Event'"
	v-model="dialog"
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
					v-model="store.editingTask.priorityId"
					:clearable="false"
					:items="priorityOptions"
					required
					:rules="[requiredRule]"
				></VIdSelect>
			</VCol>

			<VCol cols="12" sm="6" class="d-flex align-center">
				<!--				<VMenu :closeOnContentClick="false">-->
				<!--					<template v-slot:activator="{ store }">-->
				<!--						<VBtn-->
				<!--							class="pr-3"-->
				<!--							v-bind="store"-->
				<!--							variant="outlined"-->
				<!--							prependIcon="palette"-->
				<!--							:readonly="isEdit"-->
				<!--						>-->
				<!--							Color-->
				<!--							<VSheet-->
				<!--								:color="store.editingTask.color"-->
				<!--								class="ml-2"-->
				<!--								rounded="xl"-->
				<!--								width="20"-->
				<!--								height="20"-->
				<!--							/>-->
				<!--						</VBtn>-->
				<!--					</template>-->
				<!--					<template v-slot:default>-->
				<!--						<VColorPicker v-model="store.editingTask"/>-->
				<!--					</template>-->
				<!--				</VMenu>-->
			</VCol>

			<VCol cols="12" sm="6">
				<VSwitch
					label="Is background"
					color="primary"
					v-model="store.editingTask.isBackground"
					hideDetails
				/>
			</VCol>

			<VCol cols="12" sm="6">
				<VSwitch
					label="Is optional"
					color="primary"
					v-model="store.editingTask.isOptional"
					hideDetails
				/>
			</VCol>

			<VCol cols="12" sm="6">
				<VTextField
					v-model="store.editingTask.location"
					label="Location"
					prependIcon="map-marker"
					clearable
				/>
			</VCol>

			<VCol cols="12">
				<VTextarea v-model="store.editingTask.notes" label="Notes" rows="3" autoGrow></VTextarea>
			</VCol>
		</VRow>
	</VForm>
</MyDialog>
</template>

<script setup lang="ts">
import {computed, nextTick, onMounted, ref, watch} from 'vue'
import MyDialog from '@/components/dialogs/MyDialog.vue'
import ActivitySelectOrQuickEditFormField from '@/components/ActivitySelectOrQuickEditFormField.vue';
import type {VForm} from 'vuetify/components';
import TimeRangePicker from '@/components/general/dateTime/TimeRangePicker.vue';
import {Time} from '@/utils/Time.ts';
import {PlannerTaskRequest} from '@/dtos/request/activityPlanning/PlannerTaskRequest.ts';
import {TaskPriority} from '@/dtos/response/activityPlanning/TaskPriority.ts';
import {useGeneralRules} from '@/composables/rules/RulesComposition.ts';
import {useTaskUrgencyCrud} from '@/composables/ConcretesCrudComposable.ts';
import {useDayPlannerStore} from '@/stores/dayPlanner/dayPlannerStore.ts';
import {storeToRefs} from 'pinia';

const {fetchAll} = useTaskUrgencyCrud()
const {requiredRule} = useGeneralRules()
const form = ref<InstanceType<typeof VForm>>();
const activityFormField = ref<InstanceType<typeof ActivitySelectOrQuickEditFormField>>();

const store = useDayPlannerStore()
const {dialog} = storeToRefs(store)

const start = ref<Time>(new Time(0, 0))
const end = ref<Time>(new Time(0, 0))
const priorityOptions = ref([] as TaskPriority[]);

const isEdit = computed(() => store.editedId !== undefined)
const allowedStep = (m: number) => m % 10 === 0

const data = ref<PlannerTaskRequest>(new PlannerTaskRequest())

onMounted(async function () {
	priorityOptions.value = await fetchAll();
	setDefaultUrgency();
})

function setDefaultUrgency() {
	if (!store.editingTask.priorityId) {
		store.editingTask.priorityId = priorityOptions.value.find((item) => item.priority === 1)?.id ?? null;
	}
}

watch(dialog, async (value) => {
	if (value) {
		await nextTick()
		if (store.editingTask) {
			data.value = {...store.editingTask}
			activityFormField.value?.setDefaultActivityId(store.editingTask.activityId)
		} else {
			// New mode: reset to defaults
			data.value = new PlannerTaskRequest()
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

	store.editingTask.activityId = activityFormFieldResult.activityId

	// Set the Time objects
	store.editingTask.startTime = start.value
	store.editingTask.endTime = end.value

	// Set the date (handle date change if time wraps past midnight)
	const viewedDate = store.viewedDate instanceof Date ? store.viewedDate : new Date(store.viewedDate)
	store.editingTask.date = new Date(viewedDate)

	if (store.editedId) {
		emit('edit', store.editedId, store.editingTask)
	} else {
		emit('create', store.editingTask)
	}

	dialog.value = false
}

const emit = defineEmits<{
	(e: 'edit', id: number, event: PlannerTaskRequest): void
	(e: 'create', event: PlannerTaskRequest): void
}>()
</script>