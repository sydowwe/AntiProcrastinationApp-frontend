import type { IIdResponse } from '@/_common/dto/response/interface/IIdResponse.ts'
import { convertToEnum } from '@/_common/utils/enumHelpers.ts'
import { ActivityInfo } from '@/core/leisure/dto/response/ActivityInfo.ts'
import { EnergyLevel } from '@/core/leisure/dto/enum/EnergyLevel.ts'
import { EffortType } from '@/core/leisure/dto/enum/EffortType.ts'
import { WeatherDependencyCode } from '@/core/leisure/dto/enum/WeatherDependencyCode.ts'
import { LookupResponse } from '@/_common/dto/response/general/LookupResponse.ts'

export class ActivityBacklogProfile implements IIdResponse {
	constructor(
		// The profile row's own primary key — every write route is keyed by it, not by `activityId`.
		// See the note in `ActivityProjectProfile`.
		public id: number,
		public activityId: number,
		public activity: ActivityInfo,
		public locationType: LookupResponse,
		public weatherDependency: LookupResponse,
		public energyLevel: EnergyLevel,
		public effortType: EffortType | null,
		public minParticipants: number,
		public maxParticipants: number | null,
		public expectedCostTier: LookupResponse,
		public durationMinutes: number,
		public isRepeatable: boolean,
		// Only meaningful while `!isRepeatable` — a repeatable activity is never "done". `null` means the
		// API does not carry the field yet (see prompts/leisure/backend/B1-backend.md).
		public isAnchored: boolean | null,
		public memoryAnchorId: number | null,
		// `null` when the server cannot tell what the row means (a user-created label it does not
		// recognise) — that row takes no part in weather matching.
		public weatherDependencyCode: WeatherDependencyCode | null,
	) {}

	/**
	 * The lookup id when the entry really depends on the weather, else `null`. A *None* row fits every
	 * day — the server puts it in every non-empty fit set — so letting its id through would badge and
	 * boost every indoor activity whenever a weather location is set; an unrecognised row is "no
	 * opinion". Every weather consumer (the picker's eligibility and bonus, both badges) reads this,
	 * never `weatherDependency.id`.
	 */
	get realWeatherDependencyId(): number | null {
		if (this.weatherDependencyCode === null || this.weatherDependencyCode === WeatherDependencyCode.None)
			return null
		return this.weatherDependency.id ?? null
	}

	static fromJson(object: any) {
		const {
			id = 0,
			activityId = 0,
			activity = {},
			locationType = {},
			weatherDependency = {},
			energyLevel = EnergyLevel.Medium,
			effortType = null,
			minParticipants = 1,
			maxParticipants = null,
			expectedCostTier = {},
			durationMinutes = 0,
			isRepeatable = false,
			isAnchored = null,
			memoryAnchorId = null,
			weatherDependencyCode = null,
		} = object
		// The server sends the enum's NAME (`"Low"`, `"Physical"`) — `JsonStringEnumConverter` with no
		// naming policy — while these enums declare camelCase VALUES (`'low'`) because the `enums.*`
		// locale keys are camelCase. Passing the raw string through rendered `enums.energyLevel.Low`
		// on `/leisure/pick` and made `ENERGY_RANK[candidate.energyLevel]` undefined, so every energy
		// comparison in `leisureScoring` produced NaN and silently dropped out of the ranking.
		return new ActivityBacklogProfile(
			id,
			activityId,
			ActivityInfo.fromJson(activity),
			LookupResponse.fromJson(locationType),
			LookupResponse.fromJson(weatherDependency),
			convertToEnum(EnergyLevel, energyLevel) ?? EnergyLevel.Medium,
			effortType == null ? null : (convertToEnum(EffortType, effortType) ?? null),
			minParticipants,
			maxParticipants,
			LookupResponse.fromJson(expectedCostTier),
			durationMinutes,
			isRepeatable,
			isAnchored,
			memoryAnchorId,
			// Not `convertToEnum`: that maps a member NAME, and this field arrives as the value already
			// (`"sunny"`). A code this client does not know is "no opinion", not a dependency.
			Object.values(WeatherDependencyCode).includes(weatherDependencyCode) ? weatherDependencyCode : null,
		)
	}

	static listFromObjects(objects: any[]) {
		return objects.map((item: object) => ActivityBacklogProfile.fromJson(item))
	}
}
