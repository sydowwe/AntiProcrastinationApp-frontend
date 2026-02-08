<template>
<VCard class="pa-4 pb-3">
	<div class="header">
		<div class="d-flex ga-4 align-center">
			<h3 class="text-subtitle-1 font-weight-medium">Activity Timeline</h3>
			<!-- Lane type legend -->
			<div class="legend">
				<div class="legend-item">
					<div class="legend-color legend-active"/>
					<span>Active</span>
				</div>
				<div class="legend-item">
					<div class="legend-color legend-background"/>
					<span>Background</span>
				</div>
			</div>
		</div>

		<VBtnToggle
			v-model="viewMode"
			mandatory
			density="compact"
			variant="outlined"
			style="border-color: rgba(var(--v-theme-on-surface), 0.3) !important;"
		>
			<VBtn value="single" size="small">
				Single
			</VBtn>
			<VBtn value="split" size="small">
				Split
			</VBtn>
		</VBtnToggle>
	</div>


	<!-- Loading state -->
	<template v-if="loading">
		<VSkeletonLoader type="image" height="150"/>
	</template>

	<!-- Empty state -->
	<template
		v-else-if="activeSessions.length === 0 && backgroundSessions.length === 0"
	>
		<div class="empty-state">
			<VIcon size="48" color="grey-lighten-1">mdi-timeline-outline</VIcon>
			<p class="text-grey mt-2">No activity recorded for this period</p>
		</div>
	</template>

	<!-- Timeline -->
	<template v-else>
		<TimelineGrid
			:activeSessions="activeSessions"
			:backgroundSessions="stackedBackgroundSessions"
			:from="from"
			:to="to"
			:viewMode="viewMode"
			:splitPoint="splitPoint"
			@sessionClick="$emit('sessionClick', $event)"
		/>

		<!-- Domain color legend -->
		<div class="domain-legend">
			<div
				v-for="entry in domainLegendEntries"
				:key="entry.domain"
				class="domain-legend-item"
			>
				<div class="domain-swatch" :style="{ background: entry.color }"/>
				<span class="domain-name">{{ entry.domain }}</span>
			</div>
		</div>
	</template>
</VCard>
</template>

<script setup lang="ts">
import {computed, ref} from 'vue'
import {getDomainColor} from '@/utils/domainColor'
import TimelineGrid from './TimelineGrid.vue'
import {calculateWaterfallStack} from './timelineUtils'
import type {TimelineSession, ViewMode} from './types'

const props = defineProps<{
	activeSessions: TimelineSession[]
	backgroundSessions: TimelineSession[]
	from: Date
	to: Date
	loading?: boolean
}>()

defineEmits<{
	sessionClick: [session: TimelineSession]
}>()

const viewMode = ref<ViewMode>('single')

const splitPoint = computed(() => {
	const midTime = (props.from.getTime() + props.to.getTime()) / 2
	return new Date(midTime)
})

const stackedBackgroundSessions = computed(() => {
	return calculateWaterfallStack(props.backgroundSessions)
})

// Collect unique domains for the color legend
const domainLegendEntries = computed(() => {
	const seen = new Set<string>()
	const entries: { domain: string; color: string }[] = []

	for (const session of props.activeSessions) {
		if (!seen.has(session.domain)) {
			seen.add(session.domain)
			entries.push({domain: session.domain, color: getDomainColor(session.domain)})
		}
	}
	for (const session of props.backgroundSessions) {
		if (!seen.has(session.domain)) {
			seen.add(session.domain)
			entries.push({domain: session.domain, color: getDomainColor(session.domain)})
		}
	}

	return entries
})
</script>

<style scoped>

.header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 12px;
}

.legend {
	display: flex;
	gap: 16px;
}

.legend-item {
	display: flex;
	align-items: center;
	gap: 6px;
	font-size: 12px;
	color: rgba(var(--v-theme-on-surface), 0.6);
}

.legend-color {
	width: 24px;
	height: 20px;
	border-radius: 2px;
}

.legend-active {
	background-color: rgb(var(--v-theme-primary));
}

.legend-background {
	background: repeating-linear-gradient(
		45deg,
		rgba(var(--v-theme-primary), 0.3),
		rgba(var(--v-theme-primary), 0.3) 3px,
		rgba(var(--v-theme-primary), 0.1) 3px,
		rgba(var(--v-theme-primary), 0.1) 6px
	);
	border-left: 2px solid rgb(var(--v-theme-primary));
}

.domain-legend {
	display: flex;
	flex-wrap: wrap;
	gap: 12px;
	margin: 12px 12px 0 12px;
	padding-top: 8px;
	border-top: 1px solid rgba(var(--v-theme-on-surface), 0.06);
}

.domain-legend-item {
	display: flex;
	align-items: center;
	gap: 6px;
}

.domain-swatch {
	width: 10px;
	height: 10px;
	border-radius: 2px;
	flex-shrink: 0;
}

.domain-name {
	font-size: 11px;
	color: rgba(var(--v-theme-on-surface), 0.6);
}

.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 48px;
}
</style>
