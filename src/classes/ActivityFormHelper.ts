import {SelectOption} from '@/classes/SelectOption';
import type {ActivityHistoryFilter} from '@/classes/ActivityHistory.ts';

export enum ActivityOptionsSource {
	ALL = "activity", ACTIVITY_HISTORY = "activity-history", TASK_PLANNER = "task-planner"
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

	static fromJson(object: any) {
		const {
			id = 0,
			text = '',
			roleOption = SelectOption.fromJson(object.roleOption),
			categoryOption = SelectOption.fromJson(object.categoryOption),
			taskUrgencyOption = SelectOption.fromJson(object.taskUrgencyOption),
			routineTimePeriodOption = SelectOption.fromJson(object.routineTimePeriodOption)
		} = object;
		return new ActivitySelectOptionCombination(id, text, roleOption, categoryOption,taskUrgencyOption, routineTimePeriodOption);
	}

	static listFromJsonList(objects: any[]) {
		return objects.map((item: object) => this.fromJson(item));
	}
}

export class ActivityFormRequest {
	constructor(
		public activityId?: number,
		public roleId?: number,
		public categoryId?: number,
		public isUnavoidable?: boolean,

		public isFromToDoList: boolean | null = null,
		public taskUrgencyId: number | null = null,
		public isFromRoutineToDoList: boolean | null = null,
		public routineTimePeriodId: number | null = null,
	) {
	}
	static fromFilter(filterData: ActivityHistoryFilter) {
		return new ActivityFormRequest(filterData.activityId, filterData.roleId, filterData.categoryId,filterData.isUnavoidable, filterData.isFromToDoList, filterData.taskUrgencyId, filterData.isFromRoutineToDoList, filterData.routineTimePeriodId);
	}

}