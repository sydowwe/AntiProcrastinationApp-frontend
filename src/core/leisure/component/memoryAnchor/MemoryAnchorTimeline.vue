<template>
	<div class="h-100 w-100 d-flex flex-column ga-3">
		<VProgressLinear
			v-if="loading"
			indeterminate
		/>
		<template v-if="!loading && items.length === 0">
			<div class="empty-state">
				<VIcon
					icon="anchor"
					size="40"
					class="mb-3"
					style="opacity: 0.3"
				/>
				<p class="text-subtitle-2 font-weight-medium mb-3">{{ $t('leisure.emptyStates.memoryAnchors') }}</p>
				<VBtn
					color="success"
					variant="tonal"
					prependIcon="plus"
					@click="openCreateDialog"
				>
					{{ $t('general.add') }}
				</VBtn>
			</div>
		</template>
		<template v-else>
			<div class="d-flex align-center flex-wrap ga-2">
				<VIconBtn
					icon="chevron-left"
					size="small"
					variant="text"
					:title="$t('leisure.timeline.previousYear')"
					:disabled="effectiveYear <= minYear"
					@click="stepYear(-1)"
				/>
				<VMenu>
					<template #activator="{ props: menuProps }">
						<VBtn
							v-bind="menuProps"
							variant="text"
							class="text-h6 px-2"
							:title="$t('leisure.timeline.chooseYear')"
						>
							{{ effectiveYear }}
						</VBtn>
					</template>
					<VList density="compact">
						<VListItem
							v-for="selectable in selectableYears"
							:key="selectable"
							:active="selectable === effectiveYear"
							@click="year = selectable"
						>
							<VListItemTitle>{{ selectable }}</VListItemTitle>
							<template #append>
								<span class="text-caption text-medium-emphasis ms-4">
									{{ countForYear(selectable) }}
								</span>
							</template>
						</VListItem>
					</VList>
				</VMenu>
				<VIconBtn
					icon="chevron-right"
					size="small"
					variant="text"
					:title="$t('leisure.timeline.nextYear')"
					:disabled="effectiveYear >= maxYear"
					@click="stepYear(1)"
				/>
				<span class="text-caption text-medium-emphasis">
					{{ $t('leisure.timeline.memoriesCount', { count: yearCount }) }}
				</span>
				<VSpacer />
				<VBtn
					color="success"
					variant="tonal"
					prependIcon="plus"
					size="small"
					@click="openCreateDialog"
				>
					{{ $t('general.add') }}
				</VBtn>
			</div>

			<!-- The whole year in one line, in the same visual language as RoutineGroupHeatmap: one cell per
			     month, intensity by rating, and an outlined cell where nothing happened. -->
			<div class="year-strip">
				<VTooltip
					v-for="month in MONTHS"
					:key="month"
					location="top"
				>
					<template #activator="{ props: tooltipProps }">
						<div
							v-bind="tooltipProps"
							class="strip-cell"
							:class="{ 'is-empty': anchorsFor(month).length === 0 }"
							:style="stripStyle(month)"
						/>
					</template>
					<span>{{ stripTooltip(month) }}</span>
				</VTooltip>
			</div>

			<p
				v-if="yearCount === 0"
				class="text-caption text-medium-emphasis mb-0"
			>
				{{ $t('leisure.timeline.emptyYear', { year: effectiveYear }) }}
			</p>

			<div
				class="timeline"
				v-auto-animate
			>
				<div
					v-for="month in MONTHS"
					:key="month"
					class="month-row"
				>
					<div class="month-rail">
						<span
							class="month-label"
							:class="anchorsFor(month).length > 0 ? 'font-weight-medium' : 'text-medium-emphasis'"
						>
							{{ monthLabel(month) }}
						</span>
						<span class="rail-track">
							<span
								class="rail-dot"
								:class="{ 'is-empty': anchorsFor(month).length === 0 }"
								:style="stripStyle(month)"
							/>
							<span
								v-if="month !== 12"
								class="rail-line"
							/>
						</span>
					</div>
					<div class="month-body">
						<!-- A month with nothing in it stays on screen as a gap. Not recording anything in March is
						     a fact about March, and hiding it would make every year look equally full. -->
						<div
							v-if="anchorsFor(month).length === 0"
							class="month-empty"
						/>
						<div
							v-for="anchor in anchorsFor(month)"
							:key="anchor.id"
							class="anchor"
							:style="anchorStyle(anchor)"
						>
							<div class="d-flex align-center ga-2 flex-wrap">
								<ActivityNameCell :activity="anchor.activity" />
								<VChip
									v-if="sourceLabel(anchor)"
									size="x-small"
									variant="tonal"
								>
									{{ sourceLabel(anchor) }}
								</VChip>
								<VSpacer />
								<span
									class="rating-swatch"
									:style="{
										backgroundColor: `rgba(var(--v-theme-secondaryOutline), ${ratingAlpha(anchor.rating)})`,
									}"
								/>
								<span class="text-caption text-medium-emphasis">{{ anchor.rating }}/10</span>
							</div>
							<!-- The note is the payload, so it is rendered in full. A highlight you have to click to
							     read is a highlight you never re-read. -->
							<p
								v-if="anchor.highlightNote"
								class="anchor-note text-body-2 mt-1 mb-0"
							>
								{{ anchor.highlightNote }}
							</p>
						</div>
					</div>
				</div>
			</div>
		</template>
	</div>
</template>

<script setup lang="ts">
	import { computed } from 'vue'
	import { useI18n } from 'vue-i18n'
	import ActivityNameCell from '@/core/leisure/component/ActivityNameCell.vue'
	import MemoryAnchorForm from '@/core/leisure/component/memoryAnchor/MemoryAnchorForm.vue'
	import type { MemoryAnchor } from '@/core/leisure/dto/response/MemoryAnchor.ts'
	import { useDialog } from '@/_common/composable/general/useDialog.ts'
	import { capitalizeString } from '@/_common/utils/helperMethods.ts'

	// `items` is every anchor the filter matches, across all years — the timeline navigates years
	// itself, so it needs the whole history to know which years even exist.
	const {
		items,
		loading,
		monthFilter = null,
	} = defineProps<{
		items: MemoryAnchor[]
		loading: boolean
		monthFilter?: number | null
	}>()
	const emit = defineEmits<{ onReload: [] }>()
	// `null` means "no year chosen yet" and resolves to `fallbackYear`, not to a hardcoded year: the
	// view keeps this in the filter's `year`, which starts empty.
	const year = defineModel<number | null>('year', { required: true })

	const { t, locale } = useI18n()
	const { openDialog } = useDialog()

	const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
	const currentYear = new Date().getFullYear()

	const monthFormatter = computed(() => new Intl.DateTimeFormat(locale.value, { month: 'long' }))

	const yearsPresent = computed(() => [...new Set(items.map(anchor => anchor.anchorYear))].sort((a, b) => a - b))

	// Landing on an empty current year while three anchors sit in 2024 would read as "you have
	// nothing". Fall back to the most recent year that actually holds something instead.
	const fallbackYear = computed(() => {
		if (yearsPresent.value.length === 0 || yearsPresent.value.includes(currentYear)) return currentYear
		return yearsPresent.value[yearsPresent.value.length - 1]
	})

	const effectiveYear = computed(() => year.value ?? fallbackYear.value)

	// Newest first in the menu — looking back starts from the recent end.
	const selectableYears = computed(() =>
		[...new Set([...yearsPresent.value, currentYear, effectiveYear.value])].sort((a, b) => b - a),
	)
	const minYear = computed(() => selectableYears.value[selectableYears.value.length - 1])
	const maxYear = computed(() => selectableYears.value[0])

	const byMonth = computed(() => {
		const map = new Map<number, MemoryAnchor[]>(MONTHS.map(month => [month, []]))
		for (const anchor of items) {
			if (anchor.anchorYear !== effectiveYear.value) continue
			if (monthFilter != null && anchor.anchorMonth !== monthFilter) continue
			map.get(anchor.anchorMonth)?.push(anchor)
		}
		// Best memory of the month first. Safe to sort here and nowhere else: the timeline holds every
		// filtered row at once, so unlike the paged table it is not reordering a window.
		for (const monthAnchors of map.values()) {
			monthAnchors.sort((a, b) => b.rating - a.rating || a.id - b.id)
		}
		return map
	})

	const yearCount = computed(() => MONTHS.reduce((total, month) => total + anchorsFor(month).length, 0))

	function anchorsFor(month: number): MemoryAnchor[] {
		return byMonth.value.get(month) ?? []
	}

	function countForYear(candidate: number): number {
		return items.filter(
			anchor => anchor.anchorYear === candidate && (monthFilter == null || anchor.anchorMonth === monthFilter),
		).length
	}

	function monthLabel(month: number): string {
		return capitalizeString(monthFormatter.value.format(new Date(effectiveYear.value, month - 1, 1)))
	}

	function stepYear(delta: number) {
		year.value = effectiveYear.value + delta
	}

	// One hue, varying only in intensity. A 4/10 experience you chose to write down is still a memory
	// worth keeping, so a weak rating reads as quieter — never as a warning colour.
	function ratingAlpha(rating: number): number {
		const clamped = Math.min(10, Math.max(1, rating))
		return Number((0.28 + ((clamped - 1) / 9) * 0.64).toFixed(3))
	}

	function bestRating(month: number): number {
		return anchorsFor(month).reduce((best, anchor) => Math.max(best, anchor.rating), 0)
	}

	function stripStyle(month: number) {
		const best = bestRating(month)
		if (best === 0) return undefined
		return { backgroundColor: `rgba(var(--v-theme-secondaryOutline), ${ratingAlpha(best)})` }
	}

	function anchorStyle(anchor: MemoryAnchor) {
		const alpha = ratingAlpha(anchor.rating)
		return {
			borderLeftColor: `rgba(var(--v-theme-secondaryOutline), ${alpha})`,
			backgroundColor: `rgba(var(--v-theme-secondaryOutline), ${Number((alpha * 0.14).toFixed(3))})`,
		}
	}

	function stripTooltip(month: number): string {
		const label = monthLabel(month)
		const count = anchorsFor(month).length
		if (count === 0) return t('leisure.timeline.monthNone', { month: label })
		return t('leisure.timeline.monthBest', { month: label, count, best: bestRating(month) })
	}

	function sourceLabel(anchor: MemoryAnchor): string | null {
		if (anchor.hasBucketList) return t('leisure.anchorSourceBucketList')
		if (anchor.hasBacklog && anchor.backlogIsOneTime) return t('leisure.anchorSourceBacklog')
		return null
	}

	async function openCreateDialog() {
		const result = await openDialog({
			component: MemoryAnchorForm,
			dialogProps: { title: t('leisure.memoryAnchors'), confirmBtnLabel: t('general.create') },
		})
		if (result) emit('onReload')
	}
