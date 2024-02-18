import { TimeLengthObject } from "@/classes/TimeUtils";

export function getTimeObjectFromSeconds(timeInSeconds: number) {
    return new TimeLengthObject(
        Math.floor(timeInSeconds / 3600),
        Math.floor((timeInSeconds % 3600) / 60),
        Math.floor(timeInSeconds % 60));
  }
  export function getSecondsFromTimeObject(timeObject: TimeLengthObject) {
    return timeObject.hours * 3600 + timeObject.minutes * 60 + timeObject.seconds;
  }
  export function getTimeNiceFromTimeObject(timeObject: TimeLengthObject) {
    return `${timeObject.hours != 0 ? timeObject.hours + 'h' : ''}${timeObject.minutes != 0 ? timeObject.minutes + 'm' : ''}${timeObject.seconds}s`;
  }
  export function dateNice(date: Date | null){
      if (date) {
        return date.toLocaleDateString();
    } else {
        return null;
    }
  }