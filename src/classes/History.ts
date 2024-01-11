export class HistoryFilter{
    constructor(
      public activityId = null as number | null,
        public roleId = null as number | null,
        public categoryId = null as number | null,
        public isFromToDoList = false as boolean | null,
        public dateFrom = null as Date | null,
        public dateTo = new Date() as Date | null,
        public hoursBack = 24 as number | null
      ){
        const tmp = new Date();
        tmp.setDate(new Date().getDate()-3);
        this.dateFrom = tmp;
      }
}