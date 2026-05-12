<template>
	<div class="steps-list w-100 px-3">
		<div class="d-flex align-center ga-2">
			<VIconBtn
				:icon="collapsed ? 'chevron-right' : 'chevron-down'"
				size="28"
				variant="text"
				color="white"
				class="flex-shrink-0"
				style="opacity: 0.6"
				@click.stop="collapsed = !collapsed"
			/>
			<span class="text-no-wrap text-caption text-medium-emphasis">
				{{ $t('toDoList.stepsProgress', { done: doneCnt, total: steps.length }) }}
			</span>
			<VProgressLinear
				:modelValue="(doneCnt / steps.length) * 100"
				color="success"
				rounded
				:height="4"
				style="opacity: 0.6"
			/>
			<span class="text-caption text-medium-emphasis">{{ Math.round((doneCnt / steps.length) * 100) }}%</span>
		</div>
		<div
			v-if="!collapsed"
			class="steps-items mt-1 ml-9 pl-2"
			@click.stop
		>
			<div
				v-for="step in steps"
				:key="step.id"
				class="d-flex align-start ga-2 mt-1"
				@click.stop="toggle(step)"
			>
				<VCheckboxBtn
					:modelValue="step.isDone"
					:disabled
					color="grey-lighten-1"
					density="compact"
					class="text-medium-emphasis flex-grow-0"
					style="width: 20px; height: 20px; margin-right: 2px; opacity: 0.6"
					@click.prevent
				/>
				<div class="flex-fill d-flex flex-column">
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
	</div>
</template>

<script setup lang="ts">
	import { computed, ref, watch } from 'vue'
	import { useI18n } from 'vue-i18n'
	import { ToDoListKind } from '@/dtos/enum/ToDoListKind.ts'
	import type { TodoListItemStepEntity } from '@/dtos/response/todoList/TodoListItemStepEntity.ts'
	import { useTodoListItemStepApi } from '@/api/todoList/todoListItemStepApi.ts'
	import { useRoutineTodoListItemStepApi } from '@/api/routineTodoList/routineTodoListItemStepApi.ts'
	import { useSnackbar } from '@/composables/general/SnackbarComposable.ts'

	const {
		steps,
		itemId,
		kind,
		disabled = false,
		isDone = false,
	} = defineProps<{
		steps: TodoListItemStepEntity[]
		itemId: number
		kind: ToDoListKind
		disabled?: boolean
		isDone?: boolean
	}>()

	const emit = defineEmits<{
		stepToggled: []
	}>()

	const { toggleStep: toggleNormal } = useTodoListItemStepApi()
	const { toggleStep: toggleRoutine } = useRoutineTodoListItemStepApi()
	const { showErrorSnackbar } = useSnackbar()
	const i18n = useI18n()

	const doneCnt = computed(() => steps.filter(s => s.isDone).length)
	const collapsed = ref(steps.every(s => s.isDone))

	watch(
		() => steps.every(s => s.isDone),
		(allDone: boolean) => {
			collapsed.value = allDone
		},
	)

	watch(
		() => isDone,
		(val: boolean) => {
			if (!val) collapsed.value = false
		},
	)

	async function toggle(step: TodoListItemStepEntity) {
		if (disabled) return
		try {
			if (kind === ToDoListKind.ROUTINE) {
				await toggleRoutine(itemId, step.id)
			} else {
				await toggleNormal(itemId, step.id)
			}
			emit('stepToggled')
		} catch {
			showErrorSnackbar(i18n.t('general.error'))
		}
	}
</script>

<style scoped>
	.steps-items {
		border-left: 2px solid rgba(255, 255, 255, 0.12);
		padding-bottom: 2px;
	}
</style>
