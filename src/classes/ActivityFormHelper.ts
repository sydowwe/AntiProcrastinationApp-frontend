import {SelectOption} from '@/classes/SelectOption';
import {HistoryFilter} from '@/classes/History';

export enum ActivityOptionsSource {
	NONE = "none", ALL = "activity", ACTIVITY_HISTORY = "activity-history", TASK_PLANNER = "task-planner"
}

export class ActivityFormSelectOptions {
	constructor(
		public activityOptions: SelectOption[] = [],
		public roleOptions: SelectOption[] = [],
		public categoryOptions: SelectOption[] = [],
		public taskUrgencyOptions: SelectOption[] = [],
		public routineTimePeriodOptions: SelectOption[] = [],
	) {
	}
}

export class ActivitySelectOptionCombination extends SelectOption {
	constructor(
		public id: number,
		public text: string,
		public roleOption: SelectOption,
		public categoryOption: SelectOption | null = null,
		public taskUrgencyOption: SelectOption | null = null,
		public routineTimePeriodOption: SelectOption | null = null,
	) {
		super(id, text)
	}

	static fromObject(object: any) {
		const {
			id = 0,
			text = '',
			roleOption = SelectOption.fromObject(object.roleOption),
			categoryOption = SelectOption.fromObject(object.categoryOption),
			taskUrgencyOption = SelectOption.fromObject(object.taskUrgencyOption),
			routineTimePeriodOption = SelectOption.fromObject(object.routineTimePeriodOption)
		} = object;
		return new ActivitySelectOptionCombination(id, text, roleOption, categoryOption,taskUrgencyOption, routineTimePeriodOption);
	}

	static listFromObjects(objects: any[]) {
		return objects.map((item: object) => this.fromObject(item));
	}
}

export class ActivityFormRequest {
	constructor(
		public activityId: number | null = null,
		public roleId: number | null = null,
		public categoryId: number | null = null,
		public isFromToDoList: boolean | null = null,
		public taskUrgencyId: number | null = null,
		public isFromRoutineToDoList: boolean | null = null,
		public routineTimePeriodId: number | null = null,
		public isUnavoidable: boolean | null = null
	) {
	}

	static fromFilter(filterData: HistoryFilter) {
		return new ActivityFormRequest(filterData.activityId, filterData.roleId, filterData.categoryId, filterData.isFromToDoList, filterData.taskUrgencyId, filterData.isFromRoutineToDoList, filterData.routineTimePeriodId, filterData.isUnavoidable);
	}
}