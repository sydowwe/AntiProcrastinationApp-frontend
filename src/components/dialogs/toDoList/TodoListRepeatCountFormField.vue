<template>
	<div
		class="d-flex ga-4"
		:class="{ 'flex-column': isEdit }"
	>
		<VSwitch
			v-model="isRepeated"
			class="mx-auto"
			label="Is repeated"
			color="secondaryOutline"
			density="comfortable"
			hideDetails
		></VSwitch>
		<div
			v-if="isRepeated"
			class="my-2 mx-auto d-flex ga-4 align-center"
		>
			<VNumberInput
				v-if="isEdit"
				v-model="doneCount"
				label="Done count"
				:min="0"
				:max="totalCount ?? 1"
				:width="170"
				maxWidth="190"
				controlVariant="split"
				hideDetails
			></VNumberInput>
			<VNumberInput
				v-model="totalCount"
				label="Total count"
				:min="2"
				:width="180"
				maxWidth="190"
				controlVariant="split"
				hideDetails
			></VNumberInput>
		</div>
	</div>
</template>

<script setup lang="ts">
	defineProps<{
		isEdit: boolean
	}>()

	const isRepeated = defineModel<boolean>({ required: true })

	const doneCount = defineModel<number | null>('doneCount', { required: true })
	const totalCount = defineModel<number | null>('totalCount', { required: true })
</script>

<style scoped></style>
