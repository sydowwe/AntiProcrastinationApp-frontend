import { computed, onMounted, onUnmounted, ref, type Ref } from 'vue'

/**
 * Which planner grid the keyboard belongs to.
 *
 * `usePlannerKeyboard` binds its handler to `document`, once per planner instance. Every route but
 * one mounts exactly one planner, so that was invisible; `/day-planner/templates/split` mounts two
 * side by side, and without a notion of "which planner is the user driving" a single ArrowUp moves
 * the selection in both templates, `n` opens two create dialogs and Ctrl+Z pops the shared undo
 * stack twice.
 *
 * The active instance is derived from the pointer (and from focus, so keyboard-only navigation can
 * reach a panel too). A lone planner is always active, which is what keeps the standalone day and
 * template routes behaving exactly as they did before: their keys work from the moment the grid
 * loads, without the user having to point at the grid first.
 *
 * The registry below is deliberately free of DOM and lifecycle so it can be exercised on its own —
 * see `usePlannerKeyboardScope.test.ts`. `usePlannerKeyboardScope` is the thin Vue wrapper.
 */
const mountedInstanceIds = ref<number[]>([])
const activeInstanceId = ref<number | null>(null)
let nextInstanceId = 1

export function createPlannerInstanceId(): number {
	return nextInstanceId++
}

export function registerPlannerInstance(id: number): void {
	if (!mountedInstanceIds.value.includes(id)) mountedInstanceIds.value.push(id)
}

export function deregisterPlannerInstance(id: number): void {
	mountedInstanceIds.value = mountedInstanceIds.value.filter(other => other !== id)
	// Hand the keyboard to whatever is left rather than to nothing, so the surviving panel of a
	// split view keeps responding without the user having to point at it again.
	if (activeInstanceId.value === id) activeInstanceId.value = mountedInstanceIds.value[0] ?? null
}

export function activatePlannerInstance(id: number): void {
	activeInstanceId.value = id
}

/**
 * Whether another planner is on screen. Excludes the given instance by id rather than by count, so
 * it answers the same thing before and after that instance has deregistered — callers in
 * `onUnmounted` do not have to care which hook ran first.
 */
export function hasOtherPlannerInstances(id: number): boolean {
	return mountedInstanceIds.value.some(other => other !== id)
}

export function isPlannerInstanceActive(id: number): boolean {
	return !hasOtherPlannerInstances(id) || activeInstanceId.value === id
}

/** How many planner grids are mounted right now — one everywhere except the split view. */
export function plannerInstancesMounted(): number {
	return mountedInstanceIds.value.length
}

export function usePlannerKeyboardScope(rootRef: Ref<HTMLElement | undefined>) {
	const id = createPlannerInstanceId()
	let boundElement: HTMLElement | null = null

	function activate(): void {
		activatePlannerInstance(id)
	}

	const isActive = computed(() => isPlannerInstanceActive(id))

	onMounted(() => {
		registerPlannerInstance(id)

		boundElement = rootRef.value ?? null
		if (!boundElement) return
		boundElement.addEventListener('pointerenter', activate)
		// Capture, because the task blocks stop propagation of their own pointerdown.
		boundElement.addEventListener('pointerdown', activate, true)
		boundElement.addEventListener('focusin', activate)
	})

	onUnmounted(() => {
		if (boundElement) {
			boundElement.removeEventListener('pointerenter', activate)
			boundElement.removeEventListener('pointerdown', activate, true)
			boundElement.removeEventListener('focusin', activate)
			boundElement = null
		}
		deregisterPlannerInstance(id)
	})

	return { isActive, hasOtherInstances: () => hasOtherPlannerInstances(id), activate }
}
