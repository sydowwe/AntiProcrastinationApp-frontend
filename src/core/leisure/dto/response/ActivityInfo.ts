export class ActivityInfo {
	constructor(
		public id: number = 0,
		public name: string = '',
		public categoryName: string | null = null,
		public icon: string | null = null,
		public color: string | null = null,
	) {}

	/**
	 * Two wire shapes arrive under the key `activity`, by route:
	 *
	 * - the four profile grids and their get-by-ids send a full `ActivityResponse`, with `role` and a
	 *   **nullable** `category` as nested objects and no flat `icon`/`color`/`categoryName` at all;
	 * - `/leisure/suggestion/draw` (`/leisure/pick`) sends the flat `ActivityInfoResponse`, with the
	 *   fallback below already applied server-side.
	 *
	 * Reading the flat fields first and falling back to the nested ones parses both. The fallback goes
	 * category-then-role because `role` is always present and `category` is the optional, more specific
	 * one — the same direction the server uses when it builds the flat shape.
	 *
	 * Do not read `usageCount`, `canDelete` or `isOnTodoList` off the nested activity on grid rows: they
	 * are structurally present but left at their defaults, and only `activity/grid` and `activity/{id}`
	 * populate them.
	 */
	static fromJson(object: any) {
		const {
			id = 0,
			name = '',
			categoryName = null,
			icon = null,
			color = null,
			role = null,
			category = null,
		} = object
		return new ActivityInfo(
			id,
			name,
			categoryName ?? category?.name ?? null,
			icon ?? category?.icon ?? role?.icon ?? null,
			color ?? category?.color ?? role?.color ?? null,
		)
	}
}
