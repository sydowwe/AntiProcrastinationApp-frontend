import type {IMyResponse} from '@/classes/Generic.ts';

export const ShowPerPageOptions = [10, 20, 50, 100, 150, 200];

export interface IBaseTableCreateItemRequest {
}

export interface IBaseTableUpdateItemRequest {
}

export interface IBaseResponse {
}

export abstract class BaseTableItemResponse implements IBaseResponse {
	protected constructor(
		public id: number,
	) {
	}
}

export class TableResponse<TResponse extends IMyResponse> {
	constructor(
		public items: TResponse[],
		public itemsLength: number,
	) {
	}
}