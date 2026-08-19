import type { IFilterRequest } from '@/_common/dto/request/interface/IFilterRequest.ts'

export class ActivityFilter implements IFilterRequest {
	constructor(
		public name: string | null = null,
		public text: string | null = null,
		public roleName: string | null = null,
		public roleIds: number[] | null = null,
		public categoryName: string | null = null,
		public categoryIds: number[] | null = null,
		/**
		 * `false` (the default view) is active only, `true` is archived only, `null` is both.
		 *
		 * The default matches what the server does when the whole filter is omitted, so the default view
		 * still sends the same "no filter" request it always did — see `hasFilter` in `ActivityTable.vue`,
		 * which has to treat anything other than `false` as a filter for exactly that reason.
		 */
		public isArchived: boolean | null = false,
	) {}
}
