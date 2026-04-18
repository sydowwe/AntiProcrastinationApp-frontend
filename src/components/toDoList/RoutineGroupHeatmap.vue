<template>
	<div
		ref="containerRef"
		class="heatmap-grid"
		:style="clickable ? 'cursor: pointer' : ''"
		@click="clickable && emit('click')"
	>
		<VTooltip
			v-for="(p, i) in displayed"
			:key="i"
			location="top"
		>
			<template #activator="{ props: tp }">
				<div
					v-bind="tp"
					class="heatmap-cell"
					:class="cellClass(p)"
				/>
			</template>
			<span>{{ tooltipText(p) }}</span>
		</VTooltip>
	</div>
</template>

<script setup lang="ts">
	import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
	import type { PeriodCompletion } from '@/dtos/response/todoList/routine/RoutineTimePeriodEntity.ts'

	const { history, clickable = false } = defineProps<{
		history: PeriodCompletion[]
		lengthInDays: number
		clickable?: boolean
	}>()
	const emit = defineEmits<{ click: [] }>()
	const CELL_SIZE = 13
	const GAP = 4
	const ROWS = 2

	const containerRef = ref<HTMLElement | null>(null)
	const containerWidth = ref(0)

	const columns = computed(() => Math.max(1, Math.floor((containerWidth.value + GAP) / (CELL_SIZE + GAP))))

	const displayed = computed(() => history.slice(-columns.value * ROWS))

	let observer: ResizeObserver | null = null

	onMounted(() => {
		if (!containerRef.value) return
		observer = new ResizeObserver(entries => {
			containerWidth.value = entries[0].contentRect.width
		})
		observer.observe(containerRef.value)
		containerWidth.value = containerRef.value.offsetWidth
	})

	onBeforeUnmount(() => observer?.disconnect())

	function cellClass(p: PeriodCompletion): string {
		if (p.totalCount === 0) return 'cell-empty'
		const ratio = p.completedCount / p.totalCount
		if (ratio === 0) return 'cell-level-0'
		if (ratio < 0.35) return 'cell-level-1'
		if (ratio < 0.65) return 'cell-level-2'
		if (ratio < 1) return 'cell-level-3'
		return 'cell-level-4'
	}

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
	}

	function tooltipText(p: PeriodCompletion): string {
		const range = `${formatDate(p.periodStart)} – ${formatDate(p.periodEnd)}`
		if (p.totalCount === 0) return range
		const ratio = p.completedCount / p.totalCount
		if (ratio >= 1) return `${range} · All done`
		if (p.completedCount > 0) return `${range} · ${p.completedCount} / ${p.totalCount} done`
		return `${range} · Not done`
	}
</script>

<style scoped>
	.heatmap-grid {
		display: grid;
		grid-template-rows: repeat(2, 13px);
		grid-auto-flow: column;
		grid-auto-columns: 13px;
		gap: 4px;
		overflow: hidden;
	}

	.heatmap-cell {
		width: 13px;
		height: 13px;
		border-radius: 2px;
		transition: opacity 0.15s;
	}

	.heatmap-cell:hover {
		opacity: 0.75;
	}

	/* No tasks scheduled */
	.cell-empty {
		background-color: rgba(var(--v-theme-neutral-700), 0.1);
		border: 1px solid rgba(var(--v-theme-neutral-700), 0.3);
	}

	/* Tasks exist but none completed */
	.cell-level-0 {
		background-color: rgba(var(--v-theme-neutral-700), 0.3);
	}

	/* < 35% */
	.cell-level-1 {
		background-color: rgba(var(--v-theme-success), 0.25);
	}

	/* 35–64% */
	.cell-level-2 {
		background-color: rgba(var(--v-theme-success), 0.5);
	}

	/* 65–99% */
	.cell-level-3 {
		background-color: rgba(var(--v-theme-success), 0.72);
	}

	/* 100% */
	.cell-level-4 {
		background-color: rgba(var(--v-theme-success), 0.92);
	}
</style>
