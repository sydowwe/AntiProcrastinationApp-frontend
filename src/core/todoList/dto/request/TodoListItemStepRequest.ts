export class TodoListItemStepRequest {
	constructor(
		public name: string = '',
		public order: number = 1,
		public note: string | null = null,
	) {}
}
