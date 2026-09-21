<template>
	<div class="py-4 w-100 h-100">
		<VCard
			elevation="2"
			class="h-100 d-flex flex-column"
		>
			<!-- Wraps (F16): the filter bar drops to its own line when the row is too narrow, and the tab
			     toggle never shrinks, so its labels never truncate. -->
			<div class="pa-4 pb-0 w-100 d-flex flex-wrap align-center ga-4">
				<VCardTitle class="pa-0">{{ $t('activityTracking.settings.desktopTitle') }}</VCardTitle>
				<VBtnToggle
					:modelValue="tableView"
					mandatory
					density="compact"
					color="primaryOutline"
					variant="outlined"
					style="border-color: rgba(var(--v-theme-on-surface), 0.3) !important; height: 40px; flex-shrink: 0"
				>
					<!-- The tab links carry the coverage so switching tabs and back keeps the chosen view. -->
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
						:to="{ name: 'desktopSettings', params: { tableView: 'mappings' } }"
					>
						{{ $t('activityTracking.settings.mappings') }}
					</VBtn>
				</VBtnToggle>
				<DesktopEntriesFilterBar
					v-model="filter"
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
					@clear="clearKeepingCoverage"
					@save="saveAndReload"
				/>
				<DesktopMappingsTable
					v-else-if="tableView === 'mappings'"
					ref="mappingsTable"
					:highlightedId="highlightedMappingId"
					@edit="edit"
				/>
			</VCardText>
		</VCard>
	</div>
</template>

<script setup lang="ts">
	import { computed, ref } from 'vue'
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
	import { useCoverageUrlState } from '@/core/activityTracking/composable/useCoverageUrlState.ts'

	const { create, update } = useTrackerDesktopMappingCrud()
	const { filter, formData, mode, editedId, request, saved, clear } = useMappingSettings({
		filterFactory: () => new DesktopDistinctEntriesFilterRequest(),
		requestFactory: () => new TrackerDesktopMappingRequest(),
		create,
		update,
	})

	const route = useRoute()
	const tableView = computed<'distinctEntries' | 'mappings'>(() =>
		route.params.tableView === 'mappings' ? 'mappings' : 'distinctEntries',
	)

	// `coverage` lives in the URL (B24); the table reads it off `filter` like every other field.
	const { coverageFromRoute, highlightedMappingId, coverageQuery } = useCoverageUrlState()
	filter.value.coverage = coverageFromRoute.value
	const distinctEntriesRoute = computed(() => ({
		name: 'desktopSettings',
		params: { tableView: 'distinctEntries' },
		query: coverageQuery(filter.value.coverage),
	}))

	const distinctEntriesTable = ref<InstanceType<typeof DesktopDistinctEntriesTable> | null>(null)
	const mappingsTable = ref<InstanceType<typeof DesktopMappingsTable> | null>(null)

	/** One handler writes the URL and reloads, so there is no watcher to race `edit()`'s push. */
	function applyFilter() {
		router.replace({ query: coverageQuery(filter.value.coverage) })
		distinctEntriesTable.value?.load()
	}

	/** Coverage is the view, not the rule pattern being cleared — it survives *Clear*, as the URL does. */
	function clearKeepingCoverage() {
		clear()
		filter.value.coverage = coverageFromRoute.value
	}

	/** The new rule's chips appear on reload; without it the rows keep reading *undecided*. */
	async function saveAndReload() {
		await saved()
		distinctEntriesTable.value?.load()
	}

	function edit(item: TrackerDesktopMappingResponse) {
		editedId.value = item.id
		request.value = new TrackerDesktopMappingRequest()
		filter.value.processName = item.processName ?? undefined
		filter.value.processNameMatchType = item.processNameMatchType ?? PatternMatchType.Contains
		filter.value.productName = item.productName ?? undefined
		filter.value.productNameMatchType = item.productNameMatchType ?? PatternMatchType.Contains
		filter.value.windowTitle = item.windowTitle ?? undefined
		filter.value.windowTitleMatchType = item.windowTitleMatchType ?? PatternMatchType.Contains
		if (item.activity) {
			formData.value.activityId = item.activity.id
			formData.value.roleId = item.activity.roleId
			formData.value.categoryId = item.activity.categoryId
			mode.value = 'toActivity'
		} else {
			mode.value = 'toIgnored'
		}
		router.push(distinctEntriesRoute.value)
	}
</script>
