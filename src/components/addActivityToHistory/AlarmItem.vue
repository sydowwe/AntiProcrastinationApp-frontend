<template>
	<VListItem
		:active="!alarm.isActive"
		:baseColor="alarm.activity.category?.color"
		class="listItem pa-0"
		@click="itemClicked"
	>
		<template #prepend="{ isActive }">
			<VListItemAction
				class="py-2 pl-5 pr-2"
				@click="emits('toggleActive', isActive)"
			>
				<VSwitch
					:modelValue="isActive"
					color="info"
					hideDetails
				></VSwitch>
			</VListItemAction>
			<div class="text-white">{{ timeLabel }}</div>
		</template>
		<VListItemTitle class="text-white">{{ alarm.activity.name }}</VListItemTitle>
		<VListItemSubtitle class="text-white">{{ alarm.activity.text }}</VListItemSubtitle>
		<template #append>
			<VIcon
				v-if="isSelected"
				icon="check-circle"
			></VIcon>
			<v-menu
				location="start"
				transition="slide-y-transition"
			>
				<template #activator="{ props: activatorProps }">
					<v-btn
						icon
						v-bind="activatorProps"
						color="white"
						variant="text"
						class="py-2 px-4"
					>
						<VIcon icon="ellipsis-vertical"></VIcon>
					</v-btn>
				</template>
				<VList>
					<VListItem
						v-for="(item, i) in actions"
						:key="i"
						class="px-3"
					>
						<VBtn
							class="px-3"
							:color="item.color"
							width="100%"
							@click="item.action"
						>
							{{ actionButtonText(item.name) }}
							<template #append>
								<VIcon
									:icon="item.icon"
									class="ml-2"
								></VIcon>
							</template>
						</VBtn>
					</VListItem>
				</VList>
			</v-menu>
		</template>
	</VListItem>
</template>

<script setup lang="ts">
	import { computed, ref, watch } from 'vue'
	import { useI18n } from 'vue-i18n'
	import type { Alarm } from '@/dtos/response/activityRecording/Alarm.ts'
	import { useDateTime } from '@/utils/DateTimeHelper.ts'

	const props = defineProps<{
		alarm: Alarm
	}>()

	const emits = defineEmits<{
		edit: [alarm: Alarm]
		delete: [id: number]
		select: [id: number]
		unSelect: [id: number]
		itemClicked: [alarm: Alarm]
		toggleActive: [value: boolean]
	}>()

	const { formatToTime, formatToDate } = useDateTime()

	const i18n = useI18n()

	const isSelected = ref(false)

	const actions = [
		{ name: 'select', color: 'yellow', icon: 'check-circle', action: toggleSelect },
		{ name: 'edit', color: 'primary', icon: 'pen-to-square', action: edit },
		{ name: 'delete', color: 'error', icon: 'trash', action: del },
	]

	function itemClicked() {
		emits('itemClicked', props.alarm)
	}

	const timeLabel = computed(() => {
		return `${props.alarm?.startTimestamp === new Date() ? '' : formatToDate(props.alarm?.startTimestamp)} - ${formatToTime(props.alarm?.startTimestamp)}`
	})

	watch(
		() => props.alarm.isActive,
		() => {
			isSelected.value = false
		},
	)

	function actionButtonText(name: string) {
		return i18n.t(isSelected.value && name === 'select' ? `general.un${name}` : `general.${name}`)
	}

	function edit() {
		emits('edit', props.alarm)
		isSelected.value = false
	}

	function del() {
		emits('delete', props.alarm.id)
		isSelected.value = false
	}

	function toggleSelect() {
		isSelected.value = !isSelected.value
		if (isSelected.value) {
			emits('select', props.alarm.id)
		} else {
			emits('unSelect', props.alarm.id)
		}
	}
</script>
<style scoped>
	.listItem {
		border: 2px solid black !important;
		border-radius: 5px;
	}
</style>
