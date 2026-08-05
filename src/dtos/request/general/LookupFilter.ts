import type { IFilterRequest } from '@/_common/dto/request/interface/IFilterRequest.ts'

export class LookupFilter implements IFilterRequest {
	constructor(public search: string | null = null) {}

	hasAny(): boolean {
		return !!this.search
	}
}
