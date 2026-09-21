<template>
	<VChip
		v-if="coveredBy"
		:to="{ name: settingsRouteName, params: { tableView: 'mappings' }, query: { mappingId: coveredBy.mappingId } }"
		:color="chipColor"
		:prependIcon="chipIcon"
		size="small"
		variant="tonal"
		:title="$t('activityTracking.settings.coverage.editRule')"
	>
		{{ chipText }}
	</VChip>
	<span
		v-else
		class="text-medium-emphasis font-italic"
	>
		{{ $t('activityTracking.settings.coverage.undecided') }}
	</span>
</template>

<script setup lang="ts">
	import { computed } from 'vue'
	import { useI18n } from 'vue-i18n'
	import type { MappingCoverageResponse } from '@/core/activityTracking/dto/response/MappingCoverageResponse.ts'
	import { MappingCoverageTarget } from '@/core/activityTracking/dto/enum/MappingCoverage.ts'

	/**
	 * The *Rule* cell of a distinct-entries row (B24): the rule that already covers the tuple, linking to
	 * that rule on the Mappings tab, or a muted *undecided* when no active rule matches.
	 */
	const { coveredBy, settingsRouteName } = defineProps<{
		coveredBy: MappingCoverageResponse | null
		settingsRouteName: 'desktopSettings' | 'androidSettings'
	}>()
	const { t } = useI18n()

	const isIgnored = computed(() => coveredBy?.target === MappingCoverageTarget.Ignored)
	// `targetName` is null for Ignored by contract; the fallback on the other two targets only guards
	// a rule whose activity was deleted under it.
	const chipText = computed(() =>
		isIgnored.value
			? t('activityTracking.settings.coverage.ignored')
			: (coveredBy?.targetName ?? t('activityTracking.settings.coverage.rule')),
	)
	const chipColor = computed(() => (isIgnored.value ? 'textMuted' : 'secondaryOutline'))
	const chipIcon = computed(() => (isIgnored.value ? 'eye-slash' : 'link'))
</script>
