<template>
	<div class="d-flex align-center flex-wrap ga-1">
		<VChip
			size="small"
			variant="tonal"
			color="primaryOutline"
			prependIcon="lightbulb"
		>
			{{ $t('activityTracking.settings.suggestion.suggested', { activity: suggestion.activityName }) }}
		</VChip>
		<span class="text-caption text-medium-emphasis">
			{{
				$t('activityTracking.settings.suggestion.seenIn', {
					count: suggestion.sessionCount,
					total: suggestion.activitySessionCount,
					activity: suggestion.activityName,
				})
			}}
		</span>
		<VBtn
			size="small"
			variant="text"
			color="primary"
			:loading="creating"
			@click="accept"
		>
			{{ $t('activityTracking.settings.suggestion.createRule') }}
		</VBtn>
		<VBtn
			size="small"
			variant="text"
			:disabled="creating"
			@click="emit('dismiss')"
		>
			{{ $t('activityTracking.settings.suggestion.notThis') }}
		</VBtn>
	</div>
</template>

<script setup lang="ts">
	import { ref } from 'vue'
	import { useI18n } from 'vue-i18n'
	import { useDialog } from '@/_common/composable/general/useDialog.ts'
	import type { MappingSuggestion } from '@/core/activityTracking/dto/response/MappingSuggestion.ts'

	/**
	 * The *Rule* cell of an undecided row whose process or app the user's own timers point at one activity (FO9),
	 * shared by the desktop and android grids. Never applied on its own: a rule re-attributes every future record and
	 * can tick off the plan, and nothing would announce a wrong one — so accepting says what the rule will do before
	 * `createRule` runs. The grid supplies the create, since the two rule shapes differ.
	 */
	const { suggestion, createRule } = defineProps<{
		suggestion: MappingSuggestion
		createRule: (suggestion: MappingSuggestion) => Promise<unknown>
	}>()
	const emit = defineEmits<{ created: []; dismiss: [] }>()
	const { t } = useI18n()
	const { confirm } = useDialog()

	const creating = ref(false)

	async function accept() {
		const confirmed = await confirm({
			title: t('activityTracking.settings.suggestion.confirmTitle'),
			text: t('activityTracking.settings.suggestion.confirmText', {
				name: suggestion.subject,
				activity: suggestion.activityName,
			}),
			detail: t('activityTracking.settings.suggestion.confirmDetail', { activity: suggestion.activityName }),
			confirmBtnLabel: t('activityTracking.settings.suggestion.createRule'),
		})
		if (!confirmed) return

		creating.value = true
		try {
			await createRule(suggestion)
			emit('created')
		} catch {
			// The create's own interceptor has already shown the error; the chip stays so the user can retry.
		} finally {
			creating.value = false
		}
	}
</script>
