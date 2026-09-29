import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import i18n from '@/i18n.ts'
import {
	buildBuiltInLookup,
	groupSkipReasons,
	type BuiltInLookup,
	type SkipReasonEntry,
	type SkipReasonGroup,
} from '@/core/dayPlanner/utils/skipReasonGroups.ts'

let builtInLookup: BuiltInLookup | null = null

/**
 * Every loaded locale's labels, not just the current one's: text that folds onto an SK label has to be
 * recognised while the account is in EN. Read once — the messages are bundled, not loaded at runtime.
 */
function getBuiltInLookup(): BuiltInLookup {
	builtInLookup ??= buildBuiltInLookup(
		i18n.global.availableLocales.map(locale => {
			const messages = i18n.global.getLocaleMessage(locale) as unknown as {
				planner?: { skipReason?: Record<string, unknown> }
			}
			return messages.planner?.skipReason ?? {}
		}),
	)
	return builtInLookup
}

/** Groups the given entries by the rule in `skipReasonGroups.ts`, and labels a group for display. */
export function useSkipReasonSummary(entries: () => SkipReasonEntry[]) {
	const { t } = useI18n()

	const summary = computed(() => groupSkipReasons(entries(), getBuiltInLookup()))

	function groupLabel(group: SkipReasonGroup): string {
		return group.kind === 'builtIn' ? t(`planner.skipReason.${group.reason}`) : group.text
	}

	return { summary, groupLabel }
}
