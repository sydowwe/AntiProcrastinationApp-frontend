<template>
<VCard elevation="2" class="h-100 d-flex flex-column">
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
			<VBtn value="distinctEntries" height="40" to="distinctEntries">
				Distinct entries
			</VBtn>
			<VBtn value="mappings" height="40" to="mappings">
				Mappings
			</VBtn>
		</VBtnToggle>
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
	<VCardText class="pt-1 d-flex flex-column ga-2">
		<div v-if="tableView === 'distinctEntries'" class="d-flex flex-column justify-md-end flex-md-row align-md-center ga-3 ga-md-4">
			<!--			<RoleCategoryForm v-if="mode === 'toRoleOrCategory'" v-model="request"></RoleCategoryForm>-->
			<div v-if="mode === 'toActivity'" class="flex-fill">
				<ActivitySelectionForm :showFromToDoListField="false" :isInRow="true" v-model="formData"></ActivitySelectionForm>
			</div>
			<VBtn color="error" @click="clear" prependIcon="broom" variant="tonal">Clear</VBtn>
			<VBtnToggle
				v-model="mode"
				mandatory
				density="compact"
				class="my-4"
				color="primaryOutline"
				variant="outlined"
				style="border-color: rgba(var(--v-theme-on-surface), 0.3) !important; height: 40px"
			>
				<!--				<VBtn value="toRoleOrCategory" height="40">-->
				<!--					To role or category-->
				<!--				</VBtn>-->
				<VBtn value="toActivity" height="40">
					To activity
				</VBtn>
				<VBtn value="toIgnored" height="40">
					To ignored
				</VBtn>
			</VBtnToggle>
			<VBtn color="secondary" prependIcon="check" @click="saved">Save</VBtn>
		</div>

		<div v-else-if="tableView === 'mappings'" class="d-flex flex-column flex-md-row align-md-center ga-3 ga-md-4">
			<NullFalseTrueCheckbox v-model="mappingFilter.isActive" label="Is active" hideDetails></NullFalseTrueCheckbox>
			<VSelect label="Type" v-model="mappingFilter.type" :items="TrackerDesktopMappingTypeOptions" density="compact" hideDetails maxWidth="150"></VSelect>
			<NullFalseTrueCheckbox v-if="mappingFilter.type === 'Ignored'" v-model="mappingFilter.isIgnored" label="Is ignored" hideDetails></NullFalseTrueCheckbox>
			<ActivitySelectionForm v-else-if="mappingFilter.type === 'Activity'" class="flex-fill" :showFromToDoListField="false" :isInRow="true"
			                       v-model="formData" isFilter></ActivitySelectionForm>
		</div>

		<DataTable
			v-if="tableView === 'distinctEntries'"
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

		<BasicTable
			v-else-if="tableView === 'mappings'"
			v-model="mappings"
			v-model:itemsPerPage="itemsPerPageMappings"
			v-model:page="pageMappings"
			v-model:sortBy="sortByMappings"
			v-model:loading="mappingsLoading"
			:columns="columnsMappings"
			:itemsLength="totalItemsMappings"
			:showActionsHeader="false"
			@onLoadItems="loadMappings"
			@onEdit="edit"
		/>
	</VCardText>
</VCard>
</template>

<script setup lang="ts">
import {onMounted, ref, watch} from 'vue';
import {useSnackbar} from '@/composables/general/SnackbarComposable.ts';
import MergedInputs from '@/components/general/MergedInputs.vue';
import DataTable from '@/components/general/dataTable/DataTable.vue';
import {FilteredTableRequest} from '@/dtos/request/base/FilteredTableRequest.ts';
import {TrackerDesktopDistinctEntriesResponse} from '@/dtos/response/activityTracking/desktop/settings/TrackerDesktopDistinctEntriesResponse.ts';
import {PatternMatchType} from '@/dtos/enum/PatternMatchType.ts';
import {DesktopDistinctEntriesFilterRequest} from '@/dtos/request/activityTracking/desktop/settings/DesktopDistinctEntriesFilterRequest.ts';
import {VSortItem} from '@/dtos/dto/VSortItem.ts';
import {TableColumn} from '@/dtos/dto/TableColumn.ts';
import {useFetchFilteredTable} from '@/api/fetchFilteredTable.ts';
import ActivitySelectionForm from '@/components/ActivitySelectionForm.vue';
import {TrackerDesktopMappingRequest} from '@/dtos/request/activityTracking/desktop/settings/TrackerDesktopMappingRequest.ts';
import {useTrackerDesktopMappingCrud} from '@/api/desktopActivityTrackingApi.ts';
import router from '@/plugins/router.ts';
import type {TrackerDesktopMappingResponse} from '@/dtos/response/activityTracking/desktop/settings/TrackerDesktopMappingResponse.ts';
import BasicTable from '@/components/general/dataTable/BasicTable.vue';
import {TrackerDesktopMappingsFilter} from '@/dtos/request/activityTracking/desktop/settings/TrackerDesktopMappingsFilter.ts';
import {TrackerDesktopMappingTypeOptions} from '@/dtos/enum/TrackerDesktopMappingTypeEnum.ts';
import NullFalseTrueCheckbox from '@/components/general/inputs/NullFalseTrueCheckbox.vue';
import {ActivityFormRequest} from '@/dtos/request/activity/ActivityFormRequest.ts';

