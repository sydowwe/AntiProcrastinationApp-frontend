<template>
	<div class="py-4 w-100 h-100">
		<VCard
			elevation="2"
			class="h-100 d-flex flex-column"
		>
			<!-- Wraps (F16): the filter bar drops to its own line when the row is too narrow, and the tab
			     toggle never shrinks, so its labels never truncate. -->
			<div class="pa-4 pb-0 w-100 d-flex flex-wrap align-center ga-4">
				<VCardTitle class="pa-0">{{ $t('activityTracking.settings.androidTitle') }}</VCardTitle>
				<VBtnToggle
					:modelValue="tableView"
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
				</VBtnToggle>
				<AndroidEntriesFilterBar
					v-model="filter"
					:patternError
					@filter="applyFilter"
				/>
			</div>
			<VCardText class="pt-1 flex-fill d-flex flex-column ga-2">
				<DismissibleMappingHint storageKey="androidSettingsHintDismissed" />
				<AndroidDistinctEntriesTable
					v-if="tableView === 'distinctEntries'"
					ref="distinctEntriesTable"
					v-model:mode="mode"
					v-model:formData="formData"
					:filter="filter"
					@clear="clearKeepingCoverage"
					@save="saveAndReload"
				/>
				<AndroidMappingsTable
					v-else-if="tableView === 'mappings'"
					ref="mappingsTable"
					:filter
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
	import { AndroidDistinctEntriesFilterRequest } from '@/core/activityTracking/dto/request/android/settings/AndroidDistinctEntriesFilterRequest.ts'
	import { TrackerAndroidMappingRequest } from '@/core/activityTracking/dto/request/android/settings/TrackerAndroidMappingRequest.ts'
	import { useTrackerAndroidMappingCrud } from '@/core/activityTracking/api/androidActivityTrackingApi.ts'
	import type { TrackerAndroidMappingResponse } from '@/core/activityTracking/dto/response/android/settings/TrackerAndroidMappingResponse.ts'
	import router from '@/router.ts'
	import AndroidEntriesFilterBar from '@/core/activityTracking/component/android/androidSettings/AndroidEntriesFilterBar.vue'
	import AndroidDistinctEntriesTable from '@/core/activityTracking/component/android/androidSettings/AndroidDistinctEntriesTable.vue'
	import AndroidMappingsTable from '@/core/activityTracking/component/android/androidSettings/AndroidMappingsTable.vue'
	import DismissibleMappingHint from '@/core/activityTracking/component/settings/DismissibleMappingHint.vue'
	import { useMappingSettings } from '@/core/activityTracking/composable/useMappingSettings.ts'
	import { useDistinctEntriesUrlState } from '@/core/activityTracking/composable/useDistinctEntriesUrlState.ts'

	const { create, update } = useTrackerAndroidMappingCrud()
	const { filter, formData, mode, editedId, request, patternError, saved, clear } = useMappingSettings({
		filterFactory: () => new AndroidDistinctEntriesFilterRequest(),
		requestFactory: () => new TrackerAndroidMappingRequest(),
		create,
		update,
	})

	const route = useRoute()
	const tableView = computed<'distinctEntries' | 'mappings'>(() =>
		route.params.tableView === 'mappings' ? 'mappings' : 'distinctEntries',
	)

	// The whole filter lives in the URL (B24, F15); the table reads it off `filter` like before.
	const { filterFromRoute, filterQuery, withTableParams, highlightedMappingId } =
		useDistinctEntriesUrlState<AndroidDistinctEntriesFilterRequest>(
			[
				{ text: 'appLabel', matchType: 'appLabelMatchType' },
				{ text: 'packageName', matchType: 'packageNameMatchType' },
			],
			() => new AndroidDistinctEntriesFilterRequest(),
		)
	filter.value = filterFromRoute()
	const distinctEntriesRoute = computed(() => ({
		name: 'androidSettings',
		params: { tableView: 'distinctEntries' },
		query: filterQuery(filter.value),
	}))
	// The pattern is one search across both tabs (F13), so the Mappings link carries it too.
	const mappingsRoute = computed(() => ({
		name: 'androidSettings',
		params: { tableView: 'mappings' },
		query: filterQuery(filter.value),
	}))

	const distinctEntriesTable = ref<InstanceType<typeof AndroidDistinctEntriesTable> | null>(null)
	const mappingsTable = ref<InstanceType<typeof AndroidMappingsTable> | null>(null)

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

	function edit(item: TrackerAndroidMappingResponse) {
		editedId.value = item.id
		request.value = new TrackerAndroidMappingRequest()
		// The update is a full replace: the row's own value, or an inactive rule re-activates on save (F72).
		request.value.isActive = item.isActive
		filter.value.appLabel = item.appLabel ?? undefined
		filter.value.appLabelMatchType = item.appLabelMatchType ?? filter.value.appLabelMatchType
		filter.value.packageName = item.packageName ?? undefined
		filter.value.packageNameMatchType = item.packageNameMatchType ?? filter.value.packageNameMatchType
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
