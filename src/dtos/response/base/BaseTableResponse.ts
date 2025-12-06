import type {IIdResponse} from '@/dtos/response/interface/IIdResponse.ts';

export class BaseTableResponse<TItem extends IIdResponse> {
	constructor(
		public items: TItem[],
		public itemsCount: number,
		public pageCount: number
	) {
	}

	static fromJson<TItem extends IIdResponse>(
		json: any,
		itemFromJson: (j: any) => TItem
	): BaseTableResponse<TItem> {
		const rawItems = json.items ?? json.Items ?? [];
		const items = Array.isArray(rawItems)
			? rawItems.map(itemFromJson)
			: [];

		const itemsCount = json.itemsCount ?? json.ItemsCount ?? items.length;
		const pageCount = json.pageCount ?? json.PageCount ?? 1;

		return new BaseTableResponse<TItem>(items, itemsCount, pageCount);
	}
}
