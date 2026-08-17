<template>
	<div class="py-4 d-flex flex-column ga-4">
		<div>
			<h2 class="text-h5">{{ $t('leisure.picker.title') }}</h2>
			<p class="text-body-2 text-medium-emphasis mb-0">{{ $t('leisure.picker.subtitle') }}</p>
		</div>

		<ConstraintBar
			v-model="constraints"
			:costTierOptions
			:locationTypeOptions
		/>

		<VRow v-if="loading && suggestions.length === 0">
			<VCol
				v-for="index in SUGGESTION_COUNT"
				:key="index"
				cols="12"
				md="4"
			>
				<VSkeletonLoader type="list-item-avatar-two-line, text, actions" />
			</VCol>
		</VRow>

		<template v-else-if="suggestions.length > 0">
			<VRow v-auto-animate>
				<VCol
					v-for="suggestion in suggestions"
					:key="suggestion.key"
					cols="12"
					md="4"
				>
					<SuggestionCard
						:suggestion
						:constraints
						:weatherFit
						:busy="busyKey === suggestion.key"
						:plannedSlot="plannedSlots[suggestion.key] ?? null"
						@commit="startTime => handleCommit(suggestion, startTime)"
					/>
				</VCol>
			</VRow>

			<div class="d-flex flex-wrap align-center ga-3">
				<VBtn
					class="text-none"
					variant="tonal"
					color="secondaryOutline"
					prependIcon="fas fa-shuffle"
					:loading="loading"
					@click="drawAgain"
				>
					{{ $t('leisure.picker.somethingElse') }}
				</VBtn>
				<!-- Deliberately quiet. The whole point of three cards is not to hand the user the list. -->
				<VBtn
					class="text-none"
					variant="text"
					color="secondaryOutline"
					size="small"
					:to="{ name: 'leisureBacklog' }"
				>
					{{ $t('leisure.picker.browseEverything') }}
				</VBtn>
			</div>
		</template>

		<VCard
			v-else
			class="pa-6 text-center"
			variant="tonal"
			color="secondaryOutline"
		>
			<VIcon
				:icon="emptyState.icon"
				size="32"
				class="mb-3"
			/>
			<p class="text-body-1 mb-4">{{ $t(emptyState.messageKey) }}</p>
			<div
				v-if="emptyState.kind !== 'failed'"
				class="d-flex flex-wrap justify-center ga-2"
			>
				<VBtn
					v-if="emptyState.kind === 'nothingFits' && nextLongerOption !== null"
					class="text-none"
					color="primary"
					@click="relaxTime"
				>
					{{ $t('leisure.picker.tryLonger', { duration: durationLabel(nextLongerOption) }) }}
				</VBtn>
				<VBtn
					v-if="emptyState.kind === 'nothingFits' && hasSecondaryConstraints"
					class="text-none"
					variant="tonal"
					color="secondaryOutline"
					@click="clearSecondaryConstraints"
				>
					{{ $t('leisure.picker.clearExtras') }}
				</VBtn>
				<VBtn
					class="text-none"
					variant="text"
					color="primaryOutline"
					:to="{ name: 'leisureBacklog' }"
				>
					{{ $t('leisure.picker.fillTheBacklog') }}
				</VBtn>
			</div>
		</VCard>
	</div>
</template>

<script setup lang="ts">
	import { computed, ref } from 'vue'
	import { useI18n } from 'vue-i18n'
	import type { Time } from '@/_common/dto/dto/Time.ts'
	import { useSnackbar } from '@/_common/composable/general/SnackbarComposable.ts'
	import ConstraintBar from '@/core/leisure/component/picker/ConstraintBar.vue'
	import SuggestionCard from '@/core/leisure/component/picker/SuggestionCard.vue'
	import { SUGGESTION_COUNT } from '@/core/leisure/composable/leisureScoring.ts'
	import { TIME_OPTIONS, usePickerUrlState } from '@/core/leisure/composable/usePickerUrlState.ts'
	import { useLeisurePicker, type LeisureSuggestion } from '@/core/leisure/composable/useLeisurePicker.ts'
	import { useLeisureCommitment, type PlannedSlot } from '@/core/leisure/composable/useLeisureCommitment.ts'
	import { recordSuggested } from '@/core/leisure/composable/suggestionHistory.ts'
	import { usePickerLabels } from '@/core/leisure/composable/usePickerLabels.ts'

	const i18n = useI18n()
	const { showSuccessSnackbar } = useSnackbar()
	const { durationLabel } = usePickerLabels()

	const { constraints, seed, reroll } = usePickerUrlState()
	const { suggestions, loading, poolCount, loadFailed, costTierOptions, locationTypeOptions, weatherFit } =
		useLeisurePicker(constraints, seed)
	const { commit } = useLeisureCommitment()

	/** Key of the card whose commit is in flight, so only that card shows a spinner. */
	const busyKey = ref<string | null>(null)
	/** Cards already committed to in this visit, by candidate key. */
	const plannedSlots = ref<Record<string, PlannedSlot>>({})

	/**
	 * Three different reasons for showing no cards, and they call for three different things being
	 * said. Collapsing them — "no results" — would blame the user for a failed request and offer to
	 * relax constraints that were never the problem.
	 */
	const emptyState = computed(() => {
		if (loadFailed.value) {
			return {
				kind: 'failed' as const,
				icon: 'fas fa-triangle-exclamation',
				messageKey: 'leisure.picker.emptyLoadFailed',
			}
		}
		if (poolCount.value === 0) {
			return {
				kind: 'nothingFiled' as const,
				icon: 'fas fa-box-open',
				messageKey: 'leisure.picker.emptyNothingFiled',
			}
		}
		return {
			kind: 'nothingFits' as const,
			icon: 'fas fa-filter-circle-xmark',
			messageKey: 'leisure.picker.emptyNothingFits',
		}
	})

	const nextLongerOption = computed(() => TIME_OPTIONS.find(minutes => minutes > constraints.value.minutes) ?? null)
	const hasSecondaryConstraints = computed(
		() => constraints.value.maxCostTierId !== null || constraints.value.locationTypeId !== null,
	)

	/**
	 * "Something else" records the rejected draw before redrawing. That is the only place staleness is
	 * written for a merely-shown suggestion: recording on render instead would mean a page reload
	 * demoted the very cards on screen, and a `?seed=` link would stop reproducing its own draw.
	 */
	function drawAgain(): void {
		recordSuggested(suggestions.value.map(suggestion => suggestion.key))
		reroll()
	}

	async function handleCommit(suggestion: LeisureSuggestion, startTime: Time | null): Promise<void> {
		busyKey.value = suggestion.key
		try {
			plannedSlots.value[suggestion.key] = await commit(suggestion, constraints.value, startTime)
			showSuccessSnackbar(i18n.t('leisure.picker.committed', { activity: suggestion.activity.name }))
		} catch {
			// The axios interceptor has already surfaced the failure; leaving the card in its offered
			// state is the honest outcome — nothing was planned, so nothing should claim it was.
		} finally {
			busyKey.value = null
		}
	}

	function relaxTime(): void {
		if (nextLongerOption.value !== null) {
			constraints.value = { ...constraints.value, minutes: nextLongerOption.value }
		}
	}

	function clearSecondaryConstraints(): void {
		constraints.value = { ...constraints.value, maxCostTierId: null, locationTypeId: null }
	}
</script>
