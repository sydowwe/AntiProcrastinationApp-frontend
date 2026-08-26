<template>
	<div
		class="timeline-lane"
		:class="`lane-${laneType}`"
		:style="laneStyle"
	>
		<TimelineSession
			v-for="session in sessions"
			:key="session.id"
			:session="session"
			:position="getSessionPosition(session)"
			:stackLevel="getStackLevel(session)"
			:laneType="laneType"
			:baseHeight="config.laneHeight"
			@mouseenter="$emit('sessionHover', $event, session)"
			@mouseleave="$emit('sessionLeave')"
			@click="$emit('sessionClick', session)"
		/>
	</div>
</template>

<script setup lang="ts">
	import { computed } from 'vue'
	import { calculateSessionPosition } from './timelineUtils'
	import type { StackedSession } from '@/core/activityTracking/component/timeline/dto/StackedSession.ts'
	import type { LaneType } from '@/core/activityTracking/component/timeline/dto/LaneType.ts'
	import type { TimelineGridConfig } from '@/core/activityTracking/component/timeline/dto/TimelineGridConfig.ts'
	import type { SessionPosition } from '@/core/activityTracking/component/timeline/dto/SessionPosition.ts'
	import type { TimelineSessionDto } from '@/core/activityTracking/dto/response/timeline/TimelineSessionDto.ts'
	import TimelineSession from '@/core/activityTracking/component/timeline/TimelineSession.vue'

	const props = defineProps<{
		sessions: (TimelineSessionDto | StackedSession)[]
		from: Date
		to: Date
		containerWidth: number
		config: TimelineGridConfig
		laneType: LaneType
		laneHeight?: number
	}>()

	defineEmits<{
		sessionHover: [event: MouseEvent, session: TimelineSessionDto | StackedSession]
		sessionLeave: []
		sessionClick: [session: TimelineSessionDto | StackedSession]
	}>()

	const laneStyle = computed(() => ({
		height: `${props.laneHeight ?? props.config.laneHeight}px`,
		position: 'relative' as const,
	}))

	function getSessionPosition(session: TimelineSessionDto | StackedSession): SessionPosition {
		return calculateSessionPosition(session, props.from, props.to, props.containerWidth, props.config)
	}

	function getStackLevel(session: TimelineSessionDto | StackedSession): number {
		return 'stackLevel' in session ? session.stackLevel : 0
	}
</script>

<style scoped>
	.timeline-lane {
		position: relative;
		overflow: hidden;
	}

	.lane-active {
		background: rgb(var(--v-theme-surface));
		border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
	}

	.lane-background {
		background: rgb(var(--v-theme-surface));
	}
</style>
