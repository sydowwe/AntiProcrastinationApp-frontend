import { afterEach, describe, expect, it } from 'vitest'
import {
	activatePlannerInstance,
	createPlannerInstanceId,
	deregisterPlannerInstance,
	hasOtherPlannerInstances,
	isPlannerInstanceActive,
	plannerInstancesMounted,
	registerPlannerInstance,
} from '@/core/dayPlanner/composable/usePlannerKeyboardScope.ts'

/**
 * The rule that decides whether a `document` keydown belongs to this planner.
 *
 * The split view mounts two planners at once, each with its own `document` listener, so "who has
 * the keyboard" is the whole of the fix — and it is the part that cannot be judged by looking at a
 * single-planner screen, where every version of this logic looks identical.
 */

const registered: number[] = []

function mount(): number {
	const id = createPlannerInstanceId()
	registerPlannerInstance(id)
	registered.push(id)
	return id
}

function unmount(id: number): void {
	deregisterPlannerInstance(id)
	registered.splice(registered.indexOf(id), 1)
}

afterEach(() => {
	for (const id of [...registered]) unmount(id)
})

describe('planner keyboard scope', () => {
	it('gives a lone planner the keyboard without any pointer contact', () => {
		const only = mount()

		expect(plannerInstancesMounted()).toBe(1)
		expect(hasOtherPlannerInstances(only)).toBe(false)
		// The standalone day and template routes must keep working the moment the grid loads.
		expect(isPlannerInstanceActive(only)).toBe(true)
	})

	it('gives the keyboard to one panel at a time once a second planner mounts', () => {
		const left = mount()
		const right = mount()

		expect(plannerInstancesMounted()).toBe(2)
		expect(hasOtherPlannerInstances(left)).toBe(true)

		// Nothing pointed at yet: neither panel claims the keys, so one ArrowUp cannot move both.
		expect(isPlannerInstanceActive(left)).toBe(false)
		expect(isPlannerInstanceActive(right)).toBe(false)

		activatePlannerInstance(left)
		expect(isPlannerInstanceActive(left)).toBe(true)
		expect(isPlannerInstanceActive(right)).toBe(false)

		activatePlannerInstance(right)
		expect(isPlannerInstanceActive(left)).toBe(false)
		expect(isPlannerInstanceActive(right)).toBe(true)
	})

	it('hands the keyboard to the survivor when the active panel unmounts', () => {
		const left = mount()
		const right = mount()
		activatePlannerInstance(right)

		unmount(right)

		expect(plannerInstancesMounted()).toBe(1)
		expect(isPlannerInstanceActive(left)).toBe(true)
	})

	it('reports other instances the same way before and after deregistering', () => {
		const left = mount()
		const right = mount()

		// `usePlannerKeyboard` asks this in `onUnmounted` to decide whether it may clear the shared
		// undo stack, and it must not depend on which unmount hook ran first.
		expect(hasOtherPlannerInstances(right)).toBe(true)
		unmount(right)
		expect(hasOtherPlannerInstances(right)).toBe(true)

		unmount(left)
		expect(hasOtherPlannerInstances(right)).toBe(false)
	})
})
