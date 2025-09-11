<template>
<VCheckbox
	:model-value="model"
	:indeterminate="isIndeterminate"
	@click="toggleState"
	indeterminate-icon="square-xmark"
	:label="label"
	:hideDetails
>
	<template #label>
		<span>{{ label }}</span>
	</template>
</VCheckbox>
</template>

<script setup lang="ts">
import {computed} from 'vue';
import {VCheckbox} from 'vuetify/components';
import {NullFalseTrueCheckboxStates} from '@/classes/Generic'

const props = defineProps({
	label: {
		type: String,
		default: '',
	},
	hideDetails: {
		type: Boolean,
		default: false,
	},
});

const model = defineModel<boolean | null>({default: null, required: true});

const isIndeterminate = computed(() => model.value === false);

const toggleState = (e: PointerEvent) => {
	e.preventDefault();
	const currentIndex = NullFalseTrueCheckboxStates.indexOf(model.value);
	const nextIndex = (currentIndex + 1) % NullFalseTrueCheckboxStates.length;
	model.value = NullFalseTrueCheckboxStates[nextIndex];
};
</script>

<style scoped>
.v-checkbox--indeterminate .v-checkbox__input {
	background-color: rgba(0, 0, 0, 0.12);
}
</style>