<template>
<MyTable v-model="items" v-model:page="page" v-model:items-per-page="itemsPerPage" v-model:sort-by="sortBy"
         :columns :itemsLength :loading @on-load-items="loadItems"
         @onAdd="$refs.dialog.openAddDialog()"
         @onEdit="item=> $refs.dialog.openEditDialog(item.text)" @onDelete="deleteLoanScale">
	<template v-slot:filter>
		<VTextField
			v-model="filter.text"
			max-width="350"
			density="compact"
			label="Text"
		>
		</VTextField>
	</template>
</MyTable>
<LookupDialog ref="dialog" :entityName @created="onCreated"></LookupDialog>
</template>

<script setup lang="ts">
import {computed, onMounted, ref} from 'vue';
import {FilteredTableRequest, SortByRequest, TableColumn, VSortItem} from '@/classes/Generic.ts';
import MyTable from '@/components/general/tableGrid/MyTable.vue';
import LookupDialog from '@/components/dialogs/general/LookupDialog.vue';
import {LookupFilterRequest, LookupResponse} from '@/classes/SelectOption.ts';
import {useScaleModelStore} from '@/stores/scaleModelStore.ts';
import {useProductTypeStore} from '@/stores/productTypeStore.ts';
import {useSparePartStore} from '@/stores/sparePartStore.ts';

const scaleModelStore = useScaleModelStore();
const productTypeStore = useProductTypeStore();
const sparePartStore = useSparePartStore();

const props = defineProps<{
	entityName: string
}>()
const store = computed(() => {
	switch (props.entityName) {
		case 'scale-model':
			return scaleModelStore;
		case 'product-type':
			return productTypeStore;
		case 'spare-part':
			return sparePartStore;
		default:
			throw new Error('Unknown entity name');
	}
})

const loading = ref(false);

const page = ref(1);
const itemsPerPage = ref(10);
const sortBy = ref<VSortItem[]>([]);
const itemsLength = ref(0);
const items = ref<LookupResponse[]>([]);
const filter = ref<LookupFilterRequest>(new LookupFilterRequest());

const columns = [
	new TableColumn('text', 'Text'),
	// new TableColumn('sortOrder', 'Poradie'),
];

onMounted(async () => {
	await loadItems();
});


function onCreated(newItem: LookupResponse) {
	items.value.splice(0, 0, newItem);
}

function onUpdated(updatedId: number, updatedItem: LookupResponse) {
	const index = items.value.findIndex(item => item.id === updatedId);
	if (index > -1) {
		items.value[index] = updatedItem;
	}
}

async function loadItems() {
	loading.value = true;

	const request = new FilteredTableRequest<LookupFilterRequest>(
		itemsPerPage.value,
		page.value,
		sortBy.value.map((sort) =>
			new SortByRequest(sort.key, sort.order === 'desc')
		),
		true,
		filter.value
	);
	try {
		const response = await API.post(`/${props.entityName}/filtered-table`, request);

		items.value = LookupResponse.listFromJsonList(response.data.items);
		itemsLength.value = response.data.itemsCount;
	} catch (error) {
		console.error('Error loading loanScales:', error);
	} finally {
		loading.value = false;
	}
}


async function deleteLoanScale(item: LookupResponse) {
	if (confirm(`Naozaj chcete vymazať hodnotu ${item.text}`)) {
		await store.value.delete(item.id);

		items.value.splice(items.value.findIndex(i => i.id === item.id), 1);
	}
}
</script>