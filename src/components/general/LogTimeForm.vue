<template>
	<VForm
		ref="form"
		class="d-flex flex-column flex-sm-row align-start ga-4 ga-sm-6"
		validateOn="submit"
		@keyup.enter="emit('submit')"
		@submit.prevent="emit('submit')"
	>
		<DateTimePicker
			v-model="dateTime"
			class="mb-auto"
			:label="$t('dateTime.when')"
			:dateClearable="false"
		/>
		<TimePicker
			v-model="length"
			icon="hourglass-end"
			:label="$t('dateTime.length')"
			minWidth="150px"
			maxWidth="150px"
			viewMode="minute"
			:rules="[lengthNotZeroRule]"
			showArrows
		/>
	</VForm>
</template>

<script setup lang="ts">
	import { ref, watch } from 'vue'
	import { Time } from '@/dtos/dto/Time.ts'
	import { useI18n } from 'vue-i18n'
	import DateTimePicker from '@/components/general/dateTime/DateTimePicker.vue'
	import TimePicker from '@/components/general/dateTime/TimePicker.vue'
	import { VForm } from 'vuetify/components'

	const emit = defineEmits<{ submit: [] }>()
	const dateTime = defineModel<Date>('dateTime', { required: true })
	const length = defineModel<Time>('length', { required: true })

	const { t } = useI18n()
	const form = ref<InstanceType<typeof VForm>>()

	watch(length, () => form.value?.resetValidation())

	function lengthNotZeroRule(value: unknown) {
		if (typeof value === 'string' && Time.fromString(value).isNotZero()) return true
		return t('dateTime.lengthRequired')
	}

	async function validate() {
		return form.value?.validate()
	}

	defineExpose({ validate })
</script>
