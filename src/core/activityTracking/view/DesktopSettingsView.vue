<template>
	<!-- Viewport-locked only from `md` up (F91). Below it the filter bar and actions stack past the
	     viewport, so a full-height card clipped Save and the table; there the page scrolls instead. -->
	<div
		class="py-4 w-100"
		:class="{ 'h-100': mdAndUp }"
	>
		<VCard
			elevation="2"
			class="d-flex flex-column"
			:class="mdAndUp ? 'h-100' : 'natural-height'"
		>
			<!-- Wraps (F16): the filter bar drops to its own line when the row is too narrow, and the tab
			     toggle never shrinks, so its labels never truncate. -->
			<div class="pa-4 pb-0 w-100 d-flex flex-wrap align-center ga-4">
				<!-- `h1`: the page's own title — VCardTitle is a plain div by default, so the page had no heading. -->
				<VCardTitle
					tag="h1"
					class="pa-0"
				>
					{{ $t('activityTracking.settings.desktopTitle') }}
				</VCardTitle>
				<MyBtnToggle
					:modelValue="tableView"
					:label="$t('activityTracking.settings.section')"
					mandatory
					density="compact"
					color="primaryOutline"
					variant="outlined"
					style="border-color: rgba(var(--v-theme-on-surface), 0.3) !important; height: 40px; flex-shrink: 0"
				>
					<!-- The tab link carries the filter so switching tabs and back keeps the chosen view. -->
					<VBtn
						value="distinctEntries"
						height="40"
						:to="distinctEntriesRoute"
					>
						{{ $t('activityTracking.settings.distinctEntries') }}
					</VBtn>
					<VBtn
						value="mappings"
						height="40"
						:to="mappingsRoute"
					>
						{{ $t('activityTracking.settings.mappings') }}
					</VBtn>
				</MyBtnToggle>
				<DesktopEntriesFilterBar
					v-model="filter"
					:patternError
					@filter="applyFilter"
				/>
			</div>
			<VCardText class="pt-1 flex-fill d-flex flex-column ga-2">
				<DismissibleMappingHint storageKey="desktopSettingsHintDismissed" />
				<DesktopDistinctEntriesTable
					v-if="tableView === 'distinctEntries'"
					ref="distinctEntriesTable"
					v-model:mode="mode"
					v-model:formData="formData"
					:filter="filter"
					:keptTarget
					@clear="clearKeepingCoverage"
					@save="saveAndReload"
				/>
				<DesktopMappingsTable
					v-else-if="tableView === 'mappings'"
					ref="mappingsTable"
					:filter
					:highlightedId="highlightedMappingId"
					@edit="edit"
					@activeChanged="onActiveChanged"
				/>
			</VCardText>
		</VCard>
	</div>
</template>

