/**
 * How long an interruption has to last before it ends a focus block.
 *
 * This is a display decision, not a fact about the data: a twenty-second glance at another window is
 * not the end of an hour on one thing, and a five-minute one is. Two minutes is the line, and it is
 * named here — and surfaced in the strip's own tooltip — rather than living as a bare `120` inside a
 * loop. Changing it changes only what "longest block" means, never the switch count.
 *
 * The metrics themselves are computed server-side (`POST …/focus-metrics`), but this number stays in
 * the frontend and travels out as `FocusMetricsRequest.focusGapSeconds` — the server reads the
 * tolerance from the request rather than holding a constant of its own, precisely so this decision
 * has exactly one owner and one value.
 *
 * The client-side `computeFocusMetrics` that used to live here is gone (U5b). It keyed on the session
 * label, which merged desktop processes the server's `processName` keying separates, so keeping it as
 * a fallback would have meant two definitions of one number on one screen.
 */
export const FOCUS_BLOCK_TOLERANCE_SECONDS = 120
