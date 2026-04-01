<template>
	<VDataTableServer
		v-model:itemsPerPage="itemsPerPage"
		v-model:page="page"
		v-model:sortBy="sortBy"
		class="flex-fill"
		style="border: 2px solid #bbb; font-size: small"
		height="0"
		:headers="headers"
		:items
		:itemsLength
		:loading
		hover
		multiSort
		fixedHeader
		sticky
		fixedFooter
		showCurrentPage
		:showSelect="showSelect ?? true"
		:showExpand="showExpand ?? false"
		@update:options="emit('onLoadItems')"
	>
		<template
			v-for="(_, name) in $slots"
			#[name]="slotData"
		>
			<slot
				:name="name"
				v-bind="slotData || {}"
			></slot>
		</template>
	</VDataTableServer>
</template>
<script setup lang="ts" generic="TItem extends IMyResponse">
	import type { TableAction } from '@/dtos/dto/TableAction.ts'
	import type { TableColumn } from '@/dtos/dto/TableColumn.ts'
	import { computed } from 'vue'
	import { VDataTableServer } from 'vuetify/components'
	import { useTableHeader } from '@/composables/table/TableHeaderComposable.ts'
	import type { IMyResponse } from '@/dtos/response/interface/IMyResponse.ts'
	import type { SortItem } from 'vuetify/lib/components/VDataTable/composables/sort'

	const props = defineProps<{
		itemsLength: number
		columns: TableColumn[]
		showActions?: boolean
		actions?: TableAction[]
		showExpand?: boolean
		showSelect?: boolean
	}>()

	const emit = defineEmits<{
		(e: 'onAdd'): void
		(e: 'onDelete', item: TItem): void
		(e: 'onEdit', item: TItem): void
		(e: 'onLoadItems'): void
	}>()
	const items = defineModel<TItem[]>({ required: true })
	const itemsPerPage = defineModel<number>('itemsPerPage', { required: true })
	const page = defineModel<number>('page', { required: true })
	const sortBy = defineModel<SortItem[]>('sortBy', { required: true })
	const loading = defineModel<boolean>('loading', { required: true })
	const columns = computed(() => props.columns)
	const headers = useTableHeader(columns, props.showActions ?? true, props.showExpand ?? false)
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
