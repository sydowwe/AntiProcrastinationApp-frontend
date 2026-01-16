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
		@click:clear="clearValue"
		readonly
		@click="openDialog"
		style="cursor: pointer; min-width: 250px!important"
	>
		<template #prepend-inner>
			<VIcon
				v-if="model"
				:icon="model"
				class="mr-2"
				size="20"
			/>
			<VIcon v-else icon="icons" size="18" class="mr-1 text-medium-emphasis"/>
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
import {computed, ref} from 'vue'
import IconPickerDialog from './IconPickerDialog.vue'
import {formatIconName, type IconInfo, parseVuetifyIcon, toVuetifyIcon} from '@/utils/fontAwesomeIcons'

const model = defineModel<string | null>({required: true})

defineProps({
	label: {
		type: String,
		required: false,
		default: 'Ikona'
	},
	placeholder: {
		type: String,
		required: false,
		default: 'Vyberte ikonu'
	},
	rules: {
		type: Array as () => readonly ((value: unknown) => string | boolean)[],
		required: false,
		default: () => []
	},
	hideDetails: {
		type: [Boolean, String] as unknown as () => boolean | 'auto',
		required: false,
		default: true
	},
	density: {
		type: String as () => 'default' | 'comfortable' | 'compact',
		required: false,
		default: 'comfortable'
	},
	clearable: {
		type: Boolean,
		required: false,
		default: true
	}
})

const emit = defineEmits<{
	select: [icon: IconInfo]
}>()

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
	openDialog
})
</script>
