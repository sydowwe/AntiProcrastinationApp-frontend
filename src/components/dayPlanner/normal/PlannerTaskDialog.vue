<template>
<BasePlannerTaskDialog
	:title="!isEdit ? 'Add New Task' : 'Edit Task'"
	:store
	@edit="(taskId, task) => emit('edit', taskId, task as PlannerTaskRequest)"
	@create="emit('create', $event as PlannerTaskRequest)"
>
	<template #additional-fields="{ data }">
		<VSelect
			v-model="data.status"
			:items="statusOptions"
			itemTitle="title"
			itemValue="value"
			label="Status"
			class="pt-4"
		/>
	</template>
</BasePlannerTaskDialog>
</template>

<script setup lang="ts">
import {computed} from 'vue'
import BasePlannerTaskDialog from '@/components/dayPlanner/BasePlannerTaskDialog.vue';
import {useDayPlannerStore} from '@/stores/dayPlanner/dayPlannerStore.ts';
import {PlannerTaskRequest} from '@/dtos/request/activityPlanning/PlannerTaskRequest.ts';
import {PlannerTaskStatus} from '@/dtos/enum/PlannerTaskStatus.ts';
import {getEnumSelectOptions} from '@/composables/general/EnumComposable.ts';

const store = useDayPlannerStore()

const isEdit = computed(() => store.editedId !== undefined)

const statusOptions = getEnumSelectOptions(PlannerTaskStatus, 'planner.status')

const emit = defineEmits<{
	(e: 'edit', id: number, task: PlannerTaskRequest): void
	(e: 'create', task: PlannerTaskRequest): void
}>()
</script>
