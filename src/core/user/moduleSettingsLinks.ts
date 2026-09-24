// The settings pages that live outside `/user/settings`, listed so the user can find them from the
// page called "settings". Data only — `ModuleSettingsSection.vue` renders it and nothing else reads it.
//
// Every entry is a **route name**, deliberately. A route name is a string, so this file creates no
// dependency on `core/dayPlanner` or on the framework's notifications module — which is what keeps
// CLAUDE.md's cross-module import rule satisfied while still surfacing their pages. Never swap a
// `routeName` for an imported component or store to "make it type-safe"; that trade is the whole
// reason the two settings systems were invisible to each other in the first place.
//
// What belongs here: pages that edit **per-user preferences** owned by a module's own settings
// endpoint (see "Where a preference lives" in CLAUDE.md). What does not: entity-management screens —
// `/activity-settings/:tab?` is one and stays out. `/activity-tracking/{desktop,android}/settings/:tableView`
// is the one deliberate exception: it's still entity/rule management, not preferences, but it's also
// listed here anyway (owner's call) so it's reachable both from its own module's sidebar entry and from
// this page — being in two places costs nothing and only helps discoverability.
export interface ModuleSettingsLink {
	/** Vue Router route name. Must exist in `src/router.ts`'s composed table. */
	routeName: string
	/** i18n key under `user.moduleSettings.*`. */
	labelKey: string
	icon: string
	/** Route params, for a route name whose path isn't fully static (e.g. a required `:tableView`). */
	params?: Record<string, string>
}

export const moduleSettingsLinks: ModuleSettingsLink[] = [
	{ routeName: 'dayPlannerSettings', labelKey: 'planner', icon: 'calendar-days' },
	// Framework-owned (`_common/modules/notifications`), routed by this app. It is in the framework's
	// UserMenu but was in neither the sidebar nor this page, so quiet hours and per-kind muting were
	// findable only from a dropdown.
	{ routeName: 'reminderPreferences', labelKey: 'reminders', icon: 'bell' },
	// A deliberate borderline case. `/routine-settings` manages time-period *entities* (name, colour,
	// length), which the rule above excludes — but it also owns per-user streak preferences (threshold,
	// grace days, reset anchor, history depth), and those were reachable only from an in-page button on
	// `/routine-todo-list`. The preference half is what earns it a place here.
	{ routeName: 'routineSettings', labelKey: 'routine', icon: 'repeat' },
	// See the comment above the interface — this is catalogue/rule management, not a preference, but
	// it's linked here too alongside its sidebar entry. `:tableView` has no default in the route itself
	// (only the bare `/settings` redirect does), so it's supplied here.
	{
		routeName: 'desktopSettings',
		labelKey: 'desktopTracking',
		icon: 'desktop',
		params: { tableView: 'distinctEntries' },
	},
	{
		routeName: 'androidSettings',
		labelKey: 'androidTracking',
		icon: 'fa-brands fa-android',
		params: { tableView: 'distinctEntries' },
	},
]
