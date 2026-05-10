<!-- RepeatingTasksSection.vue -->
<template>
	<div>
		<div class="d-flex align-center ga-2 mb-3">
			<VIcon
				icon="rotate"
				size="16"
				class="text-medium-emphasis"
			/>
			<span class="section-label">Repeating Tasks</span>
			<VChip
				size="x-small"
				color="primaryOutline"
				variant="tonal"
			>
				{{ tasks.length }}
			</VChip>
		</div>
		<div class="d-flex flex-column ga-2">
			<VCard
				v-for="task in tasks"
				:key="task.id"
				class="pa-3"
				variant="outlined"
				:color="addedIds?.has(task.id) ? 'success' : undefined"
				rounded="lg"
			>
				<div class="d-flex align-center ga-2">
					<VSheet
						:color="task.color || task.activity.role?.color || 'primary'"
						width="10"
						height="10"
						rounded="circle"
						class="flex-shrink-0"
					/>
					<div class="flex-fill min-width-0">
						<div class="text-body-2 font-weight-medium text-truncate">
							{{ task.activity.name }}
						</div>
						<div class="text-caption text-medium-emphasis">
							{{ task.startTime.getString() }} – {{ task.endTime.getString() }}
						</div>
					</div>
					<VIconBtn
						v-if="!addedIds?.has(task.id)"
						icon="plus"
						size="small"
						color="primary"
						variant="tonal"
						@click="emit('add', task)"
					/>
					<VIcon
						v-else
						icon="check"
						size="16"
						color="success"
					/>
				</div>
			</VCard>
		</div>
	</div>
</template>

<script setup lang="ts">
	import type { RepeatingPlannerTask } from '@/dtos/response/activityPlanning/RepeatingPlannerTask.ts'

	const { tasks, addedIds } = defineProps<{
		tasks: RepeatingPlannerTask[]
		addedIds?: Set<number>
	}>()

	const emit = defineEmits<{
		add: [task: RepeatingPlannerTask]
	}>()
</script>

<style scoped>
	.section-label {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		color: rgba(var(--v-theme-on-surface), 0.5);
	}
</style>
