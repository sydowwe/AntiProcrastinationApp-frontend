export class TodoListItemStepEntity {
	constructor(
		public id: number,
		public name: string,
		public isDone: boolean = false,
		public order: number = 1,
		public note: string | null = null,
	) {}

	static fromJson(json: any) {
		return new TodoListItemStepEntity(json.id, json.name, json.isDone ?? false, json.order ?? 1, json.note ?? null)
	}

	static listFromObjects(objects: any[]) {
		return objects.map((o: any) => this.fromJson(o)).sort((a, b) => a.order - b.order)
	}
}
