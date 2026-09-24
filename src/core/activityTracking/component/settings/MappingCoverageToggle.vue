<template>
	<MyBtnToggle
		:modelValue="model ?? MappingCoverage.All"
		:label="$t('activityTracking.settings.coverage.filterLabel')"
		mandatory
		density="compact"
		color="primaryOutline"
		variant="outlined"
		style="border-color: rgba(var(--v-theme-on-surface), 0.3) !important; height: 40px; flex-shrink: 0"
		@update:modelValue="select"
	>
		<VBtn
			v-for="option in options"
			:key="option"
			:value="option"
			height="40"
		>
			{{ $t(`activityTracking.settings.coverage.${option}`) }}
		</VBtn>
	</MyBtnToggle>
</template>

<script setup lang="ts">
	import MyBtnToggle from '@/_common/component/inputs/MyBtnToggle.vue'
	import { MappingCoverage } from '@/core/activityTracking/dto/enum/MappingCoverage.ts'

	const emit = defineEmits<{ change: [] }>()
	/**
	 * The three-way `coverage` filter of a distinct-entries grid (B24). `All` is the server's default and
	 * is modelled as `null` so the request carries no opinion — the same convention as every other
	 * nullable filter field.
	 */
	const model = defineModel<MappingCoverage | null>({ default: null })
	const options = [MappingCoverage.All, MappingCoverage.Uncovered, MappingCoverage.Covered]

	function select(value: MappingCoverage) {
		model.value = value === MappingCoverage.All ? null : value
		emit('change')
	}
</script>
