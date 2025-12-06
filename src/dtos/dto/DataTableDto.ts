import {VSortItem} from './VSortItem.ts';

export class DataTableDto {
	constructor(
		public page: number,
		public itemsPerPage: number,
		public sortBy: VSortItem[]
	) {
	}
}
