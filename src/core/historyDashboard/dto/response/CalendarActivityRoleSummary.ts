export class CalendarActivityRoleSummary {
	constructor(
		public roleId: number,
		public roleName: string,
		public color: string | null,
		public totalSeconds: number,
	) {}

	static fromJson(json: any): CalendarActivityRoleSummary {
		return new CalendarActivityRoleSummary(json.roleId, json.roleName, json.color ?? null, json.totalSeconds)
	}
}
