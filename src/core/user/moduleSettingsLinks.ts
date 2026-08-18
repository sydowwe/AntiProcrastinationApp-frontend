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
// endpoint (see "Where a preference lives" in CLAUDE.md). What does not: entity-management screens.
// `/activity-settings/:tab?` and `/activity-tracking/{desktop,android}/settings/:tableView` are
// called "settings" but manage catalogues and mapping rules, not preferences, and they are already
// in the sidebar under their own modules.
export interface ModuleSettingsLink {
	/** Vue Router route name. Must exist in `src/router.ts`'s composed table. */
	routeName: string
	/** i18n key under `user.moduleSettings.*`. */
	labelKey: string
	icon: string
}

export const moduleSettingsLinks: ModuleSettingsLink[] = [
	{ routeName: 'dayPlannerSettings', labelKey: 'planner', icon: 'calendar-days' },
	// Framework-owned (`_common/modules/notifications`), routed by this app. It is in the framework's
	// UserMenu but was in neither the sidebar nor this page, so quiet hours and per-kind muting were
	// findable only from a dropdown.
	{ routeName: 'reminderPreferences', labelKey: 'reminders', icon: 'bell' },
]
