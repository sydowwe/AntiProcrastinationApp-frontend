import {SortByRequest} from "./SortByRequest";
import {FilterRequest} from '@/dtos/request/base/FilterRequest.ts'; // Adjust path as needed


export class FilterSortRequest<TFilter> extends FilterRequest<TFilter> {
	constructor(
		useFilter: boolean,
		public sortBy: SortByRequest[],
		filter: TFilter | null = null,
	) {
		super(useFilter, filter);
	}
}