export class TodoListCategoryRequest {
	constructor(
		public name: string,
		public icon: string | null = null,
		public color: string | null = null,
	) {}
}
