<template>
	<div class="d-flex ga-6">
		<VSwitch
			v-model="isRepeated"
			class="ml-2 my-1 flex-0-0"
			:label="$t('toDoList.isRepeated')"
			color="secondaryOutline"
			density="compact"
			hideDetails
		></VSwitch>
		<!--
			The inputs size to the row rather than to a fixed pixel width: `controlVariant="split"` puts
			the −/+ buttons inside the field, so a fixed width left the floating label to ellipsise
			("Total co…"). A width tuned to one locale's wording breaks in the next one — Slovak's
			"Celkový počet" is longer than "Total count" — so they get a floor and grow from there.
		-->
		<div
			v-if="isRepeated"
			class="d-flex ga-4 align-center flex-grow-1"
		>
			<VNumberInput
				v-if="isEdit"
				v-model="doneCount"
				class="flex-1-1"
				:label="$t('toDoList.doneCount')"
				:min="0"
				:max="totalCount ?? 1"
				minWidth="210"
				controlVariant="split"
				hideDetails
			></VNumberInput>
			<VNumberInput
				v-model="totalCount"
				class="flex-1-1"
				:label="$t('toDoList.totalCount')"
				:min="2"
				minWidth="210"
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
