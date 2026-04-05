<template>
	<div class="steps-list">
		<span class="text-caption text-medium-emphasis">
			{{ $t('toDoList.stepsProgress', { done: doneCnt, total: steps.length }) }}
		</span>
		<div
			v-for="step in steps"
			:key="step.id"
			class="d-flex align-start ga-2 mt-1"
		>
			<VCheckboxBtn
				:modelValue="step.isDone"
				:disabled
				color="success"
				density="compact"
				class="flex-shrink-0"
				style="margin-top: -2px"
				@click.stop="toggle(step)"
			/>
			<div class="d-flex flex-column">
				<span
					class="text-body-2"
					:class="step.isDone ? 'text-decoration-line-through text-medium-emphasis' : 'text-white'"
				>
					{{ step.name }}
				</span>
				<span
					v-if="step.note"
					class="text-caption text-medium-emphasis"
				>
					{{ step.note }}
				</span>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { computed } from 'vue'
	import { ToDoListKind } from '@/dtos/enum/ToDoListKind.ts'
	import type { TodoListItemStepEntity } from '@/dtos/response/todoList/TodoListItemStepEntity.ts'
	import { useTodoListItemStepApi } from '@/api/todoList/todoListItemStepApi.ts'
	import { useRoutineTodoListItemStepApi } from '@/api/routineTodoList/routineTodoListItemStepApi.ts'

	const { steps, itemId, kind, disabled = false } = defineProps<{
		steps: TodoListItemStepEntity[]
		itemId: number
		kind: ToDoListKind
		disabled?: boolean
	}>()

	const emit = defineEmits<{
		stepToggled: [stepId: number, allDone: boolean, steps: TodoListItemStepEntity[]]
	}>()

	const { toggleStep: toggleNormal } = useTodoListItemStepApi()
	const { toggleStep: toggleRoutine } = useRoutineTodoListItemStepApi()

	const doneCnt = computed(() => steps.filter(s => s.isDone).length)

	async function toggle(step: TodoListItemStepEntity) {
		if (disabled) return
		if (kind === ToDoListKind.ROUTINE) {
			await toggleRoutine(itemId, step.id)
		} else {
			await toggleNormal(itemId, step.id)
		}
		const updated = steps.map(s => s.id === step.id ? { ...s, isDone: !s.isDone } : s)
		const allDone = updated.every(s => s.isDone)
		emit('stepToggled', step.id, allDone, updated as TodoListItemStepEntity[])
	}
</script>
