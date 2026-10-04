<template>
	<div>
		<span class="text-caption text-medium-emphasis">{{ $t('toDoList.steps') }}</span>
		<div
			v-for="(step, i) in model"
			:key="i"
			class="mt-1"
		>
			<div class="d-flex align-center ga-1">
				<div class="d-flex flex-column">
					<VIconBtn
						icon="chevron-up"
						variant="text"
						size="x-small"
						:disabled="i === 0"
						:title="$t('toDoList.stepMoveUp', { position: i + 1 })"
						:aria-label="$t('toDoList.stepMoveUp', { position: i + 1 })"
						@click="moveStep(i, -1)"
					/>
					<VIconBtn
						icon="chevron-down"
						variant="text"
						size="x-small"
						:disabled="i === model.length - 1"
						:title="$t('toDoList.stepMoveDown', { position: i + 1 })"
						:aria-label="$t('toDoList.stepMoveDown', { position: i + 1 })"
						@click="moveStep(i, 1)"
					/>
				</div>
				<VTextField
					v-model="step.name"
					density="compact"
					hideDetails
					class="flex-grow-1"
				/>
				<!-- `note === null` is "no note"; the toggle opens the field with an empty string, and
					clearing the field (or toggling again) drops the note. -->
				<VIconBtn
					icon="note-sticky"
					variant="text"
					size="small"
					:color="step.note !== null ? 'primaryOutline' : undefined"
					:title="$t('toDoList.stepNote', { position: i + 1 })"
					:aria-label="$t('toDoList.stepNote', { position: i + 1 })"
					:aria-pressed="step.note !== null"
					@click="toggleNote(step)"
				/>
				<!-- Named by position: a step's name can be empty, and four identical "Delete" names would
					pass an aria-label sweep while still being unusable. -->
				<VIconBtn
					icon="trash-can"
					color="error"
					variant="text"
					size="small"
					:title="$t('toDoList.stepDelete', { position: i + 1 })"
					:aria-label="$t('toDoList.stepDelete', { position: i + 1 })"
					@click="model.splice(i, 1)"
				/>
			</div>
			<VTextField
				v-if="step.note !== null"
				v-model="step.note"
				:label="$t('toDoList.stepNote', { position: i + 1 })"
				:maxlength="STEP_NOTE_MAX_LENGTH"
				density="compact"
				hideDetails
				autofocus
				class="mt-1"
				style="margin-left: 36px; margin-right: 76px"
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
				:title="$t('toDoList.addStep')"
				:aria-label="$t('toDoList.addStep')"
				@click="addStep"
			/>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { ref } from 'vue'
	import { TodoListItemStepRequest } from '@/core/todoList/dto/request/TodoListItemStepRequest.ts'

	const model = defineModel<TodoListItemStepRequest[]>({ default: [] })
	const newStepName = ref('')

	// The server's limit (`StepRequest` validators). A native `maxlength` rather than a rule: the
	// framework has no length rule, and a cap cannot be failed.
	const STEP_NOTE_MAX_LENGTH = 1000

	function addStep() {
		if (!newStepName.value.trim()) return
		model.value.push(new TodoListItemStepRequest(newStepName.value.trim(), model.value.length + 1))
		newStepName.value = ''
	}

	function toggleNote(step: TodoListItemStepRequest) {
		step.note = step.note === null ? '' : null
	}

	function moveStep(index: number, direction: -1 | 1) {
		const newIndex = index + direction
		if (newIndex < 0 || newIndex >= model.value.length) return
		const temp = model.value[index]
		model.value[index] = model.value[newIndex]!
		model.value[newIndex] = temp!
	}
</script>
