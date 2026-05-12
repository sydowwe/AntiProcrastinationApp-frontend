<template>
	<MyDialog
		v-model="dialogShown"
		eager
		@confirmed="save"
	>
		<template #header>
			<div class="text-wrap">
				{{ $t('toDoList.saveTask') }}
				<span class="text-purple-accent-4 font-weight-bold">{{ plannerTask?.activity?.name }}</span>
				{{ $t('history.toHistory').toLowerCase() }}?
			</div>
		</template>
		<LogTimeForm
			ref="logTimeForm"
			v-model:dateTime="dateTime"
			v-model:length="length"
			class="pt-3"
			@submit="save"
		/>
	</MyDialog>
</template>

<script setup lang="ts">
	import { onMounted, ref, watch } from 'vue'
	import { Time } from '@/dtos/dto/Time.ts'
	import type { PlannerTask } from '@/dtos/response/activityPlanning/PlannerTask.ts'
	import { useI18n } from 'vue-i18n'
	import MyDialog from '@/components/general/dialogs/MyDialog.vue'
	import LogTimeForm from '@/components/general/LogTimeForm.vue'
	import { useSnackbar } from '@/composables/general/SnackbarComposable.ts'
	import { useActivityHistoryCrud } from '@/api/activityHistory/activityHistoryApi.ts'

	const props = defineProps<{
		plannerTask: PlannerTask
		isRecursive: boolean
	}>()
	const emit = defineEmits<{ openNext: [] }>()
	const dialogShown = defineModel<boolean>({ required: true })

	const { create } = useActivityHistoryCrud()
	const { t } = useI18n()
	const { showErrorSnackbar, showSuccessSnackbar } = useSnackbar()

	const logTimeForm = ref<InstanceType<typeof LogTimeForm>>()
	const dateTime = ref(new Date())
	const length = ref(new Time())

	function calculateMinuteLength(): number {
		const startMinutes = props.plannerTask.startTime.getInMinutes
		const endMinutes = props.plannerTask.endTime.getInMinutes
		if (endMinutes >= startMinutes) return endMinutes - startMinutes
		return 24 * 60 - startMinutes + endMinutes
	}

	function initDateTime() {
		const now = new Date()
		now.setHours(props.plannerTask.startTime.hours, props.plannerTask.startTime.minutes, 0, 0)
		dateTime.value = now
	}

	function initLength() {
		const mins = calculateMinuteLength()
		length.value = new Time(Math.floor(mins / 60), mins % 60)
	}

	onMounted(() => {
		initDateTime()
		initLength()
	})

	watch(dialogShown, isShown => {
		if (isShown) {
			if (!props.isRecursive) {
				initDateTime()
			}
			initLength()
		} else {
			if (props.isRecursive) {
				setTimeout(() => emit('openNext'), 200)
			}
		}
	})

	async function save() {
		const isValid = await logTimeForm.value?.validate()
		if (!isValid?.valid) return
		const request = await create(dateTime.value, length.value, props.plannerTask.activity.id)
		if (request) {
			showSuccessSnackbar(t('toDoList.savedToHistory', { name: props.plannerTask.activity.name }))
			dialogShown.value = false
		} else {
			showErrorSnackbar(t('toDoList.errorSavingToHistory', { name: props.plannerTask.activity.name }))
		}
	}
</script>
