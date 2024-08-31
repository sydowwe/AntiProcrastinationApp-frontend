import {SelectOption} from '@/classes/SelectOption';
import {HistoryFilter} from '@/classes/History';

export enum ActivityOptionsSource {
	NONE="none",ALL="activity",ACTIVITY_HISTORY="activity-history",TASK_PLANNER="task-planner"
}

export class ActivityFormSelectOptions{
	constructor(
		public roleOptions: SelectOption[],
		public categoryOptions: SelectOption[],
		public activityOptions: ActivitySelectOptionCombination[],
	) {
	}
}

export class ActivitySelectOptionCombination extends SelectOption {
	constructor(
		public id: number,
		public label: string,
		public roleOption: SelectOption,
		public categoryOption: SelectOption,
	) {
		super(id, label)
	}

	static fromObject(object: any) {
		const {
			id = 0,
			label = '',
			roleOption = SelectOption.fromObject(object.roleOption),
			categoryOption = SelectOption.fromObject(object.categoryOption)
		} = object;
		return new ActivitySelectOptionCombination(id, label, roleOption, categoryOption);
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
		public isFromToDoList: boolean | null = false,
		public isUnavoidable: boolean | null = false
	) {
	}

	static fromFilter(filterData: HistoryFilter) {
		return new ActivityFormRequest(filterData.activityId, filterData.roleId, filterData.categoryId, filterData.isFromToDoList, filterData.isUnavoidable);
	}
}