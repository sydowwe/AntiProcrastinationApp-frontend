import type { IFilterRequest } from '@/dtos/request/interface/IFilterRequest.ts'

export class MemoryAnchorFilter implements IFilterRequest {
	constructor(
		public activityName: string | null = null,
		public year: number | null = null,
		public month: number | null = null,
		public minRating: number | null = null,
	) {}

	hasAny(): boolean {
		return !!this.activityName || this.year != null || this.month != null || this.minRating != null
	}
}
