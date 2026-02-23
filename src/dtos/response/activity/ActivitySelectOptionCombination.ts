import {SelectOption} from '@/dtos/response/general/SelectOption.ts';

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
		const {
			id = 0,
			text = '',
			roleOption = SelectOption.fromJson(object.roleOption),
			categoryOption = SelectOption.fromJson(object.categoryOption),
			taskPriorityOption = SelectOption.fromJson(object.taskPriorityOption),
			routineTimePeriodOption = SelectOption.fromJson(object.routineTimePeriodOption)
		} = object;
		return new ActivitySelectOptionCombination(id, text, roleOption, categoryOption, taskPriorityOption, routineTimePeriodOption);
	}

	static listFromJsonList(objects: any[]) {
		return objects.map((item: object) => this.fromJson(item));
	}
}
