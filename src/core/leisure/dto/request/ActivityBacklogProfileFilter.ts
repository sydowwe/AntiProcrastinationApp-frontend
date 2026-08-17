import type { IFilterRequest } from '@/_common/dto/request/interface/IFilterRequest.ts'
import type { EnergyLevel } from '@/core/leisure/dto/enum/EnergyLevel.ts'
import type { EffortType } from '@/core/leisure/dto/enum/EffortType.ts'

export class ActivityBacklogProfileFilter implements IFilterRequest {
	constructor(
		public activityName: string | null = null,
		public locationTypeIds: number[] | null = null,
		public weatherDependencyIds: number[] | null = null,
		public energyLevels: EnergyLevel[] | null = null,
		public effortTypes: EffortType[] | null = null,
		public expectedCostTierIds: number[] | null = null,
		public maxDurationMinutes: number | null = null,
		public minParticipants: number | null = null,
		public maxParticipants: number | null = null,
		public isOneTime: boolean | null = null,
		public isAnchored: boolean | null = null,
	) {}

	hasAny(): boolean {
		return (
			!!this.activityName ||
			!!this.locationTypeIds?.length ||
			!!this.weatherDependencyIds?.length ||
			!!this.energyLevels?.length ||
			!!this.effortTypes?.length ||
			!!this.expectedCostTierIds?.length ||
			this.maxDurationMinutes != null ||
			this.minParticipants != null ||
			this.maxParticipants != null ||
			this.isOneTime != null ||
			this.isAnchored != null
		)
	}
}
