import { TimelineSession } from './TimelineSession'

export class StackedSession extends TimelineSession {
  constructor(
    id: number,
    domain: string,
    startedAt: Date,
    endedAt: Date,
    durationSeconds: number,
    totalSeconds: number,
    public stackLevel: number, // 0 = first row, 1 = second row, etc.
    url?: string
  ) {
    super(id, domain, startedAt, endedAt, durationSeconds, totalSeconds, url)
  }
}
