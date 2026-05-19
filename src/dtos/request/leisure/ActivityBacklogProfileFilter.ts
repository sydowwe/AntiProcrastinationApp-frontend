import type { IFilterRequest } from '@/dtos/request/interface/IFilterRequest.ts'
import type { LocationType } from '@/dtos/enum/LocationType.ts'
import type { WeatherDependency } from '@/dtos/enum/WeatherDependency.ts'
import type { EnergyLevel } from '@/dtos/enum/EnergyLevel.ts'
import type { EffortType } from '@/dtos/enum/EffortType.ts'
import type { ExpectedCostTier } from '@/dtos/enum/ExpectedCostTier.ts'

export class ActivityBacklogProfileFilter implements IFilterRequest {
	constructor(
		public activityName: string | null = null,
		public locationTypes: LocationType[] | null = null,
		public weatherDependencies: WeatherDependency[] | null = null,
		public energyLevels: EnergyLevel[] | null = null,
		public effortTypes: EffortType[] | null = null,
		public expectedCostTiers: ExpectedCostTier[] | null = null,
		public maxDurationMinutes: number | null = null,
		public minParticipants: number | null = null,
		public maxParticipants: number | null = null,
		public isOneTime: boolean | null = null,
	) {}

	hasAny(): boolean {
		return (
			!!this.activityName ||
			!!this.locationTypes?.length ||
			!!this.weatherDependencies?.length ||
			!!this.energyLevels?.length ||
			!!this.effortTypes?.length ||
			!!this.expectedCostTiers?.length ||
			this.maxDurationMinutes != null ||
			this.minParticipants != null ||
			this.maxParticipants != null ||
			this.isOneTime != null
		)
	}
}
