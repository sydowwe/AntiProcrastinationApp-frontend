import {SortByRequest} from '../request/base/SortByRequest.ts';

export class VSortItem {
	constructor(
		public key: string,
		public order?: boolean | 'asc' | 'desc') {
	}

	get toRequest() {
		return new SortByRequest(this.key, this.order === 'desc' || this.order === true);
	}
}
