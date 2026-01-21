<template>
<BasePlannerTaskDialog
	:title="!isEdit ? 'Add New Template Task' : 'Edit Template Task'"
	:store
	:createEmptyRequest="() => new TemplatePlannerTaskRequest()"
	@edit="(id, task) => emit('edit', id, task as TemplatePlannerTaskRequest)"
	@create="emit('create', $event as TemplatePlannerTaskRequest)"
/>
</template>

<script setup lang="ts">
import {computed} from 'vue'
import BasePlannerTaskDialog from '@/components/dayPlanner/BasePlannerTaskDialog.vue';
import {useTemplateDayPlannerStore} from '@/stores/dayPlanner/templateDayPlannerStore.ts';
import {TemplatePlannerTaskRequest} from '@/dtos/request/activityPlanning/template/TemplatePlannerTaskRequest.ts';

const store = useTemplateDayPlannerStore()

const isEdit = computed(() => store.editedId !== undefined)

const emit = defineEmits<{
	(e: 'edit', id: number, task: TemplatePlannerTaskRequest): void
	(e: 'create', task: TemplatePlannerTaskRequest): void
}>()
</script>
