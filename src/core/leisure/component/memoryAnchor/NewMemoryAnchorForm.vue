<template>
	<VForm
		ref="form"
		class="d-flex flex-column ga-3"
		@submit.prevent="validate"
	>
		<!-- Locked means the activity is already decided (an "I did this" click, or an edit). Showing it
		     as a read-only field rather than a disabled autocomplete is not cosmetic: the eligible-activity
		     list is not guaranteed to contain it — an already-anchored activity may well be excluded — and
		     a disabled autocomplete with an unmatched id renders blank, leaving the user rating an
		     experience the form never names. It also drops a round trip that decides nothing. -->
		<VTextField
			v-if="lockActivity"
			:modelValue="lockedActivityName"
			:label="$t('leisure.fields.activity')"
			readonly
			:hideDetails="!serverErrors.activityId"
			:errorMessages="serverErrors.activityId"
			:clearable="false"
		/>
		<VAlert
			v-else-if="failed || (!loading && eligibleActivities.length === 0)"
			:type="failed ? 'error' : 'info'"
			variant="tonal"
			density="comfortable"
		>
			{{ $t(failed ? 'leisure.errors.eligibleActivitiesLoadFailed' : 'leisure.errors.noEligibleActivities') }}
			<div class="d-flex ga-2 mt-2">
				<VBtn
					size="small"
					variant="tonal"
					:to="{ name: 'leisureBacklog' }"
				>
					{{ $t('leisure.backlog') }}
				</VBtn>
				<VBtn
					size="small"
					variant="tonal"
					:to="{ name: 'leisureBucketList' }"
				>
					{{ $t('leisure.bucketList') }}
				</VBtn>
			</div>
		</VAlert>
		<VIdAutocomplete
			v-else
			v-model="model.activityId"
			:label="$t('leisure.fields.activity')"
			:placeholder="$t('leisure.memoryAnchorPlaceholder')"
			:items="eligibleActivities"
			:loading
			required
			:rules="[requiredRule]"
			:errorMessages="serverErrors.activityId"
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
			required
			:rules="[requiredRule]"
			:errorMessages="serverErrors.highlightNote"
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
	import { onMounted, ref, watch } from 'vue'
	import { VForm } from 'vuetify/components'
	import type { MemoryAnchorRequest } from '@/core/leisure/dto/request/MemoryAnchorRequest.ts'
	import { useGeneralRules } from '@/_common/composable/general/rules/RulesComposition.ts'
	import { useServerFieldErrors } from '@/core/leisure/composable/useServerFieldErrors.ts'
	import { useMemoryAnchorCrud } from '@/core/leisure/api/memoryAnchorApi.ts'
	import type { SelectOption } from '@/_common/dto/response/general/SelectOption.ts'

	const { lockActivity = false, lockedActivityName = '' } = defineProps<{
		lockActivity?: boolean
		/** Shown instead of the picker when locked. */
		lockedActivityName?: string
	}>()
	const model = defineModel<MemoryAnchorRequest>({ required: true })

	const { requiredRule } = useGeneralRules()
	const { serverErrors, clearServerErrors, applyServerError } = useServerFieldErrors(['activityId', 'highlightNote'])
	const { fetchAnchorEligibleActivities } = useMemoryAnchorCrud()

	const form = ref<InstanceType<typeof VForm>>()
	const eligibleActivities = ref<SelectOption[]>([])
	const loading = ref(!lockActivity)
	const failed = ref(false)

	onMounted(async () => {
		// Nothing to choose from when the activity is already decided.
		if (lockActivity) return
		try {
			eligibleActivities.value = await fetchAnchorEligibleActivities()
		} catch {
			failed.value = true
		} finally {
			loading.value = false
		}
	})

	// A server message is about the value that was submitted; any edit makes it stale.
	watch(model, clearServerErrors, { deep: true })

	async function validate() {
		clearServerErrors()
		return form.value!.validate()
	}

	function reset() {
		clearServerErrors()
		form.value?.reset()
	}

	defineExpose({ validate, reset, applyServerError })
</script>
