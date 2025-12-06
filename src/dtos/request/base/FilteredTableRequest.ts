import {BaseTableRequest} from './BaseTableRequest.ts';
import {SortByRequest} from './SortByRequest.ts';
import type {IFilterRequest} from '@/dtos/request/interface/IFilterRequest.ts';

export class FilteredTableRequest<TFilter extends IFilterRequest> extends BaseTableRequest {
	constructor(
		itemsPerPage: number,
		page: number,
		sortBy: SortByRequest[],
		public useFilter: boolean = false,
		public filter: TFilter | null = null,
	) {
		super(itemsPerPage, page, sortBy);
	}
}
