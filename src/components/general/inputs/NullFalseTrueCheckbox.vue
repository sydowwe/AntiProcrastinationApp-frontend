<template>
	<VCheckbox
		:modelValue="model"
		:indeterminate="isIndeterminate"
		indeterminateIcon="square-xmark"
		:label="label"
		:hideDetails
		@click="toggleState"
	>
		<template #label>
			<span>{{ label }}</span>
		</template>
	</VCheckbox>
</template>

<script setup lang="ts">
	import { computed } from 'vue'
	import { VCheckbox } from 'vuetify/components'
	import { NullFalseTrueCheckboxStates } from '@/dtos/enum/NullFalseTrueCheckboxStates.ts'

	withDefaults(
		defineProps<{
			label?: string
			hideDetails?: boolean
		}>(),
		{
			label: '',
			hideDetails: false,
		},
	)

	const model = defineModel<boolean | null>({ default: null, required: true })

	const isIndeterminate = computed(() => model.value === false)

	const toggleState = (e: PointerEvent) => {
		e.preventDefault()
		const currentIndex = NullFalseTrueCheckboxStates.indexOf(model.value)
		const nextIndex = (currentIndex + 1) % NullFalseTrueCheckboxStates.length
		model.value = NullFalseTrueCheckboxStates[nextIndex] ?? null
	}
</script>

<style scoped>
	.v-checkbox--indeterminate .v-checkbox__input {
		background-color: rgba(0, 0, 0, 0.12);
	}
</style>
