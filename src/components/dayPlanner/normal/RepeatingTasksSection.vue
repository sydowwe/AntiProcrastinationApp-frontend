<!-- RepeatingTasksSection.vue -->
<template>
	<div>
		<div class="d-flex align-center ga-2 mb-3">
			<VIcon
				icon="rotate"
				size="16"
				class="text-medium-emphasis"
			/>
			<span class="section-label">Suggestions</span>
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
				:key="task.key"
				class="pa-3"
				variant="outlined"
				:color="addedIds?.has(task.key) ? 'success' : undefined"
				:style="task.isAutomatic ? 'opacity: 0.75' : undefined"
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
						<div class="d-flex align-center ga-1 flex-wrap">
							<span class="text-body-2 font-weight-medium text-truncate">
								{{ task.activity.name }}
							</span>
							<VChip
								v-if="task.sourceType === 'PlannedPattern'"
								size="x-small"
								color="secondary"
								variant="tonal"
								class="flex-shrink-0"
							>
								Auto • Planned
							</VChip>
							<VChip
								v-else-if="task.sourceType === 'HistoryPattern'"
								size="x-small"
								color="primaryOutline"
								variant="tonal"
								class="flex-shrink-0"
							>
								Auto • Tracked
							</VChip>
						</div>
						<div class="text-caption text-medium-emphasis">
							{{ task.startTime.getString() }} – {{ task.endTime.getString() }}
							<span
								v-if="task.occurrenceCount !== null"
								class="ml-1"
							>
								· seen {{ task.occurrenceCount }}×
							</span>
						</div>
						<VChip
							v-if="task.importance"
							:color="task.importance.color"
							size="x-small"
							variant="tonal"
							class="mt-1"
						>
							<VIcon
								v-if="task.importance.icon"
								:icon="task.importance.icon"
								size="10"
								class="mr-1"
							/>
							{{ task.importance.text }}
						</VChip>
					</div>
					<VIconBtn
						v-if="!addedIds?.has(task.key)"
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
	import type { SuggestionResponse } from '@/dtos/response/activityPlanning/SuggestionResponse.ts'

	const { tasks, addedIds } = defineProps<{
		tasks: SuggestionResponse[]
		addedIds?: Set<string>
	}>()

	const emit = defineEmits<{
		add: [task: SuggestionResponse]
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
