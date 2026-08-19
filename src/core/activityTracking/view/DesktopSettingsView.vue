<template>
	<div class="py-4 w-100 h-100">
		<VCard
			elevation="2"
			class="h-100 d-flex flex-column"
		>
			<div class="pa-4 pb-0 w-100 d-flex align-center ga-4">
				<VCardTitle class="pa-0">Distinct Process Entries</VCardTitle>
				<VBtnToggle
					:modelValue="tableView"
					mandatory
					density="compact"
					color="primaryOutline"
					variant="outlined"
					style="border-color: rgba(var(--v-theme-on-surface), 0.3) !important; height: 40px"
				>
					<VBtn
						value="distinctEntries"
						height="40"
						to="distinctEntries"
					>
						Distinct entries
					</VBtn>
					<VBtn
						value="mappings"
						height="40"
						to="mappings"
					>
						Mappings
					</VBtn>
				</VBtnToggle>
				<DesktopEntriesFilterBar
					v-model="filter"
					@filter="distinctEntriesTable?.load()"
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
					@clear="clear"
					@save="saved"
				/>
				<DesktopMappingsTable
					v-else-if="tableView === 'mappings'"
					ref="mappingsTable"
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
	import router from '@/router.ts'
	import DesktopEntriesFilterBar from '@/core/activityTracking/component/desktop/desktopSettings/DesktopEntriesFilterBar.vue'
	import DesktopDistinctEntriesTable from '@/core/activityTracking/component/desktop/desktopSettings/DesktopDistinctEntriesTable.vue'
	import DesktopMappingsTable from '@/core/activityTracking/component/desktop/desktopSettings/DesktopMappingsTable.vue'
	import DismissibleMappingHint from '@/core/activityTracking/component/settings/DismissibleMappingHint.vue'
	import { useMappingSettings } from '@/core/activityTracking/composable/useMappingSettings.ts'

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

	const distinctEntriesTable = ref<InstanceType<typeof DesktopDistinctEntriesTable> | null>(null)
	const mappingsTable = ref<InstanceType<typeof DesktopMappingsTable> | null>(null)

	function edit(item: TrackerDesktopMappingResponse) {
		editedId.value = item.id
		request.value = new TrackerDesktopMappingRequest()
		filter.value.processName = item.processName
		filter.value.processNameMatchType = item.processNameMatchType
		filter.value.productName = item.productName
		filter.value.productNameMatchType = item.productNameMatchType
		filter.value.windowTitle = item.windowTitle
		filter.value.windowTitleMatchType = item.windowTitleMatchType
		if (item.activity) {
			formData.value.activityId = item.activity.id
			formData.value.roleId = item.activity.roleId
			formData.value.categoryId = item.activity.categoryId
			mode.value = 'toActivity'
		} else {
			mode.value = 'toIgnored'
		}
		router.push({ name: 'desktopSettings', params: { tableView: 'distinctEntries' } })
	}
</script>
