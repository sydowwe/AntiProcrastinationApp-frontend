<template>
	<VForm
		ref="form"
		class="d-flex flex-column justify-md-end flex-md-row align-md-center ga-3 ga-md-4"
		@submit.prevent
	>
		<div
			v-if="mode === 'toActivity'"
			class="flex-fill"
		>
			<ActivitySelectionForm
				v-model="formData"
				:showFromToDoListField="false"
				layout="row"
			/>
		</div>
		<VBtn
			color="error"
			prependIcon="broom"
			variant="tonal"
			@click="emit('clear')"
		>
			{{ $t('general.clear') }}
		</VBtn>
		<MyBtnToggle
			v-model="mode"
			:label="$t('activityTracking.settings.mappingTarget')"
			mandatory
			density="compact"
			class="my-4"
			color="primaryOutline"
			variant="outlined"
			style="border-color: rgba(var(--v-theme-on-surface), 0.3) !important; height: 40px"
		>
			<VBtn
				value="toActivity"
				height="40"
			>
				{{ $t('activityTracking.settings.toActivity') }}
			</VBtn>
			<VBtn
				value="toIgnored"
				height="40"
			>
				{{ $t('activityTracking.settings.toIgnored') }}
			</VBtn>
		</MyBtnToggle>
		<VBtn
			color="secondary"
			prependIcon="check"
			@click="onSave"
		>
			{{ $t('general.save') }}
		</VBtn>
	</VForm>
</template>

<script setup lang="ts">
	import { ref } from 'vue'
	import { VForm } from 'vuetify/components'
	import MyBtnToggle from '@/_common/component/inputs/MyBtnToggle.vue'
	import ActivitySelectionForm from '@/core/activity/component/ActivitySelectionForm.vue'
	import type { ActivityFormRequest } from '@/core/activity/dto/request/ActivityFormRequest.ts'

	const emit = defineEmits<{ clear: []; save: [] }>()
	const mode = defineModel<'toActivity' | 'toIgnored'>('mode')
	const formData = defineModel<ActivityFormRequest>('formData')
	const form = ref<InstanceType<typeof VForm>>()

	/** Marks a missing activity; whether to send at all is `useMappingSettings.saved()`'s call (F72). */
	async function onSave() {
		await form.value?.validate()
		emit('save')
	}
</script>
