import { computed, inject, provide, type ComputedRef, type InjectionKey, type Ref } from 'vue'
import { useElementSize } from '@vueuse/core'
import { useDisplay } from 'vuetify'

/**
 * Below this width the planner cannot hold the side panel beside the grid: the panel is 380–400 px and
 * the grid needs about 500 px to show a task's title.
 */
export const PLANNER_COMPACT_BELOW_PX = 900

const PLANNER_COMPACT_KEY = Symbol('plannerCompact') as InjectionKey<ComputedRef<boolean>>

/**
 * Whether a planner view is too narrow for the side panel beside its grid, measured on the view's own
 * root element, not the window (F88).
 *
 * A window breakpoint (`mdAndUp`) answers the wrong question in the template split view. There a 1440 px
 * window holds two ~550 px panes, each running the desktop layout, and the 400 px panel left the grid
 * about 100 px. A compact planner floats the panel over the grid instead of beside it, so opening it
 * covers the grid for a moment and closing it gives the whole width back. The width of the grid never
 * changes.
 *
 * Call it from the view's `setup` with the root element's ref. It `provide`s the flag to the panel shell
 * and the headers, which read it through {@link usePlannerCompact}.
 */
export function providePlannerLayout(root: Ref<HTMLElement | undefined>): ComputedRef<boolean> {
	const { width } = useElementSize(root)
	const { mdAndUp } = useDisplay()
	// Before the first measurement the width is 0, so fall back to the window breakpoint: that is
	// right for every single-planner page and avoids a first frame with the panel squeezed beside the grid.
	const compact = computed(() => (width.value > 0 ? width.value < PLANNER_COMPACT_BELOW_PX : !mdAndUp.value))
	provide(PLANNER_COMPACT_KEY, compact)
	return compact
}

/** The flag {@link providePlannerLayout} provides. Outside a planner view, the window breakpoint. */
export function usePlannerCompact(): ComputedRef<boolean> {
	const provided = inject(PLANNER_COMPACT_KEY, null)
	if (provided) return provided
	const { mdAndUp } = useDisplay()
	return computed(() => !mdAndUp.value)
}
