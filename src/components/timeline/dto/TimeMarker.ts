export class TimeMarker {
  constructor(
    public time: Date,
    public position: string,
    public label: string,
    public weight: 'minor' | 'regular' | 'major' // 5min tick | 15/30min label | hour label
  ) {}
}
