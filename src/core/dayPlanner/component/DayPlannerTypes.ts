import type { InjectionKey, Ref } from 'vue'

/**
 * The grid element of one planner, published by `PlannerTasksColumn` and provided by `DayPlanner`.
 *
 * It exists for focus management: the floating action bars are siblings of the grid, not children,
 * so when a bar unmounts and the element that had focus is gone with it, nothing in the bar can
 * find its way back to the planner. The split view provides one ref per panel, so a bar always
 * lands in the grid it belongs to.
 */
export const PLANNER_GRID_KEY = Symbol('plannerGrid') as InjectionKey<Ref<HTMLElement | undefined>>

export interface PlacingItem {
	name: string
	icon: string
	color?: string
}

/**
 * The cut / duplicate buffer. Declared once because three places used to spell it out by hand — the
 * store core, the store contract and `useClipboardHandling` — and the consumer's copy was the only
 * one missing `sourceContext`, so a cross-context paste did not type-check.
 */
export interface PlannerClipboard<TTask> {
	tasks: TTask[]
	mode: 'cut' | 'duplicate'
	/** Which day or template the tasks were cut from; absent on a clipboard restored from an old session. */
	sourceContext?: string
}

export class CreationPreviewType {
	constructor(
		public initRow: number,
		public startRow: number,
		public endRow: number,
	) {}

	public static init(slot: number) {
		return new CreationPreviewType(slot, slot, slot)
	}
}

export const SLOT_HEIGHT = 44 // pixels

/**
 * What `BasePlannerTaskDialog` exposes to the wrapper that renders it. Named here because the
 * component is generic, and `InstanceType<typeof BasePlannerTaskDialog>` does not work on a generic
 * `<script setup>` component — it compiles to a generic function, not a constructor.
 */
export interface PlannerTaskDialogApi {
	prefillActivity: (activityId: number) => void
	resetActivityField: () => void
	applySuggestedTime: (durationMinutes: number) => void
}
