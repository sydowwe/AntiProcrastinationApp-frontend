export class HistoryFilter{
    constructor(
        public selectedRole = null as number | null,
        public selectedCategory = null as number | null,
        public selectedActivity = null as number | null,
        public isFromToDoList = false as boolean,
        public date = new Date() as Date | null,
        public hoursBack = 24 as number
      ){}
}