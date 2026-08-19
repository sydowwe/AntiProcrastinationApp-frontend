export class ActivityRequest {
	constructor(
		public name: string = '',
		public text: string | null = null,
		public roleId: number | null = null,
		public categoryId: number | null = null,
		public isUnavoidable: boolean = false,
	) {}
}