</script>

<style scoped>
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 48px 24px;
		text-align: center;
		color: rgba(var(--v-theme-on-surface), 0.5);
	}

	.year-strip {
		display: flex;
		gap: 4px;
	}

	.strip-cell {
		flex: 1 1 0;
		height: 13px;
		border-radius: 2px;
	}

	/* Same treatment as the routine heatmap's "nothing scheduled" cell, on purpose. */
	.strip-cell.is-empty,
	.rail-dot.is-empty {
		background-color: rgba(var(--v-theme-neutral-700), 0.1);
		border: 1px solid rgba(var(--v-theme-neutral-700), 0.3);
	}

	.timeline {
		display: flex;
		flex-direction: column;
		overflow-y: auto;
	}

	.month-row {
		display: flex;
		gap: 10px;
	}

	.month-rail {
		display: flex;
		gap: 8px;
		flex: 0 0 116px;
	}

	.month-label {
		flex: 1 1 auto;
		text-align: right;
		font-size: 0.75rem;
		line-height: 1.4;
		padding-top: 1px;
	}

	.rail-track {
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 10px;
		flex: 0 0 10px;
	}

	.rail-dot {
		width: 9px;
		height: 9px;
		border-radius: 50%;
		margin-top: 4px;
		flex-shrink: 0;
	}

	.rail-line {
		flex: 1 1 auto;
		width: 2px;
		min-height: 12px;
		background-color: rgba(var(--v-theme-on-surface), 0.12);
	}

	.month-body {
		flex: 1 1 auto;
		min-width: 0;
		padding-bottom: 10px;
	}

	/* An empty month still occupies a visible row — a thin gap rather than a card. */
	.month-empty {
		height: 8px;
		margin-top: 4px;
		border-bottom: 1px dashed rgba(var(--v-theme-on-surface), 0.12);
	}

	.anchor {
		border-left: 4px solid;
		border-radius: 6px;
		padding: 8px 10px;
		margin-bottom: 6px;
	}

	.anchor-note {
		white-space: pre-wrap;
		overflow-wrap: anywhere;
	}

	.rating-swatch {
		width: 13px;
		height: 13px;
		border-radius: 2px;
		flex-shrink: 0;
	}
</style>
