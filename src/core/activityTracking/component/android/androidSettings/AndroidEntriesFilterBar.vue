<template>
	<div class="flex-fill d-flex flex-column flex-md-row align-md-center ga-3 ga-md-4">
		<MergedInputs>
			<template #first>
				<VTextField
					v-model="filter.appLabel"
					:label="$t('activityTracking.settings.appLabel')"
					density="compact"
					:hideDetails="patternError == null"
					:errorMessages="patternError ?? []"
					clearable
					@keyup.enter="emit('filter')"
				/>
			</template>
			<template #second>
				<VSelect
					v-model="filter.appLabelMatchType"
					:items="matchTypeOptions"
					density="compact"
					hideDetails
					style="max-width: 130px"
				/>
			</template>
		</MergedInputs>
		<MergedInputs>
			<template #first>
				<VTextField
					v-model="filter.packageName"
					:label="$t('activityTracking.settings.packageName')"
					density="compact"
					hideDetails
					:error="patternError != null"
					clearable
					@keyup.enter="emit('filter')"
				/>
			</template>
			<template #second>
				<VSelect
					v-model="filter.packageNameMatchType"
					:items="matchTypeOptions"
					density="compact"
					hideDetails
					style="max-width: 130px"
				/>
			</template>
		</MergedInputs>
		<!-- A toggle applies on click, unlike the text fields, which wait for Filter / Enter. -->
		<MappingCoverageToggle
			v-model="filter.coverage"
			@change="emit('filter')"
		/>
		<VBtn
			color="primary"
			prependIcon="magnifying-glass"
			@click="emit('filter')"
		>
			{{ $t('general.filter') }}
		</VBtn>
	</div>
</template>

<script setup lang="ts">
	import MergedInputs from '@/_common/component/inputs/MergedInputs.vue'
	import MappingCoverageToggle from '@/core/activityTracking/component/settings/MappingCoverageToggle.vue'
	import { PatternMatchType } from '@/_common/dto/enum/PatternMatchType.ts'
	import type { AndroidDistinctEntriesFilterRequest } from '@/core/activityTracking/dto/request/android/settings/AndroidDistinctEntriesFilterRequest.ts'

	/** Set when *Save* found no pattern (F72) — every pattern field turns red, the first one says why. */
	const { patternError = null } = defineProps<{ patternError?: string | null }>()
	const emit = defineEmits<{ filter: [] }>()
	const filter = defineModel<AndroidDistinctEntriesFilterRequest>({ required: true })
	const matchTypeOptions: PatternMatchType[] = [
		PatternMatchType.Exact,
		PatternMatchType.Wildcard,
		PatternMatchType.Contains,
		PatternMatchType.Regex,
	]
</script>
