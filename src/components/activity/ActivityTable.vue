<template>
<BasicTable
	v-model="items"
	v-model:itemsPerPage="itemsPerPage"
	v-model:page="page"
	v-model:sortBy="sortBy"
	v-model:loading="loading"
	:columns
	:itemsLength
	:showActions="true"
	@onLoadItems="loadItems"
	@onAdd="activityDialog.openAddDialog()"
	@onEdit="onEdit"
	@onDelete="onDelete"
>
	<template v-slot:formattedColumn="{ key, value }">
		<template v-if="key === 'role.name' || key === 'category.name'">
			<span>{{ value ?? '—' }}</span>
		</template>
		<template v-else-if="key === 'isUnavoidable'">
			<VIcon :color="value ? 'successDark' : 'grey'" :icon="value ? 'check' : 'xmark'" size="16" />
		</template>
		<template v-else>{{ value ?? '—' }}</template>
	</template>
</BasicTable>

<ActivityDialog ref="activityDialog" @created="loadItems" @updated="loadItems" />
</template>

<script setup lang="ts">
import {ref, watch} from 'vue';
import BasicTable from '@/components/general/dataTable/BasicTable.vue';
import ActivityDialog from '@/components/dialogs/activity/ActivityDialog.vue';
import {Activity} from '@/dtos/response/activity/Activity.ts';
import {TableColumn} from '@/dtos/dto/TableColumn.ts';
import {VSortItem} from '@/dtos/dto/VSortItem.ts';
import {FilteredTableRequest} from '@/dtos/request/base/FilteredTableRequest.ts';
import {ActivityFilter} from '@/dtos/request/activity/ActivityFilter.ts';
import {useFetchFilteredTable} from '@/api/fetchFilteredTable.ts';
import {useActivityCrud} from '@/api/ConcretesCrudComposable.ts';

const props = defineProps<{ filter: ActivityFilter }>();

const {fetchFilteredTable, loading} = useFetchFilteredTable<Activity, ActivityFilter>(Activity, 'activity');
const {deleteEntity} = useActivityCrud();

const items = ref<Activity[]>([]);
const itemsLength = ref(0);
const itemsPerPage = ref(10);
const page = ref(1);
const sortBy = ref<VSortItem[]>([]);

const activityDialog = ref<InstanceType<typeof ActivityDialog>>();

const columns: TableColumn[] = [
	new TableColumn('name', 'Name'),
	new TableColumn('role.name', 'Role', false),
	new TableColumn('category.name', 'Category', false),
	new TableColumn('text', 'Text', false),
	new TableColumn('isUnavoidable', 'Unavoidable', false),
];

watch(() => props.filter, () => {
	page.value = 1;
	loadItems();
}, {deep: true});

async function loadItems() {
	const f = props.filter;
	const hasFilter = !!f.name || !!f.text || !!f.roleName || !!f.roleIds?.length || !!f.categoryName || !!f.categoryIds?.length;
	const request = new FilteredTableRequest<ActivityFilter>(
		itemsPerPage.value,
		page.value,
		sortBy.value,
		hasFilter,
		hasFilter ? f : null,
	);
	const result = await fetchFilteredTable(request);
	items.value = result.items;
	itemsLength.value = result.itemsCount;
}

function onEdit(item: Activity) {
	activityDialog.value!.openEditDialog(item);
}

async function onDelete(item: Activity) {
	await deleteEntity(item.id);
	await loadItems();
}
</script>
