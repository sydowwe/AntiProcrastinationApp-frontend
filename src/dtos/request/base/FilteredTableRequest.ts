import { BaseTableRequest } from './BaseTableRequest.ts'
import { SortByRequest } from './SortByRequest.ts'
import type { IFilterRequest } from '@/dtos/request/interface/IFilterRequest.ts'
import { VSortItem } from '@/dtos/dto/VSortItem.ts'

export class FilteredTableRequest<TFilter extends IFilterRequest> extends BaseTableRequest {
	constructor(
		itemsPerPage: number,
		page: number,
		sortBy: VSortItem[],
		public useFilter: boolean = false,
		public filter: TFilter | null = null,
	) {
		super(itemsPerPage, page, SortByRequest.map(sortBy))
	}
}
