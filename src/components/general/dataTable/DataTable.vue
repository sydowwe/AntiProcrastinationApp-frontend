<template>
<VDataTableServer
	class="flex-fill" style="border: 2px solid #BBB; font-size: small;"
	height="0"
	v-model:items-per-page="itemsPerPage"
	v-model:page="page"
	v-model:sort-by="sortBy"
	:headers="headers"
	:items
	:itemsLength
	:loading
	@update:options="emit('onLoadItems')"
	hover
	multi-sort
	fixed-header
	sticky
	fixed-footer
	show-current-page
	:show-select="showSelect ?? true"
	:show-expand="showExpand ?? false"
>
	<template v-for="(_, name) in $slots" v-slot:[name]="slotData">
		<slot :name="name" v-bind="slotData || {}"></slot>
	</template>
</VDataTableServer>
</template>
<script setup lang="ts" generic="TItem extends IBaseResponse">
import {TableAction} from '@/dtos/dto/TableAction.ts';
import {TableColumn} from '@/dtos/dto/TableColumn.ts';
import {VSortItem} from '@/dtos/dto/VSortItem.ts';
import {type IBaseResponse} from '@/dtos/response/interface/IMyResponse';
import {computed} from 'vue';
import {VDataTableServer} from 'vuetify/components';
import {useTableHeader} from '@/composable/table/TableHeaderComposable.ts';

const props = defineProps<{
	itemsLength: number,
	columns: TableColumn[],
	showActions?: boolean,
	actions?: TableAction[],
	showExpand?: boolean,
	showSelect?: boolean,
}>();

const columns = computed(() => props.columns)
const headers = useTableHeader(columns, props.showActions ?? true, props.showExpand ?? false)

console.log(headers.value)
const items = defineModel<TItem[]>({required: true});
const itemsPerPage = defineModel<number>('itemsPerPage', {required: true});
const page = defineModel<number>('page', {required: true});
const sortBy = defineModel<VSortItem[]>('sortBy', {required: true});

const loading = defineModel<boolean>('loading', {required: true});

const emit = defineEmits<{
	(e: 'onAdd'): void
	(e: 'onDelete', item: TItem): void
	(e: 'onEdit', item: TItem): void
	(e: 'onLoadItems'): void
}>();
</script>
<style>
.v-data-table th:last-child,
.v-data-table td:last-child {
	position: sticky !important;
	right: 0 !important;
	z-index: 1 !important;
}

td.v-data-table__td {
	padding: 0 !important;
	border: var(--color-border) 1px solid !important;
}

td.v-data-table__td:not(:last-child) {
	padding: 5px !important;
}
</style>
