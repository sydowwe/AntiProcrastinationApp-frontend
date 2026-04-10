export interface PeriodCompletion {
	periodStart: string
	periodEnd: string
	completedCount: number
	totalCount: number
}

export class RoutineTimePeriodEntity {
	constructor(
		public id: number = 0,
		public text: string | null = null,
		public color: string | undefined = undefined,
		public lengthInDays: number = 0,
		public isHidden: boolean = false,
		public streak: number = 0,
		public bestStreak: number = 0,
		public streakThreshold: number = 90,
		public streakGraceDays: number = 0,
		public resetAnchorDay: number = 0,
		public totalPeriodsCompleted: number = 0,
		public totalPeriodsElapsed: number = 0,
		public nextResetAt: string | null = null,
		public historyDepth: number = 12,
		public completionHistory: PeriodCompletion[] = [],
	) {}

	static fromJson(object: any) {
		const {
			id = 0,
			text = '',
			color = '',
			lengthInDays = 0,
			isHidden = false,
			streak = 0,
			bestStreak = 0,
			streakThreshold = 90,
			streakGraceDays = 0,
			resetAnchorDay = 0,
			totalPeriodsCompleted = 0,
			totalPeriodsElapsed = 0,
			nextResetAt = null,
			historyDepth = RoutineTimePeriodEntity.defaultHistoryDepth(lengthInDays),
		} = object

		const completionHistory: PeriodCompletion[] = object.completionHistory?.length
			? object.completionHistory
			: RoutineTimePeriodEntity.mockHistory(
					totalPeriodsElapsed,
					streak,
					bestStreak,
					nextResetAt,
					lengthInDays,
					historyDepth,
				)

		return new RoutineTimePeriodEntity(
			id,
			text,
			color,
			lengthInDays,
			isHidden,
			streak,
			bestStreak,
			streakThreshold,
			streakGraceDays,
			resetAnchorDay,
			totalPeriodsCompleted,
			totalPeriodsElapsed,
			nextResetAt,
			historyDepth,
			completionHistory,
		)
	}

	static listFromObjects(objects: any[]) {
		return objects.map((item: object) => this.fromJson(item))
	}

	static defaultHistoryDepth(lengthInDays: number): number {
		// show roughly 3 months of history, clamped between 4 and 52
		return Math.min(52, Math.max(4, Math.round(90 / Math.max(lengthInDays, 1))))
	}

	static mockHistory(
		totalPeriodsElapsed: number,
		streak: number,
		bestStreak: number,
		nextResetAt: string | null,
		lengthInDays: number,
		historyDepth: number,
	): PeriodCompletion[] {
		if (totalPeriodsElapsed <= 0 || lengthInDays <= 0) return []

		const count = Math.min(totalPeriodsElapsed, historyDepth)
		const msPerPeriod = lengthInDays * 24 * 60 * 60 * 1000
		const anchor = nextResetAt ? new Date(nextResetAt).getTime() : Date.now()
		// probability of a non-streak period being completed
		const fillProb = bestStreak > 0 ? Math.min(streak / bestStreak, 0.85) : 0.4

		const history: PeriodCompletion[] = []
		for (let i = count; i >= 1; i--) {
			const periodEnd = new Date(anchor - (i - 1) * msPerPeriod)
			const periodStart = new Date(anchor - i * msPerPeriod)
			// i=1 is most recent completed period; last `streak` periods are completed
			const completed = i <= streak || (i > streak && seededBool(i, fillProb))
			history.push({
				periodStart: periodStart.toISOString(),
				periodEnd: periodEnd.toISOString(),
				completedCount: completed ? 1 : 0,
				totalCount: 1,
			})
		}
		return history
	}
}

function seededBool(seed: number, probability: number): boolean {
	// deterministic pseudo-random based on seed so values don't change on re-render
	const x = Math.sin(seed * 9301 + 49297) * 233280
	return x - Math.floor(x) < probability
}
