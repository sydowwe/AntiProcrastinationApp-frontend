import { Category } from './Category.ts'
import { Role } from './Role.ts'

export class Activity {
	constructor(
		public id: number,
		public name: string,
		public text: string | null = null,
		public isUnavoidable: boolean,
		public role: Role,
		public category: Category | null = null,
	) {}

	static fromJson(object: any) {
		const { id = 0, name = '', text = null, isUnavoidable = false } = object
		return new Activity(
			id,
			name,
			text,
			isUnavoidable,
			Role.fromJson(object.role),
			object.category ? Category.fromJson(object.category) : null,
		)
	}

	static listFromObjects(objects: any[]) {
		return objects.map((item: object) => this.fromJson(item))
	}
}
