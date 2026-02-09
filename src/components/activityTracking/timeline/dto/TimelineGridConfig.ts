export class TimelineGridConfig {
  constructor(
    public totalMinutes: number, // Total duration in minutes (from -> to)
    public pixelsPerMinute: number, // Calculated based on container width
    public laneHeight: number, // Height of each lane (Active/Background)
    public timeAxisHeight: number, // Height of time axis labels
    public minBlockWidth: number // Minimum width for any session block (for visibility)
  ) {}
}
