<template>
<MyDialog
	:title="dialogMode === 'create' ? 'Add New Event' : 'Edit Event'"
	:modelValue="modelValue"
	:confirmBtnDisabled="!isFormValid"
	@update:modelValue="$emit('update:modelValue', $event)"
	@confirmed="handleSave"
	maxWidth="500px"
>
	<VContainer>
		<VRow>
			<VCol cols="12">
				<VTextField
					v-model="localEvent.title"
					label="Event Title"
					variant="outlined"
					density="comfortable"
					:rules="[v => !!v || 'Title is required']"
				/>
			</VCol>

			<VCol cols="12">
				<VSelect
					v-model="localEvent.category"
					label="Category"
					:items="categories"
					itemTitle="label"
					itemValue="value"
					variant="outlined"
					density="comfortable"
				/>
			</VCol>

			<VCol cols="12" sm="6">
				<VMenu :closeOnContentClick="false">
					<template v-slot:activator="{ props }">
						<VTextField
							label="Start Time"
							:modelValue="localEvent.start"
							v-bind="props"
							variant="outlined"
							prependIcon="clock"
							readonly
						/>
					</template>
					<template v-slot:default>
						<VTimePicker
							v-model="localEvent.start"
							format="24hr"
							:allowedMinutes="allowedStep"
							scrollable
						/>
					</template>
				</VMenu>
			</VCol>

			<VCol cols="12" sm="6">
				<VMenu :closeOnContentClick="false">
					<template v-slot:activator="{ props }">
						<VTextField
							label="End Time"
							:modelValue="localEvent.end"
							v-bind="props"
							variant="outlined"
							prependIcon="clock"
							readonly
						/>
					</template>
					<template v-slot:default>
						<VTimePicker
							v-model="localEvent.end"
							format="24hr"
							:allowedMinutes="allowedStep"
							scrollable
							:rules="[validateEndTime]"
						/>
					</template>
				</VMenu>
			</VCol>

			<VCol cols="12">
				<VMenu :closeOnContentClick="false">
					<template v-slot:activator="{ props }">
						<VBtn
							class="pr-3"
							v-bind="props"
							variant="outlined"
							color="secondaryOutline"
							prependIcon="palette"
							:readonly="dialogMode === 'edit'"
						>
							Color
							<VSheet
								:color="localEvent.color"
								class="ml-2"
								rounded="xl"
								width="20"
								height="20"
							/>
						</VBtn>
					</template>
					<template v-slot:default>
						<VColorPicker v-model="localEvent.color" />
					</template>
				</VMenu>
			</VCol>

			<VCol cols="12" sm="6">
				<VSwitch
					label="Is background"
					color="primary"
					v-model="localEvent.isBackground"
				/>
			</VCol>
		</VRow>
	</VContainer>
</MyDialog>
</template>

<script setup lang="ts">
import { computed, watch, ref } from 'vue'
import type { MyEvent } from '@/classes/types/DayPlannerTypes'
import MyDialog from '@/components/dialogs/MyDialog.vue'

interface Props {
	modelValue: boolean
	dialogMode: 'create' | 'edit'
	event: Partial<MyEvent> // Now uses Partial<MyEvent>
}

interface Emits {
	(e: 'update:modelValue', value: boolean): void
	(e: 'save', event: Partial<MyEvent>): void // Returns partial
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Local copy with proper defaults
const localEvent = ref<Partial<MyEvent>>({
	title: '',
	color: '#4287f5',
	isBackground: false,
	...props.event
})

watch(() => props.event, (newEvent) => {
	localEvent.value = {
		title: '',
		color: '#4287f5',
		isBackground: false,
		...newEvent
	}
}, { deep: true })

const allowedStep = (m: number) => m % 10 === 0

const isFormValid = computed(() => {
	return !!localEvent.value.title &&
		!!localEvent.value.start &&
		!!localEvent.value.end &&
		localEvent.value.start < localEvent.value.end
})

const validateEndTime = (value: string): string | boolean => {
	if (!value) return 'End time is required'
	if (localEvent.value.start && value <= localEvent.value.start) {
		return 'End time must be after start time'
	}
	return true
}

const handleSave = () => {
	emit('save', localEvent.value)
}
</script>