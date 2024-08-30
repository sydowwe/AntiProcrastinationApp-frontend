import {Category} from './Category';
import {Role} from "./Role";
import {HistoryFilter} from '@/classes/History';
import {SelectOption} from '@/classes/SelectOption';

export class Activity {
	constructor(
		public id: number = 0,
		public name: string | null = null,
		public text: string | null = null,
		public isOnToDoList: boolean = false,
		public isUnavoidable: boolean = false,
		public role: Role | null = null,
		public category: Category | null = null
	) {
	}

	static fromObject(object: any) {
		const {
			id = 0,
			name = '',
			text = '',
			isOnToDoList = false,
			isUnavoidable = false,
			role = new Role(),
			category = new Category()
		} = object;
		return new Activity(id, name, text, isOnToDoList, isUnavoidable, role, category);
	}

	static listFromObjects(objects: any[]) {
		return objects.map((item: object) => this.fromObject(item));
	}
}

export class ActivityRequest {

	constructor(public name: string = '',
	            public text: string | null = null,
	            public isOnToDoList: boolean = false,
	            public isUnavoidable: boolean = false,
	            public roleId: number | null = null,
	            public categoryId: number | null = null) {

	}

	static fromObject(object: any) {
		const {
			name = '',
			text = '',
			isOnToDoList = false,
			isUnavoidable = false,
			roleId = 0,
			categoryId = 0
		} = object;
		return new ActivityRequest(name, text, isOnToDoList, isUnavoidable, roleId, categoryId);
	}
}

export class QuickEditActivityRequest {
	constructor(public name: string = '',
	            public text: string | null = null
	) {	}

	static fromObject(object: any) {
		const {
			name = '',
			text = '',
		} = object;
		return new QuickEditActivityRequest(name, text);
	}
}

export class ActivitySelectOption extends SelectOption {
	constructor(
		public id: number,
		public label: string,
		public roleId: number,
		public categoryId: number,
	) {
		super(id,label)
	}

	static fromObject(object: any) {
		const {
			id = 0,
			label = '',
			roleId = 0,
			categoryId = 0
		} = object;
		return new ActivitySelectOption(id, label, roleId, categoryId);
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
	) {}
	static fromFilter(filterData: HistoryFilter){
		return new ActivityFormRequest(filterData.activityId,filterData.roleId,filterData.categoryId,filterData.isFromToDoList,filterData.isUnavoidable);
	}
}
