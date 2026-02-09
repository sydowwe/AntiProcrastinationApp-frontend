export class TimelineSession {
  constructor(
    public id: number,
    public domain: string,
    public startedAt: Date,
    public endedAt: Date,
    public durationSeconds: number,
    public totalSeconds: number,
    public url?: string
  ) {}
}
