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
				<TimeRangePicker v-model:start="data.startTime" v-model:end="data.endTime"></TimeRangePicker>
			</VCol>

			<VCol cols="12">
				<VIdSelect
					:label="$t('toDoList.urgency')"
					v-model="data.importanceId"
					:clearable="false"
					:items="importanceOptions"
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
					v-model="data.isBackground"
					hideDetails
				/>
			</VCol>

			<VCol cols="12" sm="6">
				<VSwitch
					label="Is optional"
					color="primary"
					v-model="data.isOptional"
					hideDetails
				/>
			</VCol>

			<VCol cols="12" sm="6">
				<VTextField
					v-model="data.location"
					label="Location"
					prependIcon="map-marker"
					clearable
				/>
			</VCol>

			<VCol cols="12">
				<VTextarea v-model="data.notes" label="Notes" rows="3" autoGrow></VTextarea>
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
import {PlannerTaskRequest} from '@/dtos/request/activityPlanning/PlannerTaskRequest.ts';
import {useGeneralRules} from '@/composables/rules/RulesComposition.ts';
import {useTaskImportanceCrud} from '@/composables/ConcretesCrudComposable.ts';
import {useDayPlannerStore} from '@/stores/dayPlanner/dayPlannerStore.ts';
import {storeToRefs} from 'pinia';
import type {TaskImportance} from '@/dtos/response/activityPlanning/TaskImportance.ts';

const {fetchAll} = useTaskImportanceCrud()
const {requiredRule} = useGeneralRules()
const form = ref<InstanceType<typeof VForm>>();
const activityFormField = ref<InstanceType<typeof ActivitySelectOrQuickEditFormField>>();

const store = useDayPlannerStore()
const {dialog} = storeToRefs(store)

const importanceOptions = ref([] as TaskImportance[]);

const isEdit = computed(() => store.editedId !== undefined)
const allowedStep = (m: number) => m % 10 === 0

const data = ref<PlannerTaskRequest>(new PlannerTaskRequest())

onMounted(async function () {
	importanceOptions.value = await fetchAll();
	setDefaultUrgency();
})

function setDefaultUrgency() {
	if (!store.editingTask.importanceId) {
		store.editingTask.importanceId = importanceOptions.value.find((item) => item.importance === 1)?.id ?? null;
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

	data.value.activityId = activityFormFieldResult.activityId

	if (store.editedId) {
		emit('edit', store.editedId, data.value)
	} else {
		emit('create', data.value)
	}

	store.dialog = false
}

const emit = defineEmits<{
	(e: 'edit', id: number, event: PlannerTaskRequest): void
	(e: 'create', event: PlannerTaskRequest): void
}>()
</script>