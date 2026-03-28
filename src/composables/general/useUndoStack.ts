import {computed, ref} from 'vue'
import {useSnackbar} from '@/composables/general/SnackbarComposable.ts'

interface UndoEntry {
	description: string
	undo: () => Promise<void>
}

const stack = ref<UndoEntry[]>([])
const MAX_UNDO = 10

export function useUndoStack() {
	const {showSuccessSnackbar} = useSnackbar()

	function push(entry: UndoEntry) {
		stack.value.unshift(entry)
		if (stack.value.length > MAX_UNDO) stack.value.length = MAX_UNDO
	}

	async function undo() {
		if (!stack.value.length) return
		const entry = stack.value.shift()!
		await entry.undo()
		showSuccessSnackbar(`${entry.description} undone`)
	}

	function clear() {
		stack.value = []
	}

	const canUndo = computed(() => stack.value.length > 0)
	const stackSize = computed(() => stack.value.length)
	const nextUndoDescription = computed(() => stack.value[0]?.description ?? null)

	return {push, undo, clear, canUndo, stackSize, nextUndoDescription}
}
