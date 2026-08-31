<template>
	<VRow class="pb-2 flex-grow-0">
		<VCol
			cols="6"
			lg="4"
		>
			<VSwitch
				v-model="hideDone"
				class="ml-2"
				:label="$t('toDoList.hideDone')"
				density="compact"
				hideDetails
				color="primary-accent"
				:disabled="isInChangeOrderMode"
			/>
		</VCol>
		<VCol
			cols="12"
			lg="4"
			class="pb-0 pb-md-3 d-flex flex-column align-center justify-center"
		>
			<VCardTitle class="pa-0 d-flex align-center ga-2">
				<VIcon
					v-if="listEntity?.icon"
					:icon="listEntity.icon"
					color="primary"
				/>
				<span>{{ listEntity?.name }}</span>
			</VCardTitle>
			<span
				v-if="calibration"
				class="text-caption text-medium-emphasis"
			>
				{{ $t('toDoList.calibration.header', { ratio: calibration.ratio.toFixed(1) }) }}
			</span>
			<div
				v-if="totalProgress.total > 0"
				class="d-flex align-center ga-2 w-100"
				style="max-width: 160px"
			>
				<span class="text-caption text-medium-emphasis text-no-wrap">
					{{ $t('toDoList.progressCount', { done: totalProgress.done, total: totalProgress.total }) }}
				</span>
				<VProgressLinear
					:modelValue="(totalProgress.done / totalProgress.total) * 100"
					color="primary"
					height="3"
					rounded
				/>
			</div>
		</VCol>
		<VCol
			cols="6"
			lg="4"
			class="d-flex align-center justify-end"
		>
			<VBtn
				variant="tonal"
				density="comfortable"
				color="primaryOutline"
				prependIcon="arrow-up-wide-short"
				:disabled="isInChangeOrderMode"
				@click="emit('toggleSortMode')"
			>
				{{
					sortMode === 'priority'
						? $t('toDoList.sortByPriority')
						: sortMode === 'dueDate'
							? $t('toDoList.sortByDueDate')
							: $t('toDoList.sortCustom')
				}}
			</VBtn>
		</VCol>
	</VRow>
</template>

<script setup lang="ts">
	import type { SortMode } from '@/core/todoList/composable/useTodoListFilters.ts'
	import type { TodoListEntity } from '@/core/todoList/dto/response/TodoListEntity.ts'

	defineProps<{
		isInChangeOrderMode: boolean
		listEntity: TodoListEntity | null
		calibration: { ratio: number; comparableCount: number } | null
		totalProgress: { done: number; total: number }
		sortMode: SortMode
	}>()

	const emit = defineEmits<{
		toggleSortMode: []
	}>()

	const hideDone = defineModel<boolean>('hideDone', { default: false })
</script>
