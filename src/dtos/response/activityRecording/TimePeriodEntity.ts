export class TimePeriodEntity {
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
	) {
	}

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
		} = object;
		return new TimePeriodEntity(id, text, color, lengthInDays, isHidden, streak, bestStreak, streakThreshold, streakGraceDays, resetAnchorDay);
	}

	static listFromObjects(objects: any[]) {
		return objects.map((item: object) => this.fromJson(item));
	}
}
