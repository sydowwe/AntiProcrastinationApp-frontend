export class FilterRequest<TFilter> {
	constructor(
		public useFilter: boolean,
		public filter: TFilter | null = null,
	) {
	}
}