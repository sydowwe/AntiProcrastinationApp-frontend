/**
 * What `ActivitySelectionForm` currently has selected, as data.
 *
 * Handed out through `v-model:selection` rather than read off the component instance: the names are
 * display values derived from the option lists, which arrive in `onMounted`. The form leaves
 * `selection` null until they have, so a consumer that reads on mount gets null instead of an object
 * full of empty strings.
 *
 * Lives in `dto/dto/` (the shape `_common/dto/dto/` uses for value objects that are neither a request
 * nor a response) because other modules consume it, and importing it from `composable/` would cross
 * the module boundary CLAUDE.md draws.
 */
export class ActivitySelection {
	constructor(
		public activityId: number | null = null,
		public activityName: string = '',
		public roleId: number | null = null,
		public roleName: string = '',
		public categoryId: number | null = null,
		public categoryName: string = '',
		public taskPriorityId: number | null = null,
		public taskPriorityName: string = '',
		public routineTimePeriodId: number | null = null,
		public routineTimePeriodName: string = '',
	) {}
}
