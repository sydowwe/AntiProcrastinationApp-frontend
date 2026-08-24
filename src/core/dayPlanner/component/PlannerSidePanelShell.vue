<!-- PlannerSidePanelShell.vue - panel chrome shared by the day planner and the template planner -->
<template>
	<VCard
		v-show="panelOpen || mdAndUp"
		class="d-flex flex-column align-self-stretch"
		elevation="2"
		:style="{ width, minWidth: '280px' }"
	>
		<VCardTitle class="pt-4 px-5 pb-2 d-flex flex-column ga-2">
			<div class="d-flex justify-space-between align-center">
				<span class="text-grey-lighten-1">
					{{ activePanel === 'details' ? detailsTitle : $t('planner.template.routineTasksPanel') }}
				</span>
				<div class="d-flex align-center ga-2">
					<slot name="titleActions"></slot>
					<VIconBtn
						class="d-md-none"
						color="secondaryOutline"
						icon="xmark"
						variant="tonal"
						size="36"
						@click="panelOpen = false"
					/>
				</div>
			</div>
			<VBtnToggle
				v-model="activePanel"
				mandatory
				class="d-none d-md-flex"
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
			</VBtnToggle>
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
	import { useDisplay } from 'vuetify'
	import type { PlannerSidePanelTab } from '@/core/dayPlanner/composable/useRoutinePlacement.ts'

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

	// The mobile breakpoint is deliberately the panel's own, not the caller's: both views used
	// `mdAndUp` before, and the `d-md-none` / `d-none d-md-flex` classes above are hard-wired to it.
	const { mdAndUp } = useDisplay()
</script>
