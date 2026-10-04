export class TodoListRequest {
	constructor(
		public name: string,
		public icon: string | null = null,
		// The list's description. The server's field is `text` (the shared NameTextIconRequest), and
		// unknown keys are dropped, so sending it as `description` lost it silently (OP3).
		public text: string | null = null,
		public categoryId: number | null = null,
	) {}
}
