<template>
<div class="d-flex ga-4" :class="{'flex-column': isEdit}">
	<VSwitch class="mx-auto" v-model="isRepeated" label="Is repeated" color="secondaryOutline" hide-details></VSwitch>
	<div v-if="isRepeated" class="d-flex ga-4 align-center">
		<VNumberInput v-if="isEdit" label="Done count" v-model="doneCount" :min="0" :max="totalCount ?? 1"
		              :width="170" max-width="190" control-variant="split" hide-details></VNumberInput>
		<VNumberInput label="Total count" v-model="totalCount" :min="2" :width="180" max-width="190"
		              control-variant="split" hide-details></VNumberInput>
	</div>
</div>
</template>

<script setup lang="ts">
defineProps({
	isEdit: {
		type: Boolean,
		required: true,
	}
})
const isRepeated = defineModel<boolean>({required: true});

const doneCount = defineModel<number | null>('doneCount', {required: true});
const totalCount = defineModel<number | null>('totalCount', {required: true});
</script>

<style scoped>

</style>