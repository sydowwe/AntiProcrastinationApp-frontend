# Activity Timeline Component

A comprehensive two-lane waterfall timeline visualization for displaying sequential activity sessions.

## Overview

The ActivityTimeline component displays activity sessions as they happened sequentially, with two lanes:
- **Active Lane** (top): Solid colored blocks for active/focused sessions
- **Background Lane** (bottom): Striped blocks for background sessions with waterfall stacking support

## Features

- ✅ Two-lane layout (Active/Background)
- ✅ CSS Grid-based responsive layout
- ✅ Waterfall stacking for overlapping background sessions
- ✅ Split view mode for long time ranges
- ✅ Activity gap detection and visualization
- ✅ Interactive tooltips with session details
- ✅ Consistent domain-based color coding
- ✅ Keyboard accessible
- ✅ Responsive to container width

## Component Architecture

```
ActivityTimeline.vue (Parent)
├── ViewModeSelector.vue
└── TimelineGrid.vue
    ├── TimelineTimeAxis.vue (×2 for split view)
    ├── TimelineLane.vue (Active)
    │   └── TimelineSession.vue (×N)
    ├── TimelineLane.vue (Background)
    │   └── TimelineSession.vue (×N, stacked)
    └── TimelineTooltip.vue
```

## Usage

### Basic Example

```vue
<template>
  <ActivityTimeline
    :activeSessions="activeSessions"
    :backgroundSessions="backgroundSessions"
    :from="startDate"
    :to="endDate"
    :loading="false"
    @sessionClick="handleSessionClick"
  />
</template>

<script setup lang="ts">
import ActivityTimeline from '@/components/timeline/ActivityTimeline.vue'
import type { TimelineSession } from '@/components/timeline/dto/TimelineSession'

const activeSessions: TimelineSession[] = [
  {
    id: 1,
    domain: 'github.com',
    url: 'https://github.com/user/repo',
    startedAt: new Date('2024-02-07T08:30:00'),
    endedAt: new Date('2024-02-07T09:45:00'),
    durationSeconds: 4500,
    totalSeconds: 3600,
  },
  // ... more sessions
]

const backgroundSessions: TimelineSession[] = [
  {
    id: 101,
    domain: 'spotify.com',
    startedAt: new Date('2024-02-07T08:00:00'),
    endedAt: new Date('2024-02-07T12:00:00'),
    durationSeconds: 14400,
    totalSeconds: 3600,
  },
  // ... more sessions
]

const startDate = new Date('2024-02-07T08:00:00')
const endDate = new Date('2024-02-07T18:00:00')

function handleSessionClick(session: TimelineSession) {
  console.log('Clicked session:', session)
}
</script>
```

## Props

### ActivityTimeline

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `activeSessions` | `TimelineSession[]` | Yes | Array of active (focused) activity sessions |
| `backgroundSessions` | `TimelineSession[]` | Yes | Array of background activity sessions |
| `from` | `Date` | Yes | Start date/time of the timeline range |
| `to` | `Date` | Yes | End date/time of the timeline range |
| `loading` | `boolean` | No | Shows skeleton loader when true |

### Events

| Event | Payload | Description |
|-------|---------|-------------|
| `sessionClick` | `TimelineSession` | Emitted when a session block is clicked |

## Types

### TimelineSession

```typescript
interface TimelineSession {
  id: number
  domain: string
  url?: string
  startedAt: Date
  endedAt: Date
  durationSeconds: number  // Total duration including idle time
  totalSeconds: number     // Active/focused time only
}
```

### ViewMode

```typescript
type ViewMode = 'single' | 'split'
```

## View Modes

### Single Row Mode
Shows the entire time range in one row:
- Time axis at top
- Active lane (40px)
- Background lane (dynamic height based on stacking)

### Split View Mode
Splits the time range in half, showing two rows:
- First half: time range from `from` to midpoint
- Second half: time range from midpoint to `to`
- Useful for very long time ranges (e.g., 12+ hours)

Users can toggle between modes using the ViewModeSelector button group.

## Features in Detail

### Waterfall Stacking

When multiple background sessions overlap, they are automatically stacked vertically:
- Algorithm finds the first available "row" for each session
- Background lane height adjusts dynamically
- Maximum stack levels are unlimited

### Activity Gaps

Gaps in activity (no active or background sessions) are automatically detected and displayed:
- Only gaps ≥ 30 minutes are shown
- Displayed as dashed bordered regions with "No activity" label
- Labels only shown if gap is wide enough (≥80px)

### Color Coding

Each domain gets a consistent color:
- Uses `getDomainColor()` utility for consistent hashing
- Active sessions: Solid color blocks
- Background sessions: Striped pattern (45° diagonal)
- Colors are WCAG AA compliant for accessibility

### Tooltips

Hovering over any session block shows a tooltip with:
- Domain name
- Start and end times
- Session duration (including idle)
- Active time (focused time only)
- URL (if available, truncated)

### Time Axis

Automatically adjusts time marker intervals based on duration:
- ≤4 hours: 30-minute intervals
- ≤8 hours: 1-hour intervals
- ≤16 hours: 2-hour intervals
- >16 hours: 3-hour intervals

### Responsive Behavior

- Timeline fills container width
- Minimum width: 600px (horizontal scroll if needed)
- Session blocks scale with container
- Very small sessions get minimum 2px width for visibility
- Time markers adapt to available space

## Accessibility

- ✅ Sessions are keyboard focusable (tabindex="0")
- ✅ Supports Enter and Space key activation
- ✅ ARIA labels describe session details
- ✅ Focus indicators visible on keyboard navigation
- ✅ Color patterns (striped) distinguish background (not color alone)
- ✅ High contrast colors for readability

## Styling

The component uses Vuetify's design tokens where possible and scoped CSS for custom styling:
- Vuetify colors for UI elements
- Custom CSS Grid for timeline layout
- Scoped styles prevent global pollution
- Responsive utilities from Vuetify

## Performance Considerations

- Sessions are rendered using v-for with `:key="session.id"`
- Resize observer efficiently tracks container width changes
- Computed properties cache expensive calculations
- CSS Grid hardware-accelerated layout
- Waterfall stacking algorithm is O(n log n)

## Utilities

### Exported Functions

```typescript
// Calculate timeline configuration
calculateTimelineConfig(containerWidth, from, to): TimelineGridConfig

// Calculate session position
calculateSessionPosition(session, rangeFrom, rangeTo, containerWidth, config): SessionPosition

// Calculate waterfall stacking
calculateWaterfallStack(sessions): StackedSession[]

// Calculate lane height
calculateLaneHeight(stackedSessions, baseHeight): number

// Find activity gaps
findActivityGaps(sessions, from, to, minGapMinutes): Gap[]

// Filter sessions for time range
filterSessionsForRange(sessions, rangeFrom, rangeTo): TimelineSession[]
```

## Example: HomeView Integration

See `src/views/HomeView.vue` for a complete example with mock data showing:
- Multiple active sessions across 10 hours
- Overlapping background sessions with waterfall stacking
- Activity gaps (11:30-12:00)
- Session click handling

## Future Enhancements

Possible improvements:
- Zoom controls (zoom in/out on timeline)
- Pan/scroll within fixed viewport
- Session grouping/merging by domain
- Custom color schemes
- Export timeline as image
- Virtual scrolling for very large datasets
- Minimap overview for long timelines
