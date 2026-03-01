export class TodoListRequest {
	constructor(
		public name: string,
		public icon: string | null = null,
		public description: string | null = null,
		public categoryId: number | null = null,
	) {}
}
