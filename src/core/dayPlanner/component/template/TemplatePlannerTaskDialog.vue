<template>
	<BasePlannerTaskDialog
		ref="baseDialog"
		:title="
			store.isDuplicating
				? $t('planner.misc.duplicateTemplateTaskTitle')
				: !isEdit
					? $t('planner.misc.addNewTemplateTaskTitle')
					: $t('planner.misc.editTemplateTaskTitle')
		"
		:store
		:createEmptyRequest="() => TemplatePlannerTaskRequest.createEmpty()"
		:hideActivitySelector="!isEdit && pickerMode !== 'all'"
		@edit="(id, task) => emit('edit', id, task as TemplatePlannerTaskRequest)"
		@create="emit('create', $event as TemplatePlannerTaskRequest)"
	>
		<template #before-activity="{ data }">
			<PlannerActivitySourcePicker
				v-if="!isEdit"
				v-model:pickerMode="pickerMode"
				showRoutine
				class="mb-3"
				@selected="
					(actId: number, _todoItemId: number | undefined, suggestedTime: Time | undefined) =>
						onPickerSelected(actId, suggestedTime, data as TemplatePlannerTaskRequest)
				"
			/>
		</template>
	</BasePlannerTaskDialog>
</template>

<script setup lang="ts">
	import { computed, inject, nextTick, ref, watch } from 'vue'
	import BasePlannerTaskDialog from '@/core/dayPlanner/component/BasePlannerTaskDialog.vue'
	import PlannerActivitySourcePicker from '@/core/dayPlanner/component/PlannerActivitySourcePicker.vue'
	import { PLANNER_STORE_KEY } from '@/core/dayPlanner/store/IBaseDayPlannerStore.ts'
	import type { PlannerTaskDialogApi } from '@/core/dayPlanner/component/DayPlannerTypes.ts'
	import { TemplatePlannerTaskRequest } from '@/core/dayPlanner/dto/request/template/TemplatePlannerTaskRequest.ts'
	import { Time } from '@/_common/dto/dto/Time.ts'
	import { SELECTED_ROUTINE_ITEM_KEY } from '@/core/dayPlanner/composable/useRoutinePlacement.ts'

	const emit = defineEmits<{
		(e: 'edit', id: number, task: TemplatePlannerTaskRequest): void
		(e: 'create', task: TemplatePlannerTaskRequest): void
	}>()

	// The injected store, not `useTemplateDayPlannerStore()`: the split view mounts this dialog twice,
	// and hardcoding the main store made both copies mirror it — one `n` in the left panel opened two
	// identical dialogs, while the right panel's own store could never surface one at all.
	const store = inject(PLANNER_STORE_KEY)!
	const baseDialog = ref<PlannerTaskDialogApi>()
	const pickerMode = ref<'all' | 'routine'>('all')
	const selectedRoutineItem = inject(SELECTED_ROUTINE_ITEM_KEY)

	const isEdit = computed(() => store.editedId !== undefined)

	function onPickerSelected(activityId: number, suggestedTime: Time | undefined, data: TemplatePlannerTaskRequest) {
		baseDialog.value?.prefillActivity(activityId)
		if (suggestedTime !== undefined) {
			data.endTime = Time.fromMinutes(data.startTime.getInMinutes + suggestedTime.getInMinutes)
		}
	}

	watch(pickerMode, newMode => {
		if (newMode === 'all') {
			baseDialog.value?.resetActivityField()
		}
	})

	watch(
		() => store.dialog,
		async value => {
			if (value) {
				// Two nextTicks: first waits for BasePlannerTaskDialog's own nextTick init,
				// second ensures its data is fully set before we prefill.
				await nextTick()
				await nextTick()
				if (store.editedId === undefined && selectedRoutineItem?.value) {
					baseDialog.value?.prefillActivity(selectedRoutineItem.value.activity.id)
					if (selectedRoutineItem.value.suggestedTime && !store.creationPreview) {
						baseDialog.value?.applySuggestedTime(selectedRoutineItem.value.suggestedTime.getInMinutes)
					}
				}
			} else {
				pickerMode.value = 'all'
			}
		},
	)
</script>
