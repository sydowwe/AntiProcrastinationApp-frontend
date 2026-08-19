export class QuickEditActivityRequest {
	constructor(
		public name: string = '',
		public text: string | null = null,
		public categoryId: number | null = null,
	) {}
}
