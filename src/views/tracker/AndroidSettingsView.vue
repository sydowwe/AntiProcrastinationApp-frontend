<template>
	<div class="py-4 w-100 h-100">
		<VCard
			elevation="2"
			class="h-100 d-flex flex-column"
		>
			<div class="pa-4 pb-0 w-100 d-flex align-center ga-4">
				<VCardTitle class="pa-0">Distinct App Entries</VCardTitle>
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
				<AndroidEntriesFilterBar
					v-model="filter"
					@filter="distinctEntriesTable?.load()"
				/>
			</div>
			<VCardText class="pt-1 d-flex flex-column ga-2">
				<VAlert
					v-if="!hintDismissed"
					type="info"
					variant="tonal"
					closable
					@click:close="dismissHint"
				>
					Use the filter fields to define a matching pattern, then choose an activity or mark as ignored and click
					<strong>Save</strong>. The filter becomes the rule — future entries matching it will be mapped automatically. To
					edit an existing rule, open the <strong>Mappings</strong> tab and click edit.
				</VAlert>
				<AndroidDistinctEntriesTable
					v-if="tableView === 'distinctEntries'"
					ref="distinctEntriesTable"
					v-model:mode="mode"
					v-model:formData="formData"
					:filter="filter"
					@clear="clear"
					@save="saved"
				/>
				<AndroidMappingsTable
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

	const HINT_KEY = 'androidSettingsHintDismissed'
	const hintDismissed = ref(localStorage.getItem(HINT_KEY) === 'true')

	function dismissHint() {
		hintDismissed.value = true
		localStorage.setItem(HINT_KEY, 'true')
	}
	import { useSnackbar } from '@/composables/general/SnackbarComposable.ts'
	import { AndroidDistinctEntriesFilterRequest } from '@/dtos/request/activityTracking/android/settings/AndroidDistinctEntriesFilterRequest.ts'
	import { TrackerAndroidMappingRequest } from '@/dtos/request/activityTracking/android/settings/TrackerAndroidMappingRequest.ts'
	import { useTrackerAndroidMappingCrud } from '@/api/androidActivityTrackingApi.ts'
	import { ActivityFormRequest } from '@/dtos/request/activity/ActivityFormRequest.ts'
	import type { TrackerAndroidMappingResponse } from '@/dtos/response/activityTracking/android/settings/TrackerAndroidMappingResponse.ts'
	import router from '@/plugins/router.ts'
	import AndroidEntriesFilterBar from '@/components/activityTracking/android/androidSettings/AndroidEntriesFilterBar.vue'
	import AndroidDistinctEntriesTable from '@/components/activityTracking/android/androidSettings/AndroidDistinctEntriesTable.vue'
	import AndroidMappingsTable from '@/components/activityTracking/android/androidSettings/AndroidMappingsTable.vue'

	const { showErrorSnackbar } = useSnackbar()
	const { create, update } = useTrackerAndroidMappingCrud()

	const tableView = ref<'distinctEntries' | 'mappings'>('distinctEntries')
	const filter = ref(new AndroidDistinctEntriesFilterRequest())
	const formData = ref(new ActivityFormRequest())
	const mode = ref<'toActivity' | 'toIgnored'>('toActivity')
	const editedId = ref<number | null>(null)
	const request = ref(new TrackerAndroidMappingRequest())

	const distinctEntriesTable = ref<InstanceType<typeof AndroidDistinctEntriesTable> | null>(null)
	const mappingsTable = ref<InstanceType<typeof AndroidMappingsTable> | null>(null)

	onMounted(() => {
		tableView.value = router.currentRoute.value.params.tableView as 'distinctEntries' | 'mappings'
	})

	function edit(item: TrackerAndroidMappingResponse) {
		editedId.value = item.id
		request.value = new TrackerAndroidMappingRequest()
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
		tableView.value = 'distinctEntries'
		router.push({ name: 'androidSettings', params: { tableView: 'distinctEntries' } })
	}

	async function saved() {
		request.value.updatePattern(filter.value)
		request.value.activityId = formData.value.activityId
		request.value.roleId = formData.value.roleId
		request.value.categoryId = formData.value.categoryId
		try {
			if (editedId.value) {
				await update(editedId.value, request.value)
			} else {
				await create(request.value)
			}
			request.value = new TrackerAndroidMappingRequest()
		} catch {
			showErrorSnackbar('Failed to save mapping')
		}
	}

	function clear() {
		editedId.value = null
		filter.value = new AndroidDistinctEntriesFilterRequest()
		mode.value = 'toActivity'
		request.value = new TrackerAndroidMappingRequest()
		formData.value = new ActivityFormRequest()
	}
</script>
