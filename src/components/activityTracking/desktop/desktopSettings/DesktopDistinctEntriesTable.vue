<template>
<VCard elevation="2" class="h-100 d-flex flex-column">
	<div class="pa-4 pb-0 w-100 d-flex align-center ga-16">
		<VCardTitle class="pa-0">Distinct Process Entries</VCardTitle>
		<div class="flex-fill d-flex flex-column flex-md-row align-md-center ga-3 ga-md-4">
			<MergedInputs>
				<template #first>
					<VTextField
						v-model="filter.processName"
						label="Process Name"
						density="compact"
						hideDetails
						clearable
						@keyup.enter="loadItems"
					/>
				</template>
				<template #second>
					<VSelect
						v-model="filter.processNameMatchType"
						:items="matchTypeOptions"
						density="compact"
						hideDetails
						style="max-width: 130px"
					/>
				</template>
			</MergedInputs>
			<MergedInputs>
				<template #first>
					<VTextField
						v-model="filter.productName"
						label="Product Name"
						density="compact"
						hideDetails
						clearable
						@keyup.enter="loadItems"
					/>
				</template>
				<template #second>
					<VSelect
						v-model="filter.productNameMatchType"
						:items="matchTypeOptions"
						density="compact"
						hideDetails
						style="max-width: 130px"
					/>
				</template>
			</MergedInputs>
			<MergedInputs>
				<template #first>
					<VTextField
						v-model="filter.windowTitle"
						label="Window Title"
						density="compact"
						hideDetails
						clearable
						@keyup.enter="loadItems"
					/>
				</template>
				<template #second>
					<VSelect
						v-model="filter.windowTitleMatchType"
						:items="matchTypeOptions"
						density="compact"
						hideDetails
						style="max-width: 130px"
					/>
				</template>
			</MergedInputs>
			<VBtn color="primary" prependIcon="magnifying-glass" @click="loadItems">Filter</VBtn>
		</div>
	</div>
	<VCardText class="d-flex flex-column ga-3">
		<div class="ml-auto d-flex flex-column flex-md-row align-md-center ga-3 ga-md-4">
			<RoleCategoryForm v-if="mode === 'toRoleOrCategory'" v-model="request"></RoleCategoryForm>

			<VBtnToggle
				v-model="mode"
				mandatory
				density="compact"
				color="primaryOutline"
				variant="outlined"
				style="border-color: rgba(var(--v-theme-on-surface), 0.3) !important; height: 40px"
			>
				<VBtn value="toRoleOrCategory" height="40">
					To role or category
				</VBtn>
				<VBtn value="toActivity" height="40">
					To activity
				</VBtn>
				<VBtn value="toIgnored" height="40">
					To ignored
				</VBtn>
			</VBtnToggle>
			<VBtn v-if="mode !== 'view'" color="secondary" prependIcon="check" @click="loadItems">Save</VBtn>
		</div>

		<DataTable
			v-model="items"
			v-model:itemsPerPage="itemsPerPage"
			v-model:page="page"
			v-model:sortBy="sortBy"
			v-model:loading="loading"
			:columns="columns"
			:itemsLength="totalItems"
			:showActions="false"
			@onLoadItems="loadItems"
		/>
	</VCardText>
</VCard>
</template>

<script setup lang="ts">
import {ref} from 'vue';
import {useSnackbar} from '@/composables/general/SnackbarComposable.ts';
import {useFetchFilteredTable} from '@/composables/general/CrudComposition.ts';
import MergedInputs from '@/components/general/MergedInputs.vue';
import DataTable from '@/components/general/dataTable/DataTable.vue';
import {FilteredTableRequest} from '@/dtos/request/base/FilteredTableRequest.ts';
import {TrackerDesktopDistinctEntriesResponse} from '@/dtos/response/activityTracking/desktop/TrackerDesktopDistinctEntriesResponse.ts';
import {PatternMatchType} from '@/dtos/enum/PatternMatchType.ts';
import {DesktopDistinctEntriesFilterRequest} from '@/dtos/request/activityTracking/desktop/DesktopDistinctEntriesFilterRequest.ts';
import {VSortItem} from '@/dtos/dto/VSortItem.ts';
import {TableColumn} from '@/dtos/dto/TableColumn.ts';
import RoleCategoryForm from '@/components/activityTracking/desktop/desktopSettings/RoleCategoryForm.vue';
import {TrackerDesktopMappingRequest} from '@/dtos/request/activityTracking/desktop/TrackerDesktopMappingRequest.ts';

const {showErrorSnackbar} = useSnackbar();
const {loading, fetchFilteredTable} = useFetchFilteredTable(TrackerDesktopDistinctEntriesResponse, 'activity-tracking/desktop');

const matchTypeOptions: PatternMatchType[] = [PatternMatchType.Exact, PatternMatchType.Wildcard, PatternMatchType.Contains, PatternMatchType.Regex];

const columns = [
	new TableColumn('processName', 'Process Name'),
	new TableColumn('productName', 'Product Name'),
	new TableColumn('windowTitle', 'Window Title'),
];

const items = ref<TrackerDesktopDistinctEntriesResponse[]>([]);
const totalItems = ref(0);
const itemsPerPage = ref(25);
const page = ref(1);
const sortBy = ref<VSortItem[]>([new VSortItem('productName', 'asc')]);
const filter = ref(new DesktopDistinctEntriesFilterRequest());

const request = ref<TrackerDesktopMappingRequest>(new TrackerDesktopMappingRequest(filter.value))

const mode = ref<'view' | 'toRoleOrCategory' | 'toActivity' | 'toIgnored'>('toRoleOrCategory');

async function loadItems() {
	const request = new FilteredTableRequest<DesktopDistinctEntriesFilterRequest>(
		itemsPerPage.value,
		page.value,
		sortBy.value,
		true,
		filter.value,
	);
	try {
		const result = await fetchFilteredTable(request);
		items.value = result.items;
		totalItems.value = result.itemsCount;
	} catch {
		showErrorSnackbar('Failed to load distinct entries');
	}
}

function saved() {

}

</script>
