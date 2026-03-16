<template>
<div class="h-100 w-100 d-flex flex-column">
	<DataTable
		v-model="items"
		v-model:items-per-page="itemsPerPage"
		v-model:page="page"
		v-model:sort-by="sortBy"
		:columns
		:items
		:itemsLength
		:loading
		@onLoadItems="emit('onLoadItems')"
		:show-expand="showExpand ?? false"
		:show-select="showSelect ?? true"
		:showActions
	>
		<template v-slot:[`header.actions`]>
			<div v-if="showActionsHeader" class="d-flex justify-center align-center ga-2">
				<VIconBtn
					icon="plus"
					width="40" height="36"
					variant="tonal"
					color="success"
					@click="emit('onAdd')"
					title="Pridať">
					<v-icon size="18"></v-icon>
				</VIconBtn>
				<slot name="actionsHeader"></slot>
			</div>
		</template>

		<template v-slot:item="{ item,internalItem }">
			<VDataTableRow :item="internalItem">
				<template
					v-for="column in columns"
					:key="column.key"
					v-slot:[`item.${column.key}`]="{ isSelected }"
				>
					<slot name="formattedColumn" :id="item.id" :key="column.key" :value="getNestedValue(item, column.key)">
						{{ getNestedValue(item, column.key) }}
					</slot>
				</template>
				<template v-slot:item.actions>
					<VSheet class="px-2 d-flex align-center justify-center ga-2 h-100 w-100">
						<slot name="actions" :item="item">
							<VIconBtn v-for="(action, i) in actions"
							          :key="i" :icon="action.icon"
							          :variant="action.variant"
							          width="40" height="36"
							          @click="action.onClick(item)"
							          :color="action.color"
							          :title="action.name">
								<v-icon size="15"></v-icon>
							</VIconBtn>
							<slot name="additionalActions" :id="item.id"></slot>
						</slot>
					</VSheet>
				</template>
			</VDataTableRow>
		</template>

		<template v-slot:expanded-row="{item, columns, isExpanded, toggleExpand}">
			<slot name="expandedRow" :item="item" :expColumns="columns" :isExpanded="isExpanded" :toggleExpand="toggleExpand"></slot>
		</template>
		<template v-slot:bottom>
			<MyTableFooter v-model:items-per-page="itemsPerPage" v-model:page="page" :itemsLength>
				<template v-slot:append>
					<slot name="footer.append"></slot>
				</template>
			</MyTableFooter>
		</template>
	</DataTable>

	<MyDialog
		title="Delete confirmation"
		:text="deleteConfirmationText"
		v-model="deleteDialog"
		@confirmed="emit('onDelete')"
		confirmBtnColor="error"
	/>
</div>
</template>
<script setup lang="ts" generic="TItem extends IIdResponse">
import {computed, ref, watch} from 'vue';
import {type IIdResponse} from '@/dtos/response/interface/IIdResponse.ts';
import {TableAction} from '@/dtos/dto/TableAction.ts';
import {TableColumn} from '@/dtos/dto/TableColumn.ts';
import {VSortItem} from '@/dtos/dto/VSortItem.ts';
import {useDisplay} from 'vuetify/framework';
import MyTableFooter from '@/components/general/dataTable/MyTableFooter.vue';
import DataTable from '@/components/general/dataTable/DataTable.vue';
import {getNestedValue} from '@/composables/table/TableHeaderComposable.ts';
import MyDialog from '@/components/dialogs/MyDialog.vue';

const {mdAndDown} = useDisplay();
const props = withDefaults(defineProps<{
	itemsLength: number,
	columns: TableColumn[],
	actions?: TableAction[],
	showActions?: boolean,
	showActionsHeader?: boolean,
	showExpand?: boolean,
	showSelect?: boolean,
	deleteConfirmationColumn?: string,
}>(), {
	showActions: true,
	showActionsHeader: true,
})

const actions = props.actions ?? [
	new TableAction("edit", "Upraviť", "primaryOutline", 'tonal', "pen", edit),
	new TableAction("delete", "Vymazať", "secondaryOutline", 'tonal', "trash", del)
];

const columns = computed(() => props.columns)

const items = defineModel<TItem[]>({required: true});
const itemsPerPage = defineModel<number>('itemsPerPage', {required: true});
const page = defineModel<number>('page', {required: true});
const sortBy = defineModel<VSortItem[]>('sortBy', {required: true});

const loading = defineModel<boolean>('loading', {required: true});

const deleteDialog = ref(false);
const deleteConfirmationText = ref<string | undefined>()

watch(() => props.columns, () => {
	if (!props.columns[0]?.key) {
		return
	}
	sortBy.value.push(new VSortItem(props.columns[0]?.key, 'asc'));
})

function edit(item: TItem) {
	emit("onEdit", item);
}

function del(item: TItem) {
	deleteDialog.value = true;
	const name = item[props.deleteConfirmationColumn];
	deleteConfirmationText.value = `Are you sure you want to delete ${name}?`
}

const emit = defineEmits<{
	(e: 'onAdd'): void
	(e: 'onDelete', item: TItem): void
	(e: 'onEdit', item: TItem): void
	(e: 'onLoadItems'): void
}>();

// onMounted(() => {
// 	const perPageSelectObject = document.querySelector('');
// 	console.log(perPageSelectObject)
// })


</script>

<style>
.v-data-table tr:not(.expanded-row) th:last-child {
	border-left: 1px solid #BBB !important;
}

.v-data-table table {
	border-bottom: 1px solid #BBB !important;
}

.v-data-table tr:not(.expanded-row) td:last-child {
	border-left: 1px solid #BBB !important;
}

.v-data-table .v-data-table__td--expanded-row {
	text-align: center;
}
</style>