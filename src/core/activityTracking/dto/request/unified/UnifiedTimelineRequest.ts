import { UnifiedActivityRequest } from '@/core/activityTracking/dto/request/unified/UnifiedActivityRequest.ts'

/**
 * Single day only, exactly as on the three per-source dashboards — `dateFrom === dateTo` always. A
 * merged month of sessions is even less legible than a single source's, and the unified view falls
 * back to the stacked bars over a range through the same `isTimelineAvailable` path.
 */
export class UnifiedTimelineRequest extends UnifiedActivityRequest {}
