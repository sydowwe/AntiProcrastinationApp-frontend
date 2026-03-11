import {VSortItem} from '@/dtos/dto/VSortItem.ts';

export class SortByRequest {
	constructor(
		public key: string,
		public isDesc: boolean = false) {
	}

	static map(sortBy: VSortItem[]): SortByRequest[] {
		return sortBy.map(s => new SortByRequest(s.key, s.order === 'desc' || s.order === true));
	}
}
