<!--
	One row of the welcome-back card (FO5): what waited, named, and one choice about it. A radio group
	rather than a button toggle: it is one of three, it wraps on a phone, and its selection is not colour
	alone. The heading and the summary are the group's label, so a screen reader announces both with it.
-->
<template>
	<VRadioGroup
		v-model="model"
		:label="heading"
		class="welcome-back-choice"
		color="primary"
		density="compact"
		inline
		hideDetails
	>
		<template #label>
			<span class="d-flex align-start ga-2 text-body-2 text-high-emphasis">
				<VIconSmall
					:icon
					class="mt-1"
				/>
				<span>
					<strong>{{ heading }}</strong>
					<!-- The space is in the text, not a margin: it is also the gap in the group's accessible name. -->
					<span class="text-medium-emphasis">{{ ` · ${summary}` }}</span>
				</span>
			</span>
		</template>
		<VRadio
			v-for="option in options"
			:key="String(option.value)"
			:label="option.label"
			:value="option.value"
		/>
	</VRadioGroup>
</template>

<script setup lang="ts" generic="T">
	const { heading, summary, icon, options } = defineProps<{
		heading: string
		summary: string
		icon: string
		options: { value: T; label: string }[]
	}>()

	const model = defineModel<T>({ required: true })
</script>

<style scoped>
	/* A `v-label` is one clipped line; the summary names items and must be read whole. */
	.welcome-back-choice :deep(.v-input__control > .v-label) {
		white-space: normal;
	}

	/* Vuetify sets the inline radios flush against each other, so one label runs into the next. */
	.welcome-back-choice :deep(.v-selection-control-group--inline) {
		flex-wrap: wrap;
		column-gap: 16px;
	}

	/*
	 * From `md` up, home is a dashboard that does not scroll (HomeView.vue), so every line this card takes
	 * comes out of the planner below it. The label and its radios share one line there: half the height.
	 */
	@media (min-width: 960px) {
		.welcome-back-choice :deep(.v-input__control) {
			flex-direction: row;
			flex-wrap: wrap;
			align-items: center;
			column-gap: 24px;
		}

		.welcome-back-choice :deep(.v-input__control > .v-label) {
			flex: 1 1 320px;
			margin-block: 0;
		}
	}
</style>
