export class SessionPosition {
  constructor(
    public left: string, // CSS left position (px or %)
    public width: string, // CSS width (px or %)
    public minWidth: string // Minimum width for visibility
  ) {}
}
