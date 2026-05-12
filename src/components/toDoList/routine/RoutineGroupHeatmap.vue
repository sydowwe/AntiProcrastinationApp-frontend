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

	const {
		history,
		lengthInDays,
		clickable = false,
	} = defineProps<{
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

	const displayed = computed(() => {
		const total = columns.value * ROWS
		const msPerPeriod = lengthInDays * 24 * 60 * 60 * 1000
		const entries: PeriodCompletion[] = [...history]

		// Append a current-period placeholder when the last history entry ends before today
		if (entries.length > 0) {
			const last = entries[entries.length - 1]
			if (new Date(last.periodEnd).getTime() < Date.now()) {
				entries.push({
					periodStart: last.periodEnd,
					periodEnd: new Date(new Date(last.periodEnd).getTime() + msPerPeriod).toISOString(),
					completedCount: 0,
					totalCount: 0,
				})
			}
		}

		const slice = entries.slice(-total)
		const padCount = total - slice.length
		if (padCount === 0) return slice

		// Compute real date ranges for padding cells going back before the oldest slice entry.
		// When history is completely empty, anchor from one period ahead of now.
		const anchorMs =
			slice.length > 0
				? new Date(slice[0].periodStart).getTime()
				: Date.now() + msPerPeriod

		const pads: PeriodCompletion[] = Array.from({ length: padCount }, (_, i) => {
			const endMs = anchorMs - (padCount - 1 - i) * msPerPeriod
			return {
				periodStart: new Date(endMs - msPerPeriod).toISOString(),
				periodEnd: new Date(endMs).toISOString(),
				completedCount: 0,
				totalCount: 0,
			}
		})

		return [...pads, ...slice]
	})

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
		const label =
			lengthInDays === 1
				? formatDate(p.periodStart)
				: `${formatDate(p.periodStart)} – ${formatDate(p.periodEnd)}`
		if (p.totalCount === 0) return `${label} · 0 done`
		const ratio = p.completedCount / p.totalCount
		if (ratio >= 1) return `${label} · All done`
		return `${label} · ${p.completedCount} / ${p.totalCount} done`
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
