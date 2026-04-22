<template>
	<div class="py-4 w-100 h-100">
		<VCard
			elevation="2"
			class="h-100 d-flex flex-column"
		>
			<div class="pa-4 pb-0 w-100 d-flex align-center ga-4">
				<VCardTitle class="pa-0">Distinct Process Entries</VCardTitle>
				<VBtnToggle
					v-model="tableView"
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
				<VAlert
					v-if="!hintDismissed"
					type="info"
					variant="tonal"
					closable
					@click:close="dismissHint"
				>
					Use the filter fields to define a matching pattern, then choose an activity or mark as ignored and
					click
					<strong>Save</strong>
					. The filter becomes the rule — future entries matching it will be mapped automatically. To edit an
					existing rule, open the
					<strong>Mappings</strong>
					tab and click edit.
				</VAlert>
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
	import { onMounted, ref, watch } from 'vue'
	import { useSnackbar } from '@/composables/general/SnackbarComposable.ts'
	import { DesktopDistinctEntriesFilterRequest } from '@/dtos/request/activityTracking/desktop/settings/DesktopDistinctEntriesFilterRequest.ts'
	import { TrackerDesktopMappingRequest } from '@/dtos/request/activityTracking/desktop/settings/TrackerDesktopMappingRequest.ts'
	import { useTrackerDesktopMappingCrud } from '@/api/desktopActivityTrackingApi.ts'
	import { ActivityFormRequest } from '@/dtos/request/activity/ActivityFormRequest.ts'
	import type { TrackerDesktopMappingResponse } from '@/dtos/response/activityTracking/desktop/settings/TrackerDesktopMappingResponse.ts'
	import router from '@/plugins/router.ts'
	import DesktopEntriesFilterBar from '@/components/activityTracking/desktop/desktopSettings/DesktopEntriesFilterBar.vue'
	import DesktopDistinctEntriesTable from '@/components/activityTracking/desktop/desktopSettings/DesktopDistinctEntriesTable.vue'
	import DesktopMappingsTable from '@/components/activityTracking/desktop/desktopSettings/DesktopMappingsTable.vue'

	const HINT_KEY = 'desktopSettingsHintDismissed'
	const hintDismissed = ref(localStorage.getItem(HINT_KEY) === 'true')

	function dismissHint() {
		hintDismissed.value = true
		localStorage.setItem(HINT_KEY, 'true')
	}

	const { showErrorSnackbar } = useSnackbar()
	const { create, update } = useTrackerDesktopMappingCrud()

	const tableView = ref<'distinctEntries' | 'mappings'>('distinctEntries')
	const filter = ref(new DesktopDistinctEntriesFilterRequest())
	const formData = ref(new ActivityFormRequest())
	const mode = ref<'toActivity' | 'toIgnored'>('toActivity')
	const editedId = ref<number | null>(null)
	const request = ref(new TrackerDesktopMappingRequest())

	const distinctEntriesTable = ref<InstanceType<typeof DesktopDistinctEntriesTable> | null>(null)
	const mappingsTable = ref<InstanceType<typeof DesktopMappingsTable> | null>(null)

	onMounted(() => {
		tableView.value = router.currentRoute.value.params.tableView as 'distinctEntries' | 'mappings'
	})

	watch(
		formData,
		newValue => {
			request.value.activityId = newValue.activityId
		},
		{ deep: true },
	)

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
		tableView.value = 'distinctEntries'
		router.push({ name: 'desktopSettings', params: { tableView: 'distinctEntries' } })
	}

	async function saved() {
		request.value.updatePattern(filter.value)
		try {
			if (editedId.value) {
				await update(editedId.value, request.value)
			} else {
				await create(request.value)
			}
			request.value = new TrackerDesktopMappingRequest()
		} catch {
			showErrorSnackbar('Failed to save mapping')
		}
	}

	function clear() {
		editedId.value = null
		filter.value = new DesktopDistinctEntriesFilterRequest()
		mode.value = 'toActivity'
		request.value = new TrackerDesktopMappingRequest()
		formData.value = new ActivityFormRequest()
	}
</script>
