export class TimeLengthObject {
    constructor(
        public hours = 0 as number,
        public minutes = 0 as number,
        public seconds = 0 as number
      ) {}
    public isNotZero(): boolean{
      return !(this.seconds === 0 && this.minutes === 0 && this.hours === 0);
    }
}

export class TimeObject {
    constructor(
        public hours = 0 as number,
        public minutes = 0 as number
    ) {}   
}
