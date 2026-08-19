import { SelectOption } from '@/_common/dto/response/general/SelectOption.ts'

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
