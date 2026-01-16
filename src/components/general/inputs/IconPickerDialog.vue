<template>
<VDialog v-model="dialog" maxWidth="800" scrollable>
	<VCard>
		<VCardTitle class="d-flex align-center ga-3 pa-4">
			<VIcon icon="icons" size="24"/>
			<span>Vyberte ikonu</span>
			<VSpacer/>
			<VIconBtn icon="xmark" variant="tonal" density="comfortable" @click="dialog = false"/>
		</VCardTitle>

		<VDivider/>

		<VCardText class="pa-4">
			<!-- Search and filters -->
			<div class="d-flex flex-wrap align-center ga-3 mb-4">
				<VTextField
					v-model="searchQuery"
					placeholder="Hľadať ikony..."
					prependInnerIcon="magnifying-glass"
					hideDetails
					density="compact"
					class="flex-grow-1"
					style="min-width: 200px;"
					clearable
				/>

				<div class="text-caption text-medium-emphasis">
					{{ filteredIcons.length }} ikon
				</div>

				<VBtnToggle v-model="selectedStyle" mandatory color="secondary" baseColor="secondary-container" density="compact" divided>
					<VBtn value="solid" size="small">
						<VIcon icon="circle" class="mr-2" size="14"/>
						Solid
					</VBtn>
					<VBtn value="regular" size="small">
						<VIcon icon="far fa-circle" class="mr-2" size="14"/>
						Regular
					</VBtn>
					<VBtn value="brands" size="small">
						<VIcon icon="fab fa-font-awesome" class="mr-2" size="14"/>
						Brands
					</VBtn>
				</VBtnToggle>
			</div>

			<!-- Icons grid with virtual scroll for performance -->
			<VVirtualScroll
				v-if="filteredIcons.length > 0"
				:items="iconRows"
				:height="400"
				itemHeight="116"
			>
				<template #default="{ item: row }">
					<div class="icon-grid">
						<VCard
							v-for="icon in row"
							:key="`${icon.prefix}-${icon.name}`"
							class="icon-item pa-2 d-flex flex-column align-center"
							:class="{ 'icon-item--selected': isSelected(icon) }"
							variant="outlined"
							hover
							@click="selectIcon(icon)"
						>
							<VIcon
								:icon="toVuetifyIcon(icon)"
								class="icon-preview mt-1"
								size="32"
							/>
							<span class="icon-name text-caption text-center mt-2">
								{{ formatIconName(icon.name) }}
							</span>
						</VCard>
					</div>
				</template>
			</VVirtualScroll>

			<!-- Empty state -->
			<div v-if="filteredIcons.length === 0" class="text-center py-8 text-medium-emphasis">
				<VIcon icon="face-frown" size="48" class="mb-3"/>
				<div>Žiadne ikony nenájdené</div>
				<div class="text-caption">Skúste iný vyhľadávací výraz</div>
			</div>
		</VCardText>

		<VDivider/>

		<VCardActions class="pa-4">
			<div v-if="selectedIcon" class="d-flex align-center ga-2">
				<span class="text-caption text-medium-emphasis mr-2">Vybraná:</span>
				<VIcon :icon="toVuetifyIcon(selectedIcon)" class="mr-1" size="32"/>
				{{ formatIconName(selectedIcon.name) }}
			</div>
			<VSpacer/>
			<VBtn variant="text" @click="dialog = false">
				Zrušiť
			</VBtn>
			<VBtn color="primary" :disabled="!selectedIcon" @click="confirmSelection">
				Potvrdiť
			</VBtn>
		</VCardActions>
	</VCard>
</VDialog>
</template>

<script setup lang="ts">
import {computed, type PropType, ref, watch} from 'vue'
import {findIconByVuetifyString, formatIconName, getIconsByStyle, type IconInfo, type IconStyle, searchIcons, toVuetifyIcon} from '@/utils/fontAwesomeIcons'

const dialog = defineModel<boolean>({required: true})

const props = defineProps({
	initialValue: {
		type: Object as PropType<string | null>,
		required: true,
	}
})

const emit = defineEmits<{
	select: [icon: IconInfo]
}>()

const searchQuery = ref('')
const selectedStyle = ref<IconStyle>('solid')
const selectedIcon = ref<IconInfo | null>(null)

// Get icons based on selected style
const styleIcons = computed(() => getIconsByStyle(selectedStyle.value))

// Filter icons by search query
const filteredIcons = computed(() => searchIcons(styleIcons.value, searchQuery.value))

// Group icons into rows for virtual scroll (7 icons per row for 700px dialog)
const iconsPerRow = 7
const iconRows = computed(() => {
	const rows: IconInfo[][] = []
	for (let i = 0; i < filteredIcons.value.length; i += iconsPerRow) {
		rows.push(filteredIcons.value.slice(i, i + iconsPerRow))
	}
	return rows
})

function isSelected(icon: IconInfo): boolean {
	return selectedIcon.value?.name === icon.name && selectedIcon.value?.prefix === icon.prefix
}

function selectIcon(icon: IconInfo) {
	selectedIcon.value = icon
}

function confirmSelection() {
	if (selectedIcon.value) {
		emit('select', selectedIcon.value)
		dialog.value = false
	}
}

// Reset selection when style changes
watch(selectedStyle, () => {
	selectedIcon.value = null
})

// Try to find initial icon when dialog opens
watch(dialog, (isOpen) => {
	if (isOpen && props.initialValue) {
		const found = findIconByVuetifyString(props.initialValue)
		if (found) {
			selectedIcon.value = found
			selectedStyle.value = found.style
		}
	}
}, {immediate: true})
</script>

<style scoped>
.icon-grid {
	display: grid;
	grid-template-columns: repeat(7, 1fr);
	gap: 8px;
	margin-bottom: 8px;
}

.icon-item {
	cursor: pointer;
	transition: all 0.15s ease;
}

.icon-item:hover {
	border-color: rgb(var(--v-theme-primary));
	background-color: rgba(var(--v-theme-primary), 0.08);
}

.icon-item--selected {
	border-color: rgb(var(--v-theme-primary));
	background-color: rgba(var(--v-theme-primary), 0.15);
}

.icon-preview {
	color: rgb(var(--v-theme-on-surface));
	flex-shrink: 0;
}

.icon-name {
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow: hidden;
	text-overflow: ellipsis;
	line-height: 1.4;
	max-height: 2.8em; /* 2 lines * 1.4 line-height */
	max-width: 100%;
	padding: 0 2px;
}
</style>
