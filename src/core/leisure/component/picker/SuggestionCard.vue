<template>
	<VCard class="d-flex flex-column h-100">
		<VCardItem>
			<template #prepend>
				<VAvatar
					:color="suggestion.activity.color ?? meta.color"
					size="44"
					variant="tonal"
				>
					<VIcon
						:icon="suggestion.activity.icon ?? meta.icon"
						size="20"
					/>
				</VAvatar>
			</template>
			<VCardTitle class="text-wrap text-subtitle-1 font-weight-bold">
				{{ suggestion.activity.name || $t('leisure.picker.untitledActivity') }}
			</VCardTitle>
			<VCardSubtitle v-if="suggestion.activity.categoryName">
				{{ suggestion.activity.categoryName }}
			</VCardSubtitle>
		</VCardItem>

		<VCardText class="pt-0 flex-grow-1">
			<VChip
				:color="meta.color"
				:prependIcon="meta.icon"
				variant="tonal"
				size="small"
				class="mb-3"
			>
				{{ $t(meta.labelKey) }}
			</VChip>
			<!-- The "why": the facts the ranking actually matched on, not a generic blurb. -->
			<div class="d-flex flex-column ga-1">
				<div
					v-for="reason in reasons"
					:key="reason.label"
					class="d-flex align-center ga-2 text-body-2 text-medium-emphasis"
				>
					<VIcon
						:icon="reason.icon"
						size="14"
					/>
					<span>{{ reason.label }}</span>
				</div>
			</div>
		</VCardText>

		<VCardActions
			v-if="plannedSlot === null"
			class="px-4 pb-4 pt-0 d-flex ga-2"
		>
			<VBtn
				class="text-none flex-grow-1"
				color="primary"
				prependIcon="fas fa-play"
				:loading="busy"
				@click="emit('commit', null)"
			>
				{{ $t('leisure.picker.doItNow') }}
			</VBtn>
			<VBtn
				class="text-none"
				variant="text"
				color="secondaryOutline"
				:disabled="busy"
				@click="openPlanLater"
			>
				{{ $t('leisure.picker.planLater') }}
			</VBtn>
		</VCardActions>

		<!-- Committed. The card stops offering and starts confirming — this is the whole point of the
		     screen, so it gets to say plainly what is now in the plan and where to find it. -->
		<VCardActions
			v-else
			class="px-4 pb-4 pt-0 d-flex align-center ga-2 flex-wrap"
		>
			<VIcon
				icon="fas fa-circle-check"
				color="success"
				size="18"
			/>
			<span class="text-body-2">
				{{
					$t('leisure.picker.plannedAt', {
						from: plannedSlot.startTime.getString(),
						to: plannedSlot.endTime.getString(),
					})
				}}
			</span>
			<VBtn
				class="text-none ms-auto"
				variant="text"
				color="primaryOutline"
				size="small"
				:to="plannerRoute"
			>
				{{ $t('leisure.picker.openPlanner') }}
			</VBtn>
		</VCardActions>
	</VCard>
</template>

<script setup lang="ts">
	import { computed } from 'vue'
	import { useI18n } from 'vue-i18n'
	import { useDialog } from '@/_common/composable/general/useDialog.ts'
	import type { Time } from '@/_common/dto/dto/Time.ts'
	import PlanLaterDialog from '@/core/leisure/component/picker/PlanLaterDialog.vue'
	import { SOURCE_META } from '@/core/leisure/component/picker/sourceMeta.ts'
	import { slotMinutesFor, type PickerConstraints } from '@/core/leisure/composable/leisureScoring.ts'
	import type { LeisureSuggestion } from '@/core/leisure/composable/useLeisurePicker.ts'
	import { usePickerLabels } from '@/core/leisure/composable/usePickerLabels.ts'
	import { todayPlannerRoute } from '@/core/leisure/composable/useLeisureCommitment.ts'
	import { fitsToday } from '@/core/leisure/composable/useWeatherFit.ts'
	import type { WeatherFit } from '@/core/leisure/dto/response/WeatherFit.ts'

	const {
		suggestion,
		constraints,
		weatherFit = null,
		busy = false,
		plannedSlot = null,
	} = defineProps<{
		suggestion: LeisureSuggestion
		constraints: PickerConstraints
		/** `null` while unresolved or unavailable — the card must render exactly as it would without it. */
		weatherFit?: WeatherFit | null
		busy?: boolean
		/** Set once this card has been committed to; the actions become a confirmation. */
		plannedSlot?: { startTime: Time; endTime: Time } | null
	}>()

	const emit = defineEmits<{ commit: [startTime: Time | null] }>()

	const i18n = useI18n()
	const { durationLabel } = usePickerLabels()
	const { openDialog } = useDialog()

	const meta = computed(() => SOURCE_META[suggestion.source])
	const plannerRoute = todayPlannerRoute()
	const slotMinutes = computed(() => slotMinutesFor(suggestion, constraints))

	interface Reason {
		icon: string
		label: string
	}

	const reasons = computed<Reason[]>(() => {
		const list: Reason[] = []

		list.push({
			icon: 'far fa-clock',
			label:
				suggestion.statedDurationMinutes === null
					? i18n.t('leisure.picker.reasonFits', { duration: durationLabel(slotMinutes.value) })
					: i18n.t('leisure.picker.reasonDuration', {
							duration: durationLabel(suggestion.statedDurationMinutes),
						}),
		})

		// An energy the schema states and one this module inferred from difficulty or comfort step are
		// not the same claim, and the card should not pretend otherwise.
		const energy = i18n.t(`enums.energyLevel.${suggestion.energyLevel}`)
		list.push({
			icon: 'fas fa-bolt',
			label: suggestion.energyIsDerived
				? i18n.t('leisure.picker.reasonEnergyDerived', { energy })
				: i18n.t('leisure.picker.reasonEnergy', { energy }),
		})

		if (suggestion.contextLabel !== null) {
			list.push({ icon: meta.value.icon, label: suggestion.contextLabel })
		}
		if (suggestion.comfortZoneStep !== null) {
			list.push({
				icon: 'fas fa-shoe-prints',
				label: i18n.t('leisure.picker.reasonComfortStep', { step: suggestion.comfortZoneStep }),
			})
		}
		if (fitsToday(suggestion.weatherDependencyId, weatherFit)) {
			list.push({ icon: 'fas fa-cloud-sun', label: i18n.t('leisure.picker.reasonWeatherFit') })
		}
		return list
	})

	async function openPlanLater() {
		const startTime = await openDialog<Time>({
			component: PlanLaterDialog,
			componentProps: {
				activityName: suggestion.activity.name,
				slotMinutes: slotMinutes.value,
			},
			dialogProps: {
				title: i18n.t('leisure.picker.planLater'),
				persistent: false,
				confirmBtnLabel: i18n.t('leisure.picker.addToPlan'),
				isSmall: true,
			},
		})
		if (startTime !== null) {
			emit('commit', startTime)
		}
	}
</script>
