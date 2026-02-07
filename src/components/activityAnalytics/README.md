# Activity Stacked Bars Component

A comprehensive component for displaying activity distribution across time windows using CSS Grid.

## Component Structure

```
activityAnalytics/
├── ActivityStackedBars.vue          # Parent container
├── StackedBarsGrid.vue              # CSS Grid chart implementation
├── StackedBarColumn.vue             # Individual stacked bar
├── StackedBarsTooltip.vue           # Tooltip display
├── WindowSizeSelector.vue           # Window duration selector
└── README.md                        # This file
```

## Usage

```vue
<template>
  <ActivityStackedBars
    :windows="activityWindows"
    :loading="isLoading"
    :availableWindowSizes="[15, 20, 30, 60, 90, 120]"
    :initialWindowSize="30"
    @windowSizeChange="handleWindowSizeChange"
    @activityClick="handleActivityClick"
  />
</template>

<script setup lang="ts">
import ActivityStackedBars, { type ActivityWindow } from '@/components/activityAnalytics/ActivityStackedBars.vue'

const activityWindows = ref<ActivityWindow[]>([
  {
    windowStart: new Date('2024-02-07T09:00:00'),
    windowEnd: new Date('2024-02-07T09:30:00'),
    activities: [
      {
        domain: 'github.com',
        activeSeconds: 900,      // Solid portion
        backgroundSeconds: 300,  // Striped portion
        totalSeconds: 1200,
        url: '/user/repo/pulls'  // Optional
      }
    ]
  }
])

function handleWindowSizeChange(size: number) {
  console.log('Window size changed to:', size)
}

function handleActivityClick({ window, domain }) {
  console.log('Clicked activity:', domain, 'in window:', window)
}
</script>
```

## Props

### ActivityStackedBars (Parent)

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `windows` | `ActivityWindow[]` | required | Array of time windows with activities |
| `loading` | `boolean` | `false` | Shows skeleton loader |
| `availableWindowSizes` | `number[]` | `[15, 20, 30, 60, 90, 120]` | Available window durations in minutes |
| `initialWindowSize` | `number` | `30` | Initial selected window size |

### ActivityWindow Interface

```typescript
interface ActivityWindow {
  windowStart: Date
  windowEnd: Date
  activities: WindowActivity[]
}

interface WindowActivity {
  domain: string           // Domain name (e.g., 'github.com')
  activeSeconds: number    // Active time (solid bar)
  backgroundSeconds: number // Background time (striped bar)
  totalSeconds: number     // Total time
  url?: string            // Optional URL path for tooltip
}
```

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `windowSizeChange` | `number` | Emitted when window duration changes |
| `activityClick` | `{ window: ActivityWindow, domain: string }` | Emitted when a bar is clicked |

## Features

### Adaptive Grid Layout
- Automatically calculates optimal column widths based on container size
- Responsive row heights based on window duration
- Maintains 6-20px base unit range for readability

### "Other" Bucket
- Automatically groups excess domains into an "Other" bucket
- Max columns per window:
  - 15-20 min: 4 columns
  - 30-60 min: 5-6 columns
  - 90-120 min: 8 columns

### Visual Indicators
- **Solid bars**: Active time
- **Striped bars**: Background time
- **Empty windows**: Dashed border with "No activity" label
- **Guide lines**: Adaptive intervals based on window size

### Interactive Tooltip
Shows:
- Window time range (e.g., "9:00 - 9:30")
- Domain name
- Active, Background, and Total minutes
- URL path (if provided, truncated to 40 chars)

### Accessibility
- Colors generated with WCAG AA contrast compliance
- Striped pattern distinguishes background (not color alone)
- Semantic HTML structure
- Screen reader friendly

## Color System

Colors are generated from domain strings using the `getDomainColor()` utility:
- Consistent color per domain across all charts
- HSL-based with 60-70% saturation and 45-55% lightness
- Avoids problematic hues for colorblind users
- `_other` domain always uses gray (#9e9e9e)

## Grid System Details

### Unit Calculation
```
baseUnit = floor(containerWidth / totalUnits)
baseUnit = clamp(baseUnit, 6px, 20px)

Each bar = 3 units
Gap between bars = 1 unit
Gap between windows = 2 units
```

### Row Heights
```
15 min window  → 10px rows (150px total)
20 min window  → 8px rows  (160px total)
30 min window  → 6px rows  (180px total)
60 min window  → 4px rows  (240px total)
90 min window  → 3px rows  (270px total)
120 min window → 2px rows  (240px total)
```

### Guide Lines
Intervals adapt to window size:
- 15-30 min: Every 5 minutes
- 60 min: Every 10 minutes
- 90 min: Every 15 minutes
- 120 min: Every 20 minutes

## Styling

The component uses:
1. **Vuetify props** for spacing and layout (`d-flex`, `pa-4`, etc.)
2. **Scoped CSS** for grid-specific styling
3. **Inline styles** for dynamic grid positioning

To customize:
- Override `.activity-stacked-bars` for container styling
- Adjust `gridConfig` calculation for different dimensions
- Modify `getDomainColor()` for custom color scheme
