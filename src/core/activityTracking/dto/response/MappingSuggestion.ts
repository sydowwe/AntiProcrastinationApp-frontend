/**
 * What the shared suggestion chip and `useMappingSuggestions` need from a desktop or android suggestion (FO9): an
 * uncovered process or app that the user's own timer focus phases point at one activity.
 */
export interface MappingSuggestion {
	/** The grid column the suggestion is matched on — the process name, or the package name. */
	readonly key: string
	/** How the confirm names what the rule matches — the process, or the app label. */
	readonly subject: string
	readonly activityId: number
	readonly activityName: string
	/** Timer sittings on the activity in which the process or app was active. */
	readonly sessionCount: number
	/** Every timer sitting on the activity in the window. */
	readonly activitySessionCount: number
	/** What *Not this* remembers: a later suggestion of another activity for the same key is a new question. */
	readonly dismissalKey: string
}
