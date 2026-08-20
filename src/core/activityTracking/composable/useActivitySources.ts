import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { getDomainColor } from '@/_common/utils/domainColor.ts'
import { ACTIVITY_SOURCE_ORDER, ActivitySource } from '@/core/activityTracking/dto/enum/ActivitySource.ts'

/**
 * THE COLOUR ENTRY POINT FOR THE MERGED VIEW — every unified surface goes through here and nothing
 * calls `getDomainColor()` directly.
 *
 * The three per-source dashboards each feed a different field to `getDomainColor()`: the web extension
 * its `domain`, desktop its `processName`, android its `packageName`. That is fine while a screen
 * shows one source. Merged it is not: `slack.exe` and `com.Slack` hash to different hues, so one
 * application appears twice on one page, in one name, in two colours — and the pie legend, the bar
 * segments and the timeline swatches would each disagree with the others.
 *
 * The fix is not a smarter hash. It is that the merged view has exactly **one** identity string per
 * item — `UnifiedActivityItem.label` — and derives display, selection and colour from that one string.
 * Joining `slack.exe` to `com.Slack` is the server's job because only the server holds the mapping
 * tables; where it cannot join them, two labels and two colours is the correct answer rather than a
 * failure. This function exists so no call site can quietly re-pick the field.
 */
export function unifiedItemColor(label: string): string {
	return getDomainColor(label)
}

export interface ActivitySourceOption {
	value: ActivitySource
	label: string
	icon: string
}

const SOURCE_ICONS: Record<ActivitySource, string> = {
	[ActivitySource.WebExtension]: 'fas fa-globe',
	[ActivitySource.Desktop]: 'fas fa-desktop',
	[ActivitySource.Android]: 'fa-brands fa-android',
}

/**
 * The three sources as the filter and the overlap note present them, always in
 * `ACTIVITY_SOURCE_ORDER` — which is also the precedence order, so a note reading "the browser
 * extension took precedence over the desktop agent" lists them the way the chips above it are laid
 * out.
 */
export function useActivitySources() {
	const { t } = useI18n()

	const sourceOptions = computed<ActivitySourceOption[]>(() =>
		ACTIVITY_SOURCE_ORDER.map(value => ({
			value,
			label: t(`activityTracking.sources.${value}`),
			icon: SOURCE_ICONS[value],
		})),
	)

	function sourceLabel(source: ActivitySource): string {
		return t(`activityTracking.sources.${source}`)
	}

	return { sourceOptions, sourceLabel }
}
