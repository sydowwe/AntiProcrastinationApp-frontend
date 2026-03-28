<template>
<MyDialog
	v-model="dialog"
	:title="`Copy tasks to ${selectedCount} day(s)`"
	confirmBtnLabel="Copy"
	@confirmed="handleConfirm"
>
	<div class="pt-2">
		<MyDateInput v-model="sourceDate" label="Source date" :dateShowArrows="false"/>
	</div>
</MyDialog>
</template>

<script setup lang="ts">
import {ref} from 'vue'
import MyDialog from '@/components/dialogs/MyDialog.vue'
import MyDateInput from '@/components/general/dateTime/MyDateInput.vue'

defineProps<{
	selectedCount: number
}>()

const dialog = defineModel<boolean>({required: true})

const emit = defineEmits<{
	copy: [sourceDate: Date]
}>()

const sourceDate = ref<Date>(new Date())

function handleConfirm() {
	emit('copy', sourceDate.value)
}
</script>
