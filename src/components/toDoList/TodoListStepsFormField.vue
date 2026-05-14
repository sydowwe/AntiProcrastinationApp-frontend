<template>
	<div>
		<span class="text-caption text-medium-emphasis">{{ $t('toDoList.steps') }}</span>
		<div
			v-for="(step, i) in model"
			:key="i"
			class="d-flex align-center ga-1 mt-1"
		>
			<div class="d-flex flex-column">
				<VIconBtn
					icon="chevron-up"
					variant="text"
					size="x-small"
					:disabled="i === 0"
					@click="moveStep(i, -1)"
				/>
				<VIconBtn
					icon="chevron-down"
					variant="text"
					size="x-small"
					:disabled="i === model.length - 1"
					@click="moveStep(i, 1)"
				/>
			</div>
			<VTextField
				v-model="step.name"
				density="compact"
				hideDetails
				class="flex-grow-1"
			/>
			<VIconBtn
				icon="trash-can"
				color="error"
				variant="text"
				size="small"
				@click="model.splice(i, 1)"
			/>
		</div>
		<div class="d-flex ga-2 mt-2">
			<VTextField
				v-model="newStepName"
				:label="$t('toDoList.addStep')"
				density="compact"
				hideDetails
				class="flex-grow-1"
				@keyup.enter.stop="addStep"
			/>
			<VIconBtn
				icon="plus"
				variant="tonal"
				color="primaryOutline"
				@click="addStep"
			/>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { ref } from 'vue'
	import { TodoListItemStepRequest } from '@/dtos/request/todoList/TodoListItemStepRequest.ts'

	const model = defineModel<TodoListItemStepRequest[]>({ default: [] })
	const newStepName = ref('')

	function addStep() {
		if (!newStepName.value.trim()) return
		model.value.push(new TodoListItemStepRequest(newStepName.value.trim(), model.value.length + 1))
		newStepName.value = ''
	}

	function moveStep(index: number, direction: -1 | 1) {
		const newIndex = index + direction
		if (newIndex < 0 || newIndex >= model.value.length) return
		const temp = model.value[index]
		model.value[index] = model.value[newIndex]!
		model.value[newIndex] = temp!
	}
</script>
