import { provide, ref, watch, type InjectionKey, type Ref } from 'vue'
import type { RoutineTodoListItemEntity } from '@/core/todoList/dto/response/routine/RoutineTodoListItemEntity.ts'
import type { AnyDayPlannerStore } from '@/core/dayPlanner/store/IBaseDayPlannerStore.ts'

/** Which body the side panel is showing. Shared by the panel shell, the header toggles and the views. */
export type PlannerSidePanelTab = 'details' | 'routine'

/**
 * Typed replacement for the old `provide('selectedRoutineItem', …)` string key. Provided by
 * `useRoutinePlacement`, so by whichever view owns the panel; read by `TemplatePlannerTaskDialog` to
 * prefill the activity and its suggested duration when a task is created while an item is picked.
 */
export const SELECTED_ROUTINE_ITEM_KEY = Symbol('selectedRoutineItem') as InjectionKey<
	Ref<RoutineTodoListItemEntity | null>
>

/**
 * Owns the planner side panel's state and the routine-item ↔ grid-placement handshake, which both
 * planner views need and used to carry as a byte-identical copy each.
 *
 * Call it from a view's `setup` — it `provide`s, so it is not callable later.
 *
 * `store` is narrowed to the one field this touches: both concrete stores satisfy it, and the split
 * view's two panels each pass their own store, so nothing here may reach for a store by id.
 *
 * `openByDefault` is the user's "Show details panel by default" (OP2). It is a getter, not a value,
 * because the settings may still be loading at setup: it starts at the store's `true` and the watcher
 * below applies the saved value once it arrives.
 */
export function useRoutinePlacement(
	store: Pick<AnyDayPlannerStore, 'placingItem'>,
	compact?: Readonly<Ref<boolean>>,
	openByDefault: () => boolean = () => true,
) {
	const activePanel = ref<PlannerSidePanelTab>('details')
	const panelOpen = ref(initialOpen())
	const selectedRoutineItem = ref<RoutineTodoListItemEntity | null>(null)

	provide(SELECTED_ROUTINE_ITEM_KEY, selectedRoutineItem)

	function initialOpen() {
		return !compact?.value && openByDefault()
	}

	// A compact planner floats the panel over the grid (F88), so it starts closed there and opens on
	// demand. A wide one starts as the user's setting says. Re-applied whenever the layout crosses the
	// threshold, and when the setting itself arrives or changes.
	watch(openByDefault, () => {
		panelOpen.value = initialOpen()
	})
	if (compact) {
		watch(compact, () => {
			panelOpen.value = initialOpen()
		})
		// Picking an item is the step before placing it on the grid, which the open overlay covers.
		watch(selectedRoutineItem, item => {
			if (item && compact.value) panelOpen.value = false
		})
	}

	// Leaving the routine tab drops the pick, and the watcher below then clears the placing item.
	watch(activePanel, panel => {
		if (panel !== 'routine') selectedRoutineItem.value = null
	})

	// The two watchers below write to each other's source, so the termination argument matters and is
	// not visible from either half alone:
	//
	//   picking an item  → placingItem becomes truthy → the `if (!item)` guard stops the round trip.
	//   clearing a pick  → placingItem becomes null → writes null onto an already-null ref, which Vue
	//                      does not treat as a change, so the first watcher does not re-fire.
	//   cancelling on the grid (`DayPlanner.vue` sets `placingItem = null`) → same as above.
	//
	// The guard is load-bearing: without it the return leg would run on the truthy path too, and the
	// first watcher builds a NEW object every time, so `placingItem` would never compare equal and
	// the pair would oscillate rather than settle.
	watch(selectedRoutineItem, item => {
		store.placingItem = item ? { name: item.activity.name, icon: 'rotate' } : null
	})

	watch(
		() => store.placingItem,
		item => {
			if (!item) selectedRoutineItem.value = null
		},
	)

	return { activePanel, panelOpen, selectedRoutineItem }
}
