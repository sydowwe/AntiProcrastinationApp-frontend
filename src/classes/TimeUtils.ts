export class TimeObject{
    constructor(
        public hours = 0 as number,
        public minutes = 0 as number,
        public seconds = 0 as number
      ) {}
    public isNotZero(): boolean{
      if(this.hours === 0 && this.minutes === 0 && this.seconds === 0){
        return false;
      }
      return true;
    }
}
