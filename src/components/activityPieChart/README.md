# Activity Pie Chart Section

A comprehensive component for visualizing domain activity distribution with an interactive pie chart and detailed statistics panel.

## Components

- **ActivityPieChartSection.vue** - Parent container component
- **ActivityPieChart.vue** - Interactive pie chart with view mode toggle
- **ActivityDetailsPanel.vue** - Details display panel
- **DomainDetailsList.vue** - List of pages visited for a domain

## Usage

```vue
<template>
  <ActivityPieChartSection
    :domains="domains"
    :dayTotals="dayTotals"
    :loading="loading"
    :otherThresholdPercent="3"
    @domainSelect="handleDomainSelect"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ActivityPieChartSection from '@/components/activitySummary/ActivityPieChartSection.vue'

// Example data
const loading = ref(false)

const domains = ref([
  {
    domain: 'github.com',
    activeSeconds: 6300,     // 1h 45m
    backgroundSeconds: 1500,  // 25m
    totalSeconds: 7800,       // 2h 10m
    entries: 23,
    pages: [
      { url: 'https://github.com/user/repo/pulls', seconds: 2700 },
      { url: 'https://github.com/user/repo/issues', seconds: 1920 },
      { url: 'https://github.com/notifications', seconds: 1080 },
    ]
  },
  {
    domain: 'stackoverflow.com',
    activeSeconds: 3600,
    backgroundSeconds: 900,
    totalSeconds: 4500,
    entries: 15,
    pages: [
      { url: 'https://stackoverflow.com/questions/12345', seconds: 1800 },
    ]
  },
  // ... more domains
])

const dayTotals = ref({
  totalSeconds: 19920,      // 5h 32m
  activeSeconds: 15000,     // 4h 10m
  backgroundSeconds: 4920,  // 1h 22m
  totalDomains: 12,
  totalPages: 45,
  totalVisits: 127,         // Optional
})

function handleDomainSelect(domain: string | null) {
  console.log('Selected domain:', domain)
  // Handle domain selection
}
</script>
```

## Props

### ActivityPieChartSection

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `domains` | `DomainPieData[]` | Yes | - | Array of domain activity data |
| `dayTotals` | `DayTotals` | Yes | - | Aggregate statistics for the period |
| `loading` | `boolean` | No | `false` | Show loading skeleton |
| `otherThresholdPercent` | `number` | No | `3` | Domains below this % grouped as "Other" |

### Types

```typescript
interface DomainPieData {
  domain: string
  activeSeconds: number
  backgroundSeconds: number
  totalSeconds: number
  pages: PageVisit[]
  entries?: number  // Number of window records
}

interface PageVisit {
  url: string
  seconds: number
}

interface DayTotals {
  totalSeconds: number
  activeSeconds: number
  backgroundSeconds: number
  totalDomains: number
  totalPages: number
  totalVisits?: number
}
```

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `domainSelect` | `string \| null` | Emitted when domain selected/deselected |

## Features

- **Interactive Pie Chart**: Click segments to view domain details
- **View Modes**: Toggle between Total, Active, and Background time
- **Smart Grouping**: Domains below threshold automatically grouped as "Other"
- **Consistent Colors**: Same domain always gets same color
- **Accessible**: WCAG AA compliant colors, keyboard navigation
- **Responsive**: Adapts to mobile/tablet screens
- **Loading States**: Skeleton loaders during data fetch
- **Empty States**: Graceful handling of no data

## Customization

### Color Generation

Colors are automatically generated from domain names using a consistent hash function. To customize colors, modify `src/utils/domainColor.ts`.

### Duration Formatting

Time formatting uses the `formatDuration` utility which leverages the existing `Time` class. Modify `src/utils/formatDuration.ts` to change formatting.

### "Other" Threshold

Adjust the `otherThresholdPercent` prop to control when domains are grouped:
- `3` (default): Domains with <3% of total time grouped as "Other"
- `5`: More domains shown individually
- `1`: Very small domains still shown individually

## Dependencies

- `echarts` - Charting library
- `vue-echarts` - Vue 3 wrapper for ECharts
- Vuetify 3 - UI components
