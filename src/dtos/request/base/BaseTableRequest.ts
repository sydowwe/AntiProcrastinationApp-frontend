import {SortByRequest} from './SortByRequest.ts';

export class BaseTableRequest {
	constructor(
		public itemsPerPage: number,
		public page: number,
		public sortBy: SortByRequest[]
	) {
	}
}