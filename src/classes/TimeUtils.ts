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
export function getTimeObjectFromSeconds(timeInSeconds: number) {
  return new TimeObject(
      Math.floor(timeInSeconds / 3600),
      Math.floor((timeInSeconds % 3600) / 60),
      Math.floor(timeInSeconds % 60));
}
export function getSecondsFromTimeObject(timeObject: TimeObject) {
  const timeInSeconds = timeObject.hours * 3600 + timeObject.minutes * 60 + timeObject.seconds;
  return timeInSeconds;
}
export function getTimeNiceFromTimeObject(timeObject: TimeObject) {
  return `${timeObject.hours != 0 ? timeObject.hours + 'h' : ''}${timeObject.minutes != 0 ? timeObject.minutes + 'm' : ''}${timeObject.seconds}s`;
}