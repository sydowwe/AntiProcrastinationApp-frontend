export class PlannerTask {
    constructor(
        public id: number,
        public startTimestamp: Date,
        public minuteLength: number,
        public task: string,
        public color: string,
    ) {
    }

    static fromObject(object: any) {
        const {
            id = 0,
            startTimestamp = new Date(),
            minuteLength = 0,
            task = 0,
            color = '',
        } = object;
        return new PlannerTask(id, startTimestamp, minuteLength, task, color);
    }
    static listFromObjects(objects: any[]) {
        return objects.map((item: object) => this.fromObject(item));
    }
    static frontEndSortFunction(){
        return (a: PlannerTask, b: PlannerTask) => {
            //TODO
            return a.id - b.id;
        };
    }
}

export class PlannerTaskRequest {
    constructor(
        public startTimestamp: Date = new Date(),
        public minuteLength: number = 0,
        public task: string = '',
        public color: string = 'gray',
    ) {
    }
    // static fromObject(object: any){
    //   const {
    //     startTimestamp = new Date(),
    //     minuteLength = 0,
    //     timeSpanText = '',
    //     task = 0,
    //     color = 0,
    //   } = object;
    //   return new PlannerTaskRequest(startTimestamp,minuteLength,timeSpanText,task,color);
    // }
    static fromEntity(plannerTask: PlannerTask) {
        return new PlannerTaskRequest(
            plannerTask.startTimestamp,
            plannerTask.minuteLength,
            plannerTask.task,
            plannerTask.color
        )
    }
}