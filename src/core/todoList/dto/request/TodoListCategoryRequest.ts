export class TodoListCategoryRequest {
	constructor(
		public name: string,
		public icon: string | null = null,
		// The server refuses an empty colour and accepts only a `ColorPalette` name (B10), so this
		// seeds one rather than defaulting to null — nothing in `ColorPicker` writes one unprompted.
		public color: string = 'blue',
	) {}
}
