<!-- PlannerSelectionActions.vue -->
<template>
	<VMenu
		v-if="!store.isTemplateInPreview"
		closeOnContentClick
	>
		<template #activator="{ props: menuProps }">
			<VBtn
				v-bind="menuProps"
				color="primary"
			>
				{{ $t('planner.actions.changeStatus') }}
			</VBtn>
		</template>
		<VCard>
			<VList density="compact">
				<VListItem
					v-for="option in statusOptions"
					:key="option.value"
					:prependIcon="getPlannerTaskStatusIcon(option.value)"
					:title="option.title"
					color="secondaryOutline"
					@click="emit('changeStatus', option.value)"
				/>
			</VList>
		</VCard>
	</VMenu>
	<VBtn
		v-if="!store.isTemplateInPreview"
		color="secondary"
		@click="emit('reschedule')"
	>
		{{ $t('planner.actions.reschedule') }}
	</VBtn>
	<VBtn
		v-if="store.selectedTaskIds.size === 1 && !store.isTemplateInPreview"
		color="primary"
		@click="emit('logTime')"
	>
		{{ $t('general.logTime') }}
	</VBtn>
	<VBtn
		v-if="store.selectedTaskIds.size === 1 && !store.isTemplateInPreview"
		variant="tonal"
		color="secondaryOutline"
		@click="emit('split')"
	>
		{{ $t('planner.actions.split') }}
	</VBtn>
</template>

<script setup lang="ts">
	import { useDayPlannerStore } from '@/core/dayPlanner/store/dayPlannerStore.ts'
	import {
		getPlannerTaskStatusIcon,
		type PlannerTaskStatus,
		usePlannerTaskStatusOptions,
	} from '@/core/dayPlanner/dto/enum/PlannerTaskStatus.ts'

	const emit = defineEmits<{
		changeStatus: [status: PlannerTaskStatus]
		reschedule: []
		logTime: []
		split: []
	}>()

	const store = useDayPlannerStore()
	const statusOptions = usePlannerTaskStatusOptions()
</script>
