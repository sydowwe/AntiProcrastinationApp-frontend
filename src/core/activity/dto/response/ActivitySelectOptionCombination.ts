import { SelectOption } from '@/_common/dto/response/general/SelectOption.ts'

/**
 * One row of `{source}/form-select-options`.
 *
 * `taskPriorityOption` and `routineTimePeriodOption` are kept because the endpoint sends the keys, but
 * the backend hard-codes both to null on all three sources with no path that fills them, so nothing
 * reads them. The priority and period dropdowns are fed from `/task-priority/all-options` and
 * `/routine-time-period/all-options` instead — see `activityOptionsApi.ts`. Do not reintroduce a
 * filter predicate on either: it can only ever be false.
 */
export class ActivitySelectOptionCombination extends SelectOption {
	constructor(
		public id: number,
		public text: string,
		public roleOption: SelectOption,
		public categoryOption: SelectOption | null = null,
		public taskPriorityOption: SelectOption | null = null,
		public routineTimePeriodOption: SelectOption | null = null,
	) {
		super(id, text)
	}

	static fromJson(object: any) {
		const { id = 0, text = '' } = object
		const roleOption = SelectOption.fromJson(object.roleOption)
		const categoryOption = object.categoryOption ? SelectOption.fromJson(object.categoryOption) : null
		const taskPriorityOption = object.taskPriorityOption ? SelectOption.fromJson(object.taskPriorityOption) : null
		const routineTimePeriodOption = object.routineTimePeriodOption
			? SelectOption.fromJson(object.routineTimePeriodOption)
			: null
		return new ActivitySelectOptionCombination(
			id,
			text,
			roleOption,
			categoryOption,
			taskPriorityOption,
			routineTimePeriodOption,
		)
	}

	static listFromObjects(objects: any[]) {
		return objects.map((item: object) => this.fromJson(item))
	}
}
