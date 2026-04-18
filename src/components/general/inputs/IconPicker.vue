<template>
	<div>
		<VTextField
			:modelValue="displayValue"
			:label="label"
			:placeholder="placeholder"
			:rules="rules"
			:hideDetails="hideDetails"
			:density="density"
			:clearable="clearable"
			readonly
			style="cursor: pointer; min-width: 220px !important"
			@click:clear="clearValue"
			@click="openDialog"
		>
			<template #prepend-inner>
				<VIcon
					v-if="model"
					:icon="model"
					class="mr-2"
					size="20"
				/>
				<VIcon
					v-else
					icon="icons"
					size="18"
					class="mr-1 text-medium-emphasis"
				/>
			</template>
		</VTextField>

		<IconPickerDialog
			v-model="dialogOpen"
			:initialValue="model"
			@select="onIconSelect"
		/>
	</div>
</template>

<script setup lang="ts">
	import { computed, ref } from 'vue'
	import IconPickerDialog from './IconPickerDialog.vue'
	import { formatIconName, type IconInfo, parseVuetifyIcon, toVuetifyIcon } from '@/utils/fontAwesomeIcons'

	const {
		label = 'Ikona',
		placeholder = 'Vyberte ikonu',
		rules = [],
		hideDetails = true,
		density = 'comfortable',
		clearable = true,
	} = defineProps<{
		label?: string
		placeholder?: string
		rules?: readonly ((value: unknown) => string | boolean)[]
		hideDetails?: boolean | 'auto'
		density?: 'default' | 'comfortable' | 'compact'
		clearable?: boolean
	}>()

	const emit = defineEmits<{
		select: [icon: IconInfo]
	}>()

	const model = defineModel<string | null>({ required: true })

	const dialogOpen = ref(false)

	const displayValue = computed(() => {
		if (!model.value) return ''
		const parsed = parseVuetifyIcon(model.value)
		return parsed ? formatIconName(parsed.name) : model.value
	})

	function openDialog() {
		dialogOpen.value = true
	}

	function clearValue() {
		model.value = null
	}

	function onIconSelect(icon: IconInfo) {
		model.value = toVuetifyIcon(icon)
		emit('select', icon)
	}

	defineExpose({
		openDialog,
	})
</script>
