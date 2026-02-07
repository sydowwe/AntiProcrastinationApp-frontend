# ActivitySummaryCards

Displays top domain activity statistics with active/background time breakdown and comparison against historical average.

## Components

- **ActivitySummaryCards.vue** — Parent container with baseline selector and card grid
- **ActivityDomainCard.vue** — Individual domain card
- **ActivityStatColumn.vue** — Reusable stat column (used for active/background)
- **BaselineSelector.vue** — Dropdown for selecting average comparison baseline

## Usage

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { ActivitySummaryCards, type DomainSummary, type BaselineType, type BaselineOption } from '@/components/activitySummary';

const selectedBaseline = ref<BaselineType>('last7days');
const loading = ref(false);

const baselineOptions: BaselineOption[] = [
  { value: 'last7days', label: 'Last 7 days' },
  { value: 'last30days', label: 'Last 30 days' },
  { value: 'sameWeekday', label: 'Same weekday' },
  { value: 'allTime', label: 'All time' },
];

const domains = ref<DomainSummary[]>([
  {
    domain: 'github.com',
    active: { seconds: 6300, averageSeconds: 5625, percentChange: 12 },
    background: { seconds: 1500, averageSeconds: 1630, percentChange: -8 },
    isNew: false,
  },
  // ... more domains
]);

function handleBaselineChange(baseline: BaselineType) {
  selectedBaseline.value = baseline;
  // Refetch data with new baseline
}

function handleDomainClick(domain: string) {
  console.log('Clicked:', domain);
  // Handle click (e.g., highlight in chart, navigate to details)
}
</script>

<template>
  <ActivitySummaryCards
    :domains="domains"
    :baselineOptions="baselineOptions"
    :selectedBaseline="selectedBaseline"
    :loading="loading"
    @update:selectedBaseline="handleBaselineChange"
    @domainClick="handleDomainClick"
  />
</template>
```

## Props

### ActivitySummaryCards

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `domains` | `DomainSummary[]` | Yes | - | Array of domain statistics |
| `baselineOptions` | `BaselineOption[]` | Yes | - | Available baseline comparison options |
| `selectedBaseline` | `BaselineType` | Yes | - | Currently selected baseline |
| `loading` | `boolean` | No | `false` | Shows skeleton loaders when true |

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `update:selectedBaseline` | `BaselineType` | Emitted when user changes baseline selection |
| `domainClick` | `string` (domain name) | Emitted when user clicks a domain card |

## Types

```typescript
interface DomainSummary {
  domain: string;
  active: ActivityStat | null;      // null if user disabled active tracking
  background: ActivityStat | null;  // null if user disabled background tracking
  isNew: boolean;                   // no historical data for comparison
}

interface ActivityStat {
  seconds: number;
  averageSeconds: number | null;    // null if isNew
  percentChange: number | null;     // null if isNew, positive = above avg, negative = below
}

type BaselineType = 'last7days' | 'last30days' | 'sameWeekday' | 'allTime';

interface BaselineOption {
  value: BaselineType;
  label: string;  // e.g., "Last 7 days", "Same weekday", etc.
}
```

## Features

### Time Formatting
Uses the `formatDuration()` utility from `@/utils/formatDuration.ts`:
- `0` → "0m"
- `45` → "45s"
- `90` → "1m"
- `3600` → "1h"
- `3660` → "1h 1m"
- `7200` → "2h"

### Comparison Indicators
- **NEW** badge: No historical data available
- **▲ X%** (green): Above average
- **▼ X%** (red): Below average
- **━ 0%** (neutral): No change
- **-**: No data

### Card Behavior
- Only shows domains with non-zero activity
- If user disabled one tracking type (active or background), shows only one column
- Clickable with hover and keyboard navigation
- Domain names truncate with ellipsis, full name in tooltip

### Responsive Design
- Cards wrap to multiple rows
- On smaller screens, cards stack or show fewer per row
- Minimum card width ensures readability
- Maximum 5 cards recommended (controlled by parent via props)

### Loading & Empty States
- Skeleton loaders during data fetch
- Empty state message when no activity recorded

### Accessibility
- Cards are focusable and keyboard navigable (Enter/Space)
- Aria labels for comparison indicators
- Color indicators supplemented with text symbols (▲▼━)

## Example

See `ActivitySummaryCards.example.vue` for a complete working example with sample data.