const {showErrorSnackbar} = useSnackbar();
const {loading, fetchFilteredTable} = useFetchFilteredTable(TrackerDesktopDistinctEntriesResponse, 'activity-tracking/desktop');
const {create, update, deleteEntity, fetchFilteredTable: fetchFilteredTableMappings, tableLoading: mappingsLoading} = useTrackerDesktopMappingCrud()

const matchTypeOptions: PatternMatchType[] = [PatternMatchType.Exact, PatternMatchType.Wildcard, PatternMatchType.Contains, PatternMatchType.Regex];

const columns = [
	new TableColumn('processName', 'Process Name'),
	new TableColumn('productName', 'Product Name'),
	new TableColumn('windowTitle', 'Window Title'),
];

const tableView = ref<'distinctEntries' | 'mappings'>('distinctEntries');

onMounted(() => {
	tableView.value = router.currentRoute.value.params.tableView as 'distinctEntries' | 'mappings';
})
watch(tableView, (newValue) => {
	if (newValue === 'distinctEntries') {
		loadItems();
	} else if (newValue === 'mappings') {
		loadMappings();
	}
})

const formData = ref<ActivityFormRequest>(new ActivityFormRequest());

const items = ref<TrackerDesktopDistinctEntriesResponse[]>([]);
const totalItems = ref(0);
const itemsPerPage = ref(25);
const page = ref(1);
const sortBy = ref<VSortItem[]>([new VSortItem('productName', 'asc')]);

const mappings = ref<TrackerDesktopMappingResponse[]>([]);
const totalItemsMappings = ref(0);
const itemsPerPageMappings = ref(25);
const pageMappings = ref(1);
const sortByMappings = ref<VSortItem[]>([new VSortItem('productName', 'asc')]);
const columnsMappings = [
	new TableColumn('isActive', 'Is active'),
	new TableColumn('processName', 'Process Name'),
	new TableColumn('processNameMatchType', 'Match type'),
	new TableColumn('productName', 'Product Name'),
	new TableColumn('productNameMatchType', 'Match type'),
	new TableColumn('windowTitle', 'Window Title'),
	new TableColumn('windowTitleMatchType', 'Match type'),
	new TableColumn('activity.text', 'Activity'),
	new TableColumn('isIgnored', 'Is ignored'),
];
const mappingFilter = ref(new TrackerDesktopMappingsFilter());

const filter = ref(new DesktopDistinctEntriesFilterRequest());

const request = ref<TrackerDesktopMappingRequest>(new TrackerDesktopMappingRequest())
const editedId = ref<number | null>();

const mode = ref</*>'toRoleOrCategory' | */'toActivity' | 'toIgnored'>('toActivity');

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

async function loadMappings() {
	const request = new FilteredTableRequest<TrackerDesktopMappingsFilter>(
		itemsPerPageMappings.value,
		pageMappings.value,
		sortByMappings.value,
		true,
		mappingFilter.value,
	);

	try {
		const result = await fetchFilteredTableMappings(request);
		mappings.value = result.items;
		totalItemsMappings.value = result.itemsCount;
	} catch {
		showErrorSnackbar('Failed to load distinct entries');
	}
}

function edit(item: TrackerDesktopMappingResponse) {
	editedId.value = item.id;
	request.value = new TrackerDesktopMappingRequest();
	filter.value.processName = item.processName;
	filter.value.processNameMatchType = item.processNameMatchType;
	filter.value.productName = item.productName;
	filter.value.productNameMatchType = item.productNameMatchType;
	filter.value.windowTitle = item.windowTitle;
	filter.value.windowTitleMatchType = item.windowTitleMatchType;
	if (item.activity) {
		formData.value.activityId = item.activity.id;
		formData.value.roleId = item.activity.roleId;
		formData.value.categoryId = item.activity.categoryId;
		console.log(formData.value)
		console.log(item.activity)
		mode.value = 'toActivity';
	} else {
		mode.value = 'toIgnored';
	}
	tableView.value = 'distinctEntries';
	router.push({name: 'desktopSettings', params: {tableView: 'distinctEntries'}});
}

async function saved() {
	request.value.updatePattern(filter.value);
	if (editedId.value) {
		await update(editedId.value, request.value);
	} else {
		await create(request.value);
	}
	request.value = new TrackerDesktopMappingRequest();
}

function clear() {
	editedId.value = null;
	filter.value = new DesktopDistinctEntriesFilterRequest();
	mode.value = 'toActivity';
	mappingFilter.value = new TrackerDesktopMappingsFilter();
	request.value = new TrackerDesktopMappingRequest();
	formData.value = new ActivityFormRequest();
}

watch(formData, (newValue) => {
	request.value.activityId = newValue.activityId;
}, {deep: true})
</script>
