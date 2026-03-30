import type { IFilterRequest } from '@/dtos/request/interface/IFilterRequest.ts'

export class ActivityFilter implements IFilterRequest {
	constructor(
		public name: string | null = null,
		public text: string | null = null,
		public roleName: string | null = null,
		public roleIds: number[] | null = null,
		public categoryName: string | null = null,
		public categoryIds: number[] | null = null,
	) {}
}
