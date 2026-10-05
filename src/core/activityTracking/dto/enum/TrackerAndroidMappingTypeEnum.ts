export enum TrackerAndroidMappingTypeEnum {
	/** Client-only: sent as `null`, which the server reads as every rule (`TrackerAndroidMappingsFilter.toJSON`). */
	All = 'All',
	Ignored = 'Ignored',
	Activity = 'Activity',
	/** OP22 — rules with a role / a category target. The server's `CategoryAndRole` is a subset of both. */
	Role = 'Role',
	Category = 'Category',
}
