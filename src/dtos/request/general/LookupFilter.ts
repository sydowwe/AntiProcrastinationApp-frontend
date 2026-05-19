import type { IFilterRequest } from '@/dtos/request/interface/IFilterRequest.ts'

export class LookupFilter implements IFilterRequest {
	constructor(public search: string | null = null) {}

	hasAny(): boolean {
		return !!this.search
	}
}
