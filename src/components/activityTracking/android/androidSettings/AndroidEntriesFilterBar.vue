<template>
	<div class="flex-fill d-flex flex-column flex-md-row align-md-center ga-3 ga-md-4">
		<MergedInputs>
			<template #first>
				<VTextField
					v-model="filter.appLabel"
					label="App Label"
					density="compact"
					hideDetails
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
					label="Package Name"
					density="compact"
					hideDetails
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
		<VBtn
			color="primary"
			prependIcon="magnifying-glass"
			@click="emit('filter')"
		>
			Filter
		</VBtn>
	</div>
</template>

<script setup lang="ts">
	import MergedInputs from '@/components/general/MergedInputs.vue'
	import { PatternMatchType } from '@/dtos/enum/PatternMatchType.ts'
	import type { AndroidDistinctEntriesFilterRequest } from '@/dtos/request/activityTracking/android/settings/AndroidDistinctEntriesFilterRequest.ts'

	const emit = defineEmits<{ filter: [] }>()
	const filter = defineModel<AndroidDistinctEntriesFilterRequest>({ required: true })
	const matchTypeOptions: PatternMatchType[] = [
		PatternMatchType.Exact,
		PatternMatchType.Wildcard,
		PatternMatchType.Contains,
		PatternMatchType.Regex,
	]
</script>
