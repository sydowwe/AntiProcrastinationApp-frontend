import {computed, type ComputedRef, type Ref} from 'vue';
import type {TableColumn} from '@/dtos/dto/TableColumn.ts';

export function useTableHeader<TColumn extends TableColumn>(columns: Ref<TColumn[]> | ComputedRef<TColumn[]>, hasActions: boolean, showExpand: boolean) {
	return computed(() => {
		const headers: any[] = [];
		if (showExpand) {
			headers.push({
				title: '',
				value: 'data-table-expand',
				key: 'data-table-expand',
				sortable: false,
			});
		}

		headers.push(...columns.value.map((col) => (
			{
				title: col.text,
				value: col.key,
				key: col.key,
				sortable: col.isSortable,
				align: 'center',
				justify: 'center',
				cellProps: {
					class: 'px-1',
					style: {
						align: 'center',
					},
				},
			}))
		)
		if (hasActions) {
			headers.push({
				title: 'Akcie',
				value: 'actions',
				key: 'actions',
				sortable: false,
				align: 'center',
				justify: 'center',
				cellProps: {
					class: 'px-1',
					style: {
						align: 'center',
					},
				},
			})
		}
		return headers;
	});
}

export function getNestedValue(obj: any, key: string) {
	return key.split('.').reduce((value, part) => value?.[part], obj);
}