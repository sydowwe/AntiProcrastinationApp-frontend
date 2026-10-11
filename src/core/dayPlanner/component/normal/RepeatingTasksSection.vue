<!-- RepeatingTasksSection.vue -->
<template>
	<div>
		<div class="d-flex align-center ga-2 mb-3">
			<VIcon
				icon="rotate"
				size="16"
				class="text-medium-emphasis"
			/>
			<span class="section-label">{{ $t('planner.misc.suggestions') }}</span>
			<VChip
				size="x-small"
				color="primaryOutline"
				variant="tonal"
			>
				{{ visibleTasks.length }}
			</VChip>
		</div>
		<div
			v-auto-animate
			class="d-flex flex-column ga-2"
		>
			<VCard
				v-for="task in visibleTasks"
				:key="task.key"
				class="pa-3"
				variant="outlined"
				:color="addedIds?.has(task.key) ? 'success' : undefined"
				:style="task.isAutomatic ? 'opacity: 0.75' : undefined"
				rounded="lg"
			>
				<div class="d-flex align-center ga-2">
					<VSheet
						:color="task.color || task.activity.role?.color || 'primary'"
						width="10"
						height="10"
						rounded="circle"
						class="flex-shrink-0"
					/>
					<div class="flex-fill min-width-0">
						<div class="d-flex align-center ga-1 flex-wrap">
							<span class="text-body-2 font-weight-medium text-truncate">
								{{ task.activity.name }}
							</span>
							<VChip
								v-if="task.sourceType === 'PlannedPattern'"
								size="x-small"
								color="secondary"
								variant="tonal"
								class="flex-shrink-0"
							>
								{{ $t('planner.misc.autoPlanned') }}
							</VChip>
							<VChip
								v-else-if="task.sourceType === 'HistoryPattern'"
								size="x-small"
								color="primaryOutline"
								variant="tonal"
								class="flex-shrink-0"
							>
								{{ $t('planner.misc.autoTracked') }}
							</VChip>
						</div>
						<div class="text-caption text-medium-emphasis">
							{{ task.startTime.getString() }} – {{ task.endTime.getString() }}
						</div>
						<!-- Why it is suggested today: the rule that matched, and for a pattern how often it was seen. -->
						<div
							v-if="whyCaption(task)"
							class="text-caption text-medium-emphasis d-flex align-center ga-1"
						>
							<VIcon
								icon="rotate"
								size="10"
								class="flex-shrink-0"
							/>
							<span>{{ whyCaption(task) }}</span>
						</div>
						<VChip
							v-if="task.importance"
							:color="task.importance.color"
							size="x-small"
							variant="tonal"
							class="mt-1"
						>
							<VIcon
								v-if="task.importance.icon"
								:icon="task.importance.icon"
								size="10"
								class="mr-1"
							/>
							{{ task.importance.text }}
						</VChip>
					</div>
					<!-- FO11: a pattern the user no longer follows. Never on a user-set row — that is their own rule. -->
					<VTooltip
						v-if="task.isAutomatic && !addedIds?.has(task.key)"
						location="top"
						:text="$t('planner.misc.notAnyMore')"
					>
						<template #activator="{ props: tooltipProps }">
							<VIconBtn
								v-bind="tooltipProps"
								icon="xmark"
								size="small"
								variant="text"
								:aria-label="$t('planner.misc.dismissSuggestion', { name: task.activity.name })"
								@click="dismiss(task)"
							/>
						</template>
					</VTooltip>
					<VIconBtn
						v-if="!addedIds?.has(task.key)"
						icon="plus"
						size="small"
						color="primary"
						variant="tonal"
						@click="emit('add', task)"
					/>
					<VIcon
						v-else
						icon="check"
						size="16"
						color="success"
					/>
				</div>
			</VCard>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { computed, ref } from 'vue'
	import { useI18n } from 'vue-i18n'
	import type { SuggestionResponse } from '@/core/dayPlanner/dto/response/SuggestionResponse.ts'
	import { DismissSuggestionRequest } from '@/core/dayPlanner/dto/request/DismissSuggestionRequest.ts'
	import { useRecurrenceSummary } from '@/core/dayPlanner/composable/useRecurrenceSummary.ts'
	import { useRepeatingPlannerTaskApi } from '@/core/dayPlanner/api/repeatingPlannerTaskApi.ts'
	import { useSnackbar } from '@/_common/composable/general/SnackbarComposable.ts'

	const { tasks, addedIds } = defineProps<{
		tasks: SuggestionResponse[]
		addedIds?: Set<string>
	}>()

	const emit = defineEmits<{
		add: [task: SuggestionResponse]
	}>()

	const { t } = useI18n()
	const { describeRule } = useRecurrenceSummary()
	const { dismissSuggestion, undoDismissSuggestion } = useRepeatingPlannerTaskApi()
	const { showSuccessSnackbar } = useSnackbar()

	// Rows dismissed while this list is on screen. The server already leaves them out of the next fetch, so this
	// only spares the user a reload; a failed dismissal or an undo takes the key back out.
	const dismissedKeys = ref(new Set<string>())
	const visibleTasks = computed(() => tasks.filter(task => !dismissedKeys.value.has(task.key)))

	async function dismiss(task: SuggestionResponse) {
		const request = DismissSuggestionRequest.fromSuggestion(task)
		if (!request) {
			return
		}
		dismissedKeys.value.add(task.key)
		try {
			await dismissSuggestion(request)
		} catch {
			// The interceptor has already said why; the row comes back.
			dismissedKeys.value.delete(task.key)
			return
		}
		// A dismissal hides the pattern for weeks, so a stray tap needs a way back that is not a settings page.
		showSuccessSnackbar(
			t('planner.misc.suggestionDismissed', { name: task.activity.name, rule: describeRule(task) }),
			{
				actionLabel: t('planner.a11y.undo'),
				actionCallback: () => void undoDismiss(task, request),
			},
		)
	}

	async function undoDismiss(task: SuggestionResponse, request: DismissSuggestionRequest) {
		try {
			await undoDismissSuggestion(request)
			dismissedKeys.value.delete(task.key)
		} catch {
			// The interceptor has already said why; the row stays hidden, as it is on the server.
		}
	}

	function whyCaption(task: SuggestionResponse): string {
		const parts = [describeRule(task)]
		if (task.occurrenceCount !== null) {
			parts.push(t('planner.misc.seenCount', { count: task.occurrenceCount }))
		}
		return parts.filter(Boolean).join(' · ')
	}
</script>

<style scoped>
	.section-label {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		color: rgba(var(--v-theme-on-surface), 0.5);
	}
</style>
