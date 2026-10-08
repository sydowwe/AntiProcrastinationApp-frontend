/** One named row on the card: a to-do item (titled by its activity, dated by its due date) or a planner block (by its day). */
export class WelcomeBackItem {
	constructor(
		public readonly id: number,
		public readonly name: string,
		/** `yyyy-MM-dd`. */
		public readonly date: string,
	) {}

	static fromJson(json: any): WelcomeBackItem {
		const { id = 0, name = '', date = '' } = json ?? {}
		return new WelcomeBackItem(id, name, date)
	}

	static listFromObjects(objects: any[]): WelcomeBackItem[] {
		return objects.map(item => WelcomeBackItem.fromJson(item))
	}
}

/** How many there are, and the first few by name (at most three). */
export class WelcomeBackPile {
	constructor(
		public readonly count: number,
		public readonly preview: WelcomeBackItem[],
	) {}

	static fromJson(json: any): WelcomeBackPile {
		const { count = 0, preview = [] } = json ?? {}
		return new WelcomeBackPile(count, WelcomeBackItem.listFromObjects(preview))
	}
}

/** A routine period whose streak ended while the user was away. */
export class WelcomeBackRoutine {
	constructor(
		public readonly id: number,
		public readonly text: string,
		public readonly color: string,
	) {}

	static fromJson(json: any): WelcomeBackRoutine {
		const { id = 0, text = '', color = '' } = json ?? {}
		return new WelcomeBackRoutine(id, text, color)
	}

	static listFromObjects(objects: any[]): WelcomeBackRoutine[] {
		return objects.map(item => WelcomeBackRoutine.fromJson(item))
	}
}

/**
 * `GET welcome-back` (FO5): what piled up while the user was gone. The server opens it on the first request
 * after at least four days away, and it lasts until it is answered, dismissed, or two days pass. No card is a
 * 204, which `welcomeBackApi` turns into null.
 *
 * The counts decide which rows render; the card names items before it says how many, and never leads with
 * the number of days.
 */
export class WelcomeBack {
	constructor(
		public readonly daysAway: number,
		/** Most of the missed days were marked Vacation or Sick day (FO1's rule): the absence was announced. */
		public readonly wasMarkedAway: boolean,
		public readonly overdueTodos: WelcomeBackPile,
		public readonly pastTasks: WelcomeBackPile,
		public readonly brokenRoutines: WelcomeBackRoutine[],
		public readonly unreadNotifications: number,
	) {}

	/** Nothing to decide: the card is only a greeting. */
	get isEmpty(): boolean {
		return (
			this.overdueTodos.count === 0 &&
			this.pastTasks.count === 0 &&
			this.brokenRoutines.length === 0 &&
			this.unreadNotifications === 0
		)
	}

	static fromJson(json: any): WelcomeBack {
		const {
			daysAway = 0,
			wasMarkedAway = false,
			overdueTodos = null,
			pastTasks = null,
			brokenRoutines = [],
			unreadNotifications = 0,
		} = json ?? {}
		return new WelcomeBack(
			daysAway,
			wasMarkedAway,
			WelcomeBackPile.fromJson(overdueTodos),
			WelcomeBackPile.fromJson(pastTasks),
			WelcomeBackRoutine.listFromObjects(brokenRoutines),
			unreadNotifications,
		)
	}
}