<script setup lang="ts">
	import { computed, ref } from 'vue'
	import { useDisplay } from 'vuetify'
	import MyBtnToggle from '@/_common/component/inputs/MyBtnToggle.vue'
	import { useRoute } from 'vue-router'
	import { DesktopDistinctEntriesFilterRequest } from '@/core/activityTracking/dto/request/desktop/settings/DesktopDistinctEntriesFilterRequest.ts'
	import { TrackerDesktopMappingRequest } from '@/core/activityTracking/dto/request/desktop/settings/TrackerDesktopMappingRequest.ts'
	import { useTrackerDesktopMappingCrud } from '@/core/activityTracking/api/desktopActivityTrackingApi.ts'
	import type { TrackerDesktopMappingResponse } from '@/core/activityTracking/dto/response/desktop/settings/TrackerDesktopMappingResponse.ts'
	import { PatternMatchType } from '@/_common/dto/enum/PatternMatchType.ts'
	import router from '@/router.ts'
	import DesktopEntriesFilterBar from '@/core/activityTracking/component/desktop/desktopSettings/DesktopEntriesFilterBar.vue'
	import DesktopDistinctEntriesTable from '@/core/activityTracking/component/desktop/desktopSettings/DesktopDistinctEntriesTable.vue'
	import DesktopMappingsTable from '@/core/activityTracking/component/desktop/desktopSettings/DesktopMappingsTable.vue'
	import DismissibleMappingHint from '@/core/activityTracking/component/settings/DismissibleMappingHint.vue'
	import { useMappingSettings } from '@/core/activityTracking/composable/useMappingSettings.ts'
	import { useDistinctEntriesUrlState } from '@/core/activityTracking/composable/useDistinctEntriesUrlState.ts'

	const { mdAndUp } = useDisplay()
	const { create, update } = useTrackerDesktopMappingCrud()
	const { filter, formData, mode, editedId, request, patternError, keptTarget, loadTarget, saved, clear } =
		useMappingSettings({
			filterFactory: () => new DesktopDistinctEntriesFilterRequest(),
			requestFactory: () => new TrackerDesktopMappingRequest(),
			create,
			update,
		})

	const route = useRoute()
	const tableView = computed<'distinctEntries' | 'mappings'>(() =>
		route.params.tableView === 'mappings' ? 'mappings' : 'distinctEntries',
	)

	// The whole filter lives in the URL (B24, F15); the table reads it off `filter` like before.
	const { filterFromRoute, filterQuery, withTableParams, highlightedMappingId } =
		useDistinctEntriesUrlState<DesktopDistinctEntriesFilterRequest>(
			[
				{ text: 'processName', matchType: 'processNameMatchType' },
				{ text: 'productName', matchType: 'productNameMatchType' },
				{ text: 'windowTitle', matchType: 'windowTitleMatchType' },
			],
			() => new DesktopDistinctEntriesFilterRequest(),
		)
	filter.value = filterFromRoute()
	const distinctEntriesRoute = computed(() => ({
		name: 'desktopSettings',
		params: { tableView: 'distinctEntries' },
		query: filterQuery(filter.value),
	}))
	// The pattern is one search across both tabs (F13), so the Mappings link carries it too.
	const mappingsRoute = computed(() => ({
		name: 'desktopSettings',
		params: { tableView: 'mappings' },
		query: filterQuery(filter.value),
	}))

	const distinctEntriesTable = ref<InstanceType<typeof DesktopDistinctEntriesTable> | null>(null)
	const mappingsTable = ref<InstanceType<typeof DesktopMappingsTable> | null>(null)

	/** One handler writes the URL and reloads, so there is no watcher to race `edit()`'s push. */
	function applyFilter() {
		router.replace({ query: withTableParams(filterQuery(filter.value)) })
		// Whichever tab is mounted; the other ref is `null` (F13 — the Mappings tab's Filter was a no-op).
		distinctEntriesTable.value?.load()
		mappingsTable.value?.load()
	}

	/** Coverage is the view, not the rule pattern being cleared — it survives *Clear*, as the URL does. */
	function clearKeepingCoverage() {
		const coverage = filter.value.coverage
		clear()
		filter.value.coverage = coverage
	}

	/** The new rule's chips appear on reload; without it the rows keep reading *undecided*. */
	async function saveAndReload() {
		await saved()
		distinctEntriesTable.value?.load()
	}

	function edit(item: TrackerDesktopMappingResponse) {
		editedId.value = item.id
		request.value = new TrackerDesktopMappingRequest()
		// The update is a full replace: the row's own value, or an inactive rule re-activates on save (F72).
		request.value.isActive = item.isActive
		filter.value.processName = item.processName ?? undefined
		filter.value.processNameMatchType = item.processNameMatchType ?? PatternMatchType.Contains
		filter.value.productName = item.productName ?? undefined
		filter.value.productNameMatchType = item.productNameMatchType ?? PatternMatchType.Contains
		filter.value.windowTitle = item.windowTitle ?? undefined
		filter.value.windowTitleMatchType = item.windowTitleMatchType ?? PatternMatchType.Contains
		loadTarget(item)
		router.push(distinctEntriesRoute.value)
	}

	/** A rule toggled while it is loaded in the form: the form's copy follows, or *Save* would undo the toggle. */
	function onActiveChanged(id: number, isActive: boolean) {
		if (editedId.value === id) request.value.isActive = isActive
	}
</script>

<style scoped>
	/* The framework table's body is `height: 0` and fills a definite-height flex parent (FW4). Below
	   `md` the card has no definite height, so the table would collapse to its header; it takes the
	   height of its rows instead (F91). */
	.natural-height :deep(.v-table__wrapper) {
		height: auto !important;
	}
</style>
