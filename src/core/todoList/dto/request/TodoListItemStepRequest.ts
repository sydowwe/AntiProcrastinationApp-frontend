export class TodoListItemStepRequest {
	public note: string | null

	constructor(
		public name: string = '',
		public order: number = 1,
		note: string | null = null,
	) {
		// A blank note is no note: the steps form opens the note field with `''`, and both item dialogs
		// rebuild every step through this constructor on load and on save.
		this.note = note?.trim() ? note : null
	}
}
