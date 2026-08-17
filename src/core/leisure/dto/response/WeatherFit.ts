export class WeatherFit {
	constructor(
		// The lookup rows (`activity-weather-dependency`) that fit today's actual conditions, resolved
		// server-side — the frontend has no reliable way to turn "sunny" into a lookup id on its own,
		// since those rows are user-editable text, not a fixed enum. See D2-backend.md.
		public matchingWeatherDependencyIds: number[] = [],
	) {}

	static fromJson(object: any) {
		const { matchingWeatherDependencyIds = [] } = object ?? {}
		return new WeatherFit(matchingWeatherDependencyIds)
	}
}
