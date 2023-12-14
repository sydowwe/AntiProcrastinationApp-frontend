export class HistoryFilter{
    constructor(
        public selectedRole = null as number | null,
        public selectedCategory = null as number | null,
        public selectedActivity = null as number | null,
        public isFromToDoList = false,
        public date = new Date(),
        public hoursBack = 24 
      ){}
}