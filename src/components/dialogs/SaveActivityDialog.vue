<template>
	<MyDialog
		v-model="dialog"
		:title="$t('activities.recordNewActivity')"
		@closed="close"
		@confirmed="saveActivity"
	>
		<span class="text-center">
			{{ $t('activities.confirmSaveActivity', { activity, timeSpent: timeSpent?.getNice }) }}
		</span>
	</MyDialog>
</template>
<script setup lang="ts">
	import { ref } from 'vue'
	import MyDialog from '@/components/dialogs/MyDialog.vue'
	import type { Time } from '@/dtos/dto/Time.ts'

	const emit = defineEmits<{
		(e: 'saved', length: Time): void
		(e: 'resetTime'): void
	}>()
	const activity = ref('sitting around')
	const timeSpent = ref<Time>()
	const dialog = ref(false)

	function open(_activity: string, _timeSpent: Time) {
		activity.value = _activity ?? activity.value
		timeSpent.value = _timeSpent
		dialog.value = true
	}

	function close() {
		dialog.value = false
		emit('resetTime')
	}

	function saveActivity() {
		emit('saved', timeSpent.value!)
		close()
	}

	defineExpose({ open })
</script>
