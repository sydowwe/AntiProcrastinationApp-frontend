<template>
	<VCard class="pa-4">
		<div class="d-flex flex-wrap ga-6 align-start">
			<div>
				<div class="text-caption text-medium-emphasis mb-1">{{ $t('leisure.picker.timeAvailable') }}</div>
				<VBtnToggle
					:modelValue="constraints.minutes"
					color="primary"
					variant="outlined"
					density="comfortable"
					divided
					mandatory
					@update:modelValue="setMinutes"
				>
					<VBtn
						v-for="minutes in TIME_OPTIONS"
						:key="minutes"
						:value="minutes"
						class="text-none"
					>
						{{ durationLabel(minutes) }}
					</VBtn>
				</VBtnToggle>
			</div>

			<div>
				<div class="text-caption text-medium-emphasis mb-1">{{ $t('leisure.picker.energyNow') }}</div>
				<VBtnToggle
					:modelValue="constraints.energy"
					color="primary"
					variant="outlined"
					density="comfortable"
					divided
					mandatory
					@update:modelValue="setEnergy"
				>
					<VBtn
						v-for="option in energyOptions"
						:key="option.value"
						:value="option.value"
						class="text-none"
					>
						{{ option.title }}
					</VBtn>
				</VBtnToggle>
			</div>

			<div>
				<div class="text-caption text-medium-emphasis mb-1">{{ $t('leisure.picker.whoIsAround') }}</div>
				<VBtnToggle
					:modelValue="constraints.people"
					color="primary"
					variant="outlined"
					density="comfortable"
					divided
					mandatory
					@update:modelValue="setPeople"
				>
					<VBtn
						v-for="option in peopleOptions"
						:key="option.value"
						:value="option.value"
						class="text-none"
					>
						{{ option.title }}
					</VBtn>
				</VBtnToggle>
			</div>

			<VBtn
				class="text-none align-self-center"
				variant="text"
				color="secondaryOutline"
				:prependIcon="showSecondary ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"
				@click="showSecondary = !showSecondary"
			>
				{{ $t('leisure.picker.moreConstraints') }}
			</VBtn>
		</div>

		<!-- Cost and location rarely decide anything, and a form that opens with five fields is the
		     filter panel this view exists to replace. They stay one click away. -->
		<div
			v-if="showSecondary"
			v-auto-animate
			class="d-flex flex-wrap ga-4 mt-4"
		>
			<VIdSelect
				:modelValue="constraints.maxCostTierId"
				:label="$t('leisure.picker.spendAtMost')"
				:items="costTierOptions"
				:placeholder="$t('leisure.picker.anyValue')"
				persistentPlaceholder
				density="compact"
				hideDetails
				style="min-width: 220px"
				@update:modelValue="setMaxCostTier"
			/>
			<VIdSelect
				:modelValue="constraints.locationTypeId"
				:label="$t('leisure.fields.locationType')"
				:items="locationTypeOptions"
				:placeholder="$t('leisure.picker.anyValue')"
				persistentPlaceholder
				density="compact"
				hideDetails
				style="min-width: 220px"
				@update:modelValue="setLocationType"
			/>
		</div>
	</VCard>
</template>

<script setup lang="ts">
	import { ref } from 'vue'
	import { useI18n } from 'vue-i18n'
	import type { LookupResponse } from '@/_common/dto/response/general/LookupResponse.ts'
	import { getEnumSelectOptions } from '@/_common/composable/general/EnumComposable.ts'
	import { EnergyLevel } from '@/core/leisure/dto/enum/EnergyLevel.ts'
	import type { PickerConstraints } from '@/core/leisure/composable/leisureScoring.ts'
	import { PEOPLE_OPTIONS, TIME_OPTIONS } from '@/core/leisure/composable/usePickerUrlState.ts'
	import { usePickerLabels } from '@/core/leisure/composable/usePickerLabels.ts'

	const { costTierOptions = [], locationTypeOptions = [] } = defineProps<{
		costTierOptions?: LookupResponse[]
		locationTypeOptions?: LookupResponse[]
	}>()

	const constraints = defineModel<PickerConstraints>({ required: true })

	const i18n = useI18n()
	const { durationLabel } = usePickerLabels()
	const showSecondary = ref(false)

	const energyOptions = getEnumSelectOptions(EnergyLevel, 'enums.energyLevel')
	const peopleOptions = PEOPLE_OPTIONS.map(value => ({
		value,
		title: i18n.t(`leisure.picker.people.${value === 1 ? 'alone' : value === 2 ? 'pair' : 'group'}`),
	}))

	// Replaced wholesale rather than mutated in place: the parent watches this object to decide
	// whether it needs a new pool, and a nested mutation makes that watch depend on `deep` semantics
	// the child would then own.
	function patch(changes: Partial<PickerConstraints>): void {
		constraints.value = { ...constraints.value, ...changes }
	}

	function setMinutes(value: unknown): void {
		if (typeof value === 'number') patch({ minutes: value })
	}

	function setEnergy(value: unknown): void {
		if (typeof value === 'string') patch({ energy: value as EnergyLevel })
	}

	function setPeople(value: unknown): void {
		if (typeof value === 'number') patch({ people: value })
	}

	function setMaxCostTier(value: unknown): void {
		patch({ maxCostTierId: typeof value === 'number' ? value : null })
	}

	function setLocationType(value: unknown): void {
		patch({ locationTypeId: typeof value === 'number' ? value : null })
	}
</script>
