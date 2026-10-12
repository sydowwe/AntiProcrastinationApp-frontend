import { ActivityInfo } from '@/core/leisure/dto/response/ActivityInfo.ts'
import { EnergyLevel } from '@/core/leisure/dto/enum/EnergyLevel.ts'
import { EffortType } from '@/core/leisure/dto/enum/EffortType.ts'
import { ReadinessStatus } from '@/core/leisure/dto/enum/ReadinessStatus.ts'
import type { SuggestionSource } from '@/core/leisure/composable/pickerConstraints.ts'

const SOURCES: readonly SuggestionSource[] = ['backlog', 'bucketList', 'project']

/**
 * The leisure draw speaks camelCase tokens (`"low"`, `"readyToStart"`, `"bucketList"`) that equal these enums'
 * VALUES, not their member names — so `convertToEnum`, which looks a member up by name, would miss every one.
 * An unknown token falls back rather than being stored.
 */
function tokenOf<T extends string>(values: readonly T[], raw: unknown, fallback: T): T
function tokenOf<T extends string>(values: readonly T[], raw: unknown, fallback: null): T | null
function tokenOf<T extends string>(values: readonly T[], raw: unknown, fallback: T | null): T | null {
	return values.includes(raw as T) ? (raw as T) : fallback
}

/**
 * One card of the server's draw (`POST /leisure-suggestion`, F2-04). Facts only — the server ranked them, and
 * the card explains itself from these. Everything that varies by source is `null` where the source records
 * nothing, which is what lets the card tell "Takes 45 min" from "Fits in 45 min".
 */
export class LeisureSuggestion {
	constructor(
		/** `<source>:<activityId>` — identity across draws, and what `/leisure-suggestion/seen` takes back. */
		public key: string,
		public source: SuggestionSource,
		public activityId: number,
		public activity: ActivityInfo,
		/** The duration the source records; backlog only. */
		public statedDurationMinutes: number | null,
		/** The longest this could usefully occupy — sizes the booked slot (`slotMinutesFor`), never excludes. */
		public maxUsefulMinutes: number | null,
		public energyLevel: EnergyLevel,
		/** Inferred from difficulty or comfort step rather than stated — the card labels it as an estimate. */
		public energyIsDerived: boolean,
		public effortType: EffortType | null,
		public minParticipants: number | null,
		public maxParticipants: number | null,
		/**
		 * Backlog only, and only for a real weather dependency (never *None*). The card compares it with
		 * `/leisure-weather-fit`'s ids to say why it matched.
		 */
		public weatherDependencyId: number | null,
		public readinessStatus: ReadinessStatus | null,
		public comfortZoneStep: number | null,
		public requiresTravel: boolean,
		/** Where a backlog activity happens, what kind of experience a bucket-list entry is, a project's area. */
		public contextLabel: string | null,
	) {}

	static fromJson(object: any): LeisureSuggestion {
		const {
			key = '',
			source,
			activityId = 0,
			activity = {},
			statedDurationMinutes = null,
			maxUsefulMinutes = null,
			energyLevel,
			energyIsDerived = false,
			effortType = null,
			minParticipants = null,
			maxParticipants = null,
			weatherDependencyId = null,
			readinessStatus = null,
			comfortZoneStep = null,
			requiresTravel = false,
			contextLabel = null,
		} = object ?? {}
		return new LeisureSuggestion(
			key,
			tokenOf(SOURCES, source, 'backlog'),
			activityId,
			ActivityInfo.fromJson(activity),
			statedDurationMinutes,
			maxUsefulMinutes,
			tokenOf(Object.values(EnergyLevel), energyLevel, EnergyLevel.Medium),
			energyIsDerived,
			tokenOf(Object.values(EffortType), effortType, null),
			minParticipants,
			maxParticipants,
			weatherDependencyId,
			tokenOf(Object.values(ReadinessStatus), readinessStatus, null),
			comfortZoneStep,
			requiresTravel,
			contextLabel,
		)
	}

	static listFromObjects(objects: any[]): LeisureSuggestion[] {
		return objects.map(item => LeisureSuggestion.fromJson(item))
	}
}

/** A ranked draw, plus what the empty state and the "set your town" hint are built from. */
export class LeisureDraw {
	constructor(
		public items: LeisureSuggestion[] = [],
		/** Every profile the user has filed, before any constraint. 0 means "nothing filed yet". */
		public poolCount: number = 0,
		/** What survived the constraints. */
		public eligibleCount: number = 0,
		/** A backlog row in this draw's pool depends on the weather, so a town would change the draw. */
		public hasWeatherDependentCandidates: boolean = false,
	) {}

	static fromJson(object: any): LeisureDraw {
		const { items = [], poolCount = 0, eligibleCount = 0, hasWeatherDependentCandidates = false } = object ?? {}
		return new LeisureDraw(
			LeisureSuggestion.listFromObjects(Array.isArray(items) ? items : []),
			poolCount,
			eligibleCount,
			hasWeatherDependentCandidates,
		)
	}
}
