<template>
	<VCard
		class="suggestion-panel h-100 d-flex flex-column pa-4"
		color="surface"
		elevation="8"
	>
		<div class="d-flex align-center justify-space-between mb-3">
			<div class="d-flex align-center ga-2">
				<VIcon
					icon="rotate"
					size="16"
					class="text-medium-emphasis"
				/>
				<h3 class="text-subtitle-1 font-weight-bold ma-0">Suggestions</h3>
				<VChip
					v-if="suggestions.length"
					size="small"
					color="primaryOutline"
					variant="tonal"
				>
					{{ suggestions.length }}
				</VChip>
			</div>
		</div>

		<div
			v-if="suggestions.length"
			class="d-flex flex-column ga-2"
		>
			<VCard
				v-for="task in suggestions"
				:key="task.id"
				class="pa-3"
				variant="outlined"
				:color="addedIds.has(task.id) ? 'success' : undefined"
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
						v-if="!addedIds.has(task.id)"
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

		<div
			v-else
			class="d-flex flex-column align-center justify-center flex-fill text-center text-medium-emphasis py-6"
		>
			<VIcon
				icon="rotate"
				size="32"
				class="mb-2 opacity-40"
			/>
			<span class="text-body-2">No repeating tasks match today</span>
		</div>
	</VCard>
</template>

<script setup lang="ts">
	import type { RepeatingPlannerTask } from '@/dtos/response/activityPlanning/RepeatingPlannerTask.ts'

	const { suggestions, addedIds } = defineProps<{
		suggestions: RepeatingPlannerTask[]
		addedIds: Set<number>
	}>()

	const emit = defineEmits<{
		add: [task: RepeatingPlannerTask]
	}>()
</script>

<style scoped>
	.suggestion-panel {
		overflow-y: auto;
	}

	@media (max-width: 1920px) {
		.suggestion-panel {
			width: 260px;
		}
	}

	@media (min-width: 1921px) {
		.suggestion-panel {
			width: 320px;
		}
	}
</style>
