<template>
<v-checkbox
	:value="state"
	:indeterminate="isIndeterminate"
	@click="toggleState"
	:label="label"
	:class="{'v-checkbox--indeterminate': isIndeterminate}"
>
	<template #label>
		<span>{{ label }}</span>
	</template>
</v-checkbox>
</template>

<script setup>
import { ref, computed } from 'vue';
import { VCheckbox } from 'vuetify/components';

const props = defineProps({
	modelValue: {
		type: String,
		default: 'unchecked',
	},
	label: {
		type: String,
		default: '',
	},
});

const emit = defineEmits(['update:modelValue']);

const states = ['checked', 'indeterminate', 'unchecked'];
const state = ref(props.modelValue);

const isIndeterminate = computed(() => state.value === 'indeterminate');

const toggleState = () => {
	const currentIndex = states.indexOf(state.value);
	const nextIndex = (currentIndex + 1) % states.length;
	state.value = states[nextIndex];
	emit('update:modelValue', state.value);
};
</script>

<style scoped>
.v-checkbox--indeterminate .v-checkbox__input {
	background-color: rgba(0, 0, 0, 0.12);
}
</style>
