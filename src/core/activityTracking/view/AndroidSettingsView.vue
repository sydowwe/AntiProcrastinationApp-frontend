<template>
	<div class="py-4 w-100 h-100">
		<VCard
			elevation="2"
			class="h-100 d-flex flex-column"
		>
			<div class="pa-4 pb-0 w-100 d-flex align-center ga-4">
				<VCardTitle class="pa-0">{{ $t('activityTracking.settings.androidTitle') }}</VCardTitle>
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
						{{ $t('activityTracking.settings.distinctEntries') }}
					</VBtn>
					<VBtn
						value="mappings"
						height="40"
						to="mappings"
					>
						{{ $t('activityTracking.settings.mappings') }}
					</VBtn>
				</VBtnToggle>
				<AndroidEntriesFilterBar
					v-model="filter"
					@filter="distinctEntriesTable?.load()"
				/>
			</div>
			<VCardText class="pt-1 d-flex flex-column ga-2">
				<DismissibleMappingHint storageKey="androidSettingsHintDismissed" />
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

	const { create, update } = useTrackerAndroidMappingCrud()
	const { filter, formData, mode, editedId, request, saved, clear } = useMappingSettings({
		filterFactory: () => new AndroidDistinctEntriesFilterRequest(),
		requestFactory: () => new TrackerAndroidMappingRequest(),
		create,
		update,
	})

	const route = useRoute()
	const tableView = computed<'distinctEntries' | 'mappings'>(() =>
		route.params.tableView === 'mappings' ? 'mappings' : 'distinctEntries',
	)

	const distinctEntriesTable = ref<InstanceType<typeof AndroidDistinctEntriesTable> | null>(null)
	const mappingsTable = ref<InstanceType<typeof AndroidMappingsTable> | null>(null)

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
		router.push({ name: 'androidSettings', params: { tableView: 'distinctEntries' } })
	}
</script>
