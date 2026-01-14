<template>
<BasePlannerTaskDialog
	:title="!isEdit ? 'Add New Task' : 'Edit Task'"
	:store
	@edit="(taskId, task) => emit('edit', taskId, task as PlannerTaskRequest)"
	@create="emit('create', $event as PlannerTaskRequest)"
>
	<template #additional-fields="{ data }">
		<VTextField
			v-model="data.location"
			label="Location"
			prependIcon="map-marker"
			clearable
			hideDetails
			class="pb-2"
		/>
	</template>
</BasePlannerTaskDialog>
</template>

<script setup lang="ts">
import {computed} from 'vue'
import BasePlannerTaskDialog from '@/components/dayPlanner/BasePlannerTaskDialog.vue';
import {useDayPlannerStore} from '@/stores/dayPlanner/dayPlannerStore.ts';
import type {PlannerTaskRequest} from '@/dtos/request/activityPlanning/PlannerTaskRequest.ts';

const store = useDayPlannerStore()

const isEdit = computed(() => store.editedId !== undefined)

const emit = defineEmits<{
	(e: 'edit', id: number, task: PlannerTaskRequest): void
	(e: 'create', task: PlannerTaskRequest): void
}>()
</script>
