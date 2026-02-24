<template>
<div class="d-flex">
	<div class="time-column d-flex flex-column justify-space-between align-center">
		<div class="d-flex align-center w-100">
			<VSheet class="time-label pa-1 w-100 text-body-2 text-center font-weight-medium"
			        rounded="lg" color="surface-light">{{ formattedStartTimestamp }}
			</VSheet>
			<hr class="line"/>
		</div>
		<VChip class="ml-auto font-weight-bold" :color="lengthColor" variant="tonal" size="small" style="border-radius: 5px">{{ formattedLength }}</VChip>
		<div class="d-flex align-center w-100">
			<VSheet class="time-label pa-1 w-100 text-body-2 text-center text-medium-emphasis"
			        rounded="lg" color="surface-light">{{ formattedEndTimestamp }}
			</VSheet>
			<hr class="line"/>
		</div>
	</div>
	<VCard class="elevation-2 flex-1-0 d-flex">
		<div class="flex-fill">
			<div class="d-flex align-center">
				<VCardTitle>{{ record.activity.name }}</VCardTitle>
				<VChip
					v-if="record.activity.role"
					:color="record.activity.role.color ?? 'primary'"
					variant="flat"
					size="small"
					label
					:prependIcon="record.activity.role.icon ?? undefined"
				>
					{{ record.activity.role.name }}
					<VTooltip activator="parent" v-if="record.activity.role?.text" class="text-body-2 text-medium-emphasis">
						{{ record.activity.role.text }}
					</VTooltip>
				</VChip>
			</div>
			<VCardSubtitle v-if="record.activity.category" class="text-high-emphasis" style="opacity: 1">
				<VIcon :icon="record.activity.category.icon ?? 'layer-group'" size="12" class="mr-1"/>
				{{ record.activity.category.name }}
			</VCardSubtitle>
			<VCardText v-if="record.activity.text" class="px-4 pb-3 text-body-2 text-medium-emphasis" style="white-space: pre-line">
				{{ record.activity.text }}
			</VCardText>
		</div>
		<VMenu location="start" transition="slide-y-transition">
			<template #activator="{ props: menuProps }">
				<VIconBtn class="my-auto mr-2" icon="ellipsis-vertical" v-bind="menuProps" color="white" variant="text" size="40" @click.stop=""/>
			</template>
			<VList bgColor="surface" style="border: 1px solid #999">
				<VListItem v-for="(item, i) in actions" :key="i" class="px-3">
					<VBtn class="px-3" :color="item.color" :variant="item.variant" :appendIcon="item.icon" width="100%" @click="item.action">
						{{ $t(`general.${item.name}`) }}
					</VBtn>
				</VListItem>
			</VList>
		</VMenu>
	</VCard>
</div>
</template>

<script setup lang="ts">
import {computed} from 'vue'
import {ActivityHistory} from '@/dtos/response/activityHistory/ActivityHistory.ts'
import {useMoment} from '@/utils/momentHelper.ts'
import {MenuItem} from '@/dtos/dto/MenuAction.ts'

const {formatToTime} = useMoment()

const props = defineProps<{
	record: ActivityHistory
}>()

const emit = defineEmits<{ edit: [record: ActivityHistory], delete: [id: number] }>()

const actions = [
	new MenuItem('edit', 'outlined', 'primaryOutline', 'pen-to-square', () => emit('edit', props.record)),
	new MenuItem('delete', 'outlined', 'secondaryOutline', 'trash-can', () => emit('delete', props.record.id)),
]

const formattedStartTimestamp = computed(() => formatToTime(props.record.startTimestamp))
const formattedLength = computed(() => props.record.length.getNice)
const formattedEndTimestamp = computed(() => getEndOfActivityTime(props.record.startTimestamp, props.record.length.getInSeconds))

const lengthColor = computed(() => {
	const minutes = props.record.length.getInMinutes
	if (minutes >= 120) return 'success'
	if (minutes >= 60) return 'teal'
	if (minutes >= 30) return 'info'
	if (minutes >= 15) return 'warning'
	return 'grey'
})

function getEndOfActivityTime(startTimestamp: Date, length: number) {
	const endInMillis = startTimestamp.valueOf() + length * 1000
	return formatToTime(new Date(endInMillis))
}
</script>

<style scoped>
.time-column {
	width: 4rem;
	min-width: 4rem;
}

.line {
	border-width: 2px;
	min-width: 1rem !important;
}
</style>
