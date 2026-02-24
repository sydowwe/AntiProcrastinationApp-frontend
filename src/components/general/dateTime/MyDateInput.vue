<template>
<div class="d-flex align-center">
	<VIconBtn
		v-if="props.dateShowArrows"
		icon="fa-solid fa-chevron-left"
		variant="text"
		:density="density"
		@click="prevDay"
	/>
	<VDateInput
		v-bind="$attrs"
		v-model="date"
		label="Date"
		hideDetails
		:density="density"
		style="min-width: 150px; max-width: 150px"
	/>
	<VIconBtn
		v-if="props.dateShowArrows"
		icon="fa-solid fa-chevron-right"
		variant="text"
		:density="density"
		@click="nextDay"
	/>
</div>
</template>

<script lang="ts">
export default {inheritAttrs: false}
</script>

<script setup lang="ts">
import {computed, useAttrs} from 'vue';
import {VDateInput} from 'vuetify/labs/components';

const props = defineProps({
	dateShowArrows: {
		type: Boolean,
		default: true,
	},
});

const attrs = useAttrs();
const density = computed(() => (attrs.density as 'default' | 'comfortable' | 'compact') ?? 'comfortable');

const date = defineModel<Date>({required: true})

function prevDay() {
	const d = new Date(date.value)
	d.setDate(d.getDate() - 1)
	date.value = d
}

function nextDay() {
	const d = new Date(date.value)
	d.setDate(d.getDate() + 1)
	date.value = d
}
</script>

<style scoped>

</style>
