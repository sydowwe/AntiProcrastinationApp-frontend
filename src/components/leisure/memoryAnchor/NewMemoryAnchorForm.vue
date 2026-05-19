<template>
	<VForm
		ref="form"
		class="d-flex flex-column ga-3"
		@submit.prevent="validate"
	>
		<VIdAutocomplete
			v-model="model.activityId"
			:label="$t('leisure.fields.activity')"
			:placeholder="$t('leisure.memoryAnchorPlaceholder')"
			:items="eligibleActivities"
			required
			:rules="[requiredRule]"
			:disabled="lockActivity"
		/>
		<div class="d-flex ga-3">
			<VNumberInput
				v-model="model.anchorMonth"
				:label="$t('leisure.fields.anchorMonth')"
				:min="1"
				:max="12"
				class="flex-1-1"
			/>
			<VNumberInput
				v-model="model.anchorYear"
				:label="$t('leisure.fields.anchorYear')"
				:min="2000"
				:max="2200"
				class="flex-1-1"
			/>
		</div>
		<VTextarea
			v-model="model.highlightNote"
			:label="$t('leisure.fields.highlightNote')"
			rows="3"
			autoGrow
		/>
		<VNumberInput
			v-model="model.rating"
			:label="$t('leisure.fields.rating')"
			:min="1"
			:max="10"
		/>
	</VForm>
</template>

<script setup lang="ts">
	import { onMounted, ref } from 'vue'
	import { VForm } from 'vuetify/components'
	import type { MemoryAnchorRequest } from '@/dtos/request/leisure/MemoryAnchorRequest.ts'
	import { useGeneralRules } from '@/composables/general/rules/RulesComposition.ts'
	import { useMemoryAnchorCrud } from '@/api/leisure/memoryAnchorApi.ts'
	import type { SelectOption } from '@/dtos/response/general/SelectOption.ts'

	const { lockActivity = false } = defineProps<{ lockActivity?: boolean }>()
	const model = defineModel<MemoryAnchorRequest>({ required: true })

	const { requiredRule } = useGeneralRules()
	const { fetchAnchorEligibleActivities } = useMemoryAnchorCrud()

	const form = ref<InstanceType<typeof VForm>>()
	const eligibleActivities = ref<SelectOption[]>([])

	onMounted(async () => {
		eligibleActivities.value = await fetchAnchorEligibleActivities()
	})

	async function validate() {
		return form.value!.validate()
	}

	function reset() {
		form.value?.reset()
	}

	defineExpose({ validate, reset })
</script>
