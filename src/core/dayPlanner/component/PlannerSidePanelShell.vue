<!-- PlannerSidePanelShell.vue - panel chrome shared by the day planner and the template planner -->
<template>
	<VCard
		v-show="panelOpen || !compact"
		class="flex-column align-self-stretch"
		:elevation="compact ? 12 : 2"
		:style="panelStyle"
	>
		<VCardTitle class="pt-4 px-5 pb-2 d-flex flex-column ga-2">
			<div class="d-flex justify-space-between align-center">
				<span class="text-grey-lighten-1">
					{{ activePanel === 'details' ? detailsTitle : $t('planner.template.routineTasksPanel') }}
				</span>
				<div class="d-flex align-center ga-2">
					<slot name="titleActions"></slot>
					<VIconBtn
						v-if="compact"
						color="secondaryOutline"
						icon="xmark"
						variant="tonal"
						size="36"
						:aria-label="$t('planner.a11y.closePanel')"
						@click="panelOpen = false"
					/>
				</div>
			</div>
			<!-- Shown in both layouts. The template planner's header has no tab toggle of its own, so hiding
			     this one when compact (it was `d-none d-md-flex`) left the routine tab unreachable there. -->
			<MyBtnToggle
				v-model="activePanel"
				:label="$t('planner.a11y.panelSection')"
				mandatory
				style="width: 100%"
				density="compact"
				variant="outlined"
				color="secondaryOutline"
			>
				<VBtn
					value="details"
					:prependIcon="detailsIcon"
					style="flex: 1"
				>
					{{ $t('planner.template.details') }}
				</VBtn>
				<VBtn
					value="routine"
					prependIcon="rotate"
					style="flex: 1"
				>
					{{ $t('planner.template.routine') }}
				</VBtn>
			</MyBtnToggle>
		</VCardTitle>
		<!-- v-if, not v-show: the bodies are expected to mount/unmount as the tab changes, the way
			 they did when each view inlined this markup. RoutineSidePanel reloads its list on mount. -->
		<slot
			v-if="activePanel === 'details'"
			name="details"
		></slot>
		<slot
			v-else
			name="routine"
		></slot>
	</VCard>
</template>

<script setup lang="ts">
	import { computed } from 'vue'
	import MyBtnToggle from '@/_common/component/inputs/MyBtnToggle.vue'
	import type { PlannerSidePanelTab } from '@/core/dayPlanner/composable/useRoutinePlacement.ts'
	import { usePlannerCompact } from '@/core/dayPlanner/composable/usePlannerLayout.ts'

	const {
		detailsTitle,
		detailsIcon,
		width = '380px',
	} = defineProps<{
		/** Panel heading while the details tab is active; the routine tab's heading is the same in both planners. */
		detailsTitle: string
		/** Details toggle icon — the day planner shows a calendar, the template planner sliders. */
		detailsIcon: string
		width?: string
	}>()

	const panelOpen = defineModel<boolean>('panelOpen', { default: true })
	const activePanel = defineModel<PlannerSidePanelTab>('activePanel', { default: 'details' })

	// The planner's own width, not the window's (F88): in the template split view a desktop window holds
	// two narrow planners. Provided by the view through `providePlannerLayout`.
	const compact = usePlannerCompact()

	// `display: flex` lives here and not as `d-flex`: that class is `!important` and beat `v-show`'s
	// inline `display: none`, so the close X hid nothing. Vue lets `v-show` win over a bound style.
	// Wide: beside the grid. `flexShrink: 0` because the grid is `flex: 1 1 auto`, so its basis is its
	// whole max-content width and shrinking is weighted by basis — without it the panel lost the `width`
	// it was given and sat at `minWidth` on every desktop screen.
	// Compact: over the grid, anchored to the view's root (`position: relative` there). It never takes
	// width from the grid, which is what squeezed the split view's grid to ~100 px. Capped at the view's
	// width so it cannot overflow a phone sideways (the F51 bug), and it scrolls on its own when its body
	// is taller than the planner.
	const panelStyle = computed(() => ({
		display: 'flex',
		...(compact.value
			? {
					position: 'absolute' as const,
					top: 0,
					left: 0,
					zIndex: 30,
					width: `min(${width}, 100%)`,
					maxHeight: '100%',
					overflowY: 'auto' as const,
				}
			: { width, minWidth: '280px', flexShrink: 0 }),
	}))
</script>
