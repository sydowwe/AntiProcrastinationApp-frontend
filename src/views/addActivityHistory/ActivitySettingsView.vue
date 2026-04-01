<template>
	<div class="py-4 h-100 w-100 d-flex flex-column">
		<div class="d-flex align-center">
			<VTabs
				v-model="activeTab"
				color="primaryOutline"
			>
				<VTab value="activities">Activities</VTab>
				<VTab value="roles">Roles</VTab>
				<VTab value="categories">Categories</VTab>
			</VTabs>
			<div class="d-flex ga-2 ml-14 flex-1-1">
				<template v-if="activeTab === 'activities'">
					<VTextField
						v-model="activityFilter.name"
						label="Name"
						clearable
						hideDetails
						density="compact"
					/>
					<VTextField
						v-model="activityFilter.text"
						label="Text"
						clearable
						hideDetails
						density="compact"
					/>
					<VCombobox
						v-model="roleCombobox as any"
						label="Roles"
						:items="roleOptions"
						itemValue="id"
						itemTitle="text"
						multiple
						chips
						closableChips
						hideDetails
						density="compact"
					/>
					<VCombobox
						v-model="categoryCombobox as any"
						label="Categories"
						:items="categoryOptions"
						itemValue="id"
						itemTitle="text"
						multiple
						chips
						closableChips
						hideDetails
						density="compact"
					/>
				</template>
				<template v-else>
					<VTextField
						v-model="nameTextFilter.name"
						label="Name"
						clearable
						hideDetails
						density="compact"
					/>
					<VTextField
						v-model="nameTextFilter.text"
						label="Text"
						clearable
						hideDetails
						density="compact"
					/>
				</template>
			</div>
		</div>
		<VTabsWindow
			v-model="activeTab"
			class="flex-1-1 mt-2"
		>
			<VTabsWindowItem
				value="activities"
				class="flex-fill"
			>
				<ActivityTable :filter="activityFilter" />
			</VTabsWindowItem>
			<VTabsWindowItem
				value="roles"
				class="flex-fill"
			>
				<RoleTable :filter="nameTextFilter" />
			</VTabsWindowItem>
			<VTabsWindowItem
				value="categories"
				class="flex-fill"
			>
				<CategoryTable :filter="nameTextFilter" />
			</VTabsWindowItem>
		</VTabsWindow>
	</div>
</template>

<script setup lang="ts">
	import { onMounted, ref, watch } from 'vue'
	import ActivityTable from '@/components/activity/ActivityTable.vue'
	import RoleTable from '@/components/activity/RoleTable.vue'
	import CategoryTable from '@/components/activity/CategoryTable.vue'
	import { NameTextFilter } from '@/dtos/request/activity/NameTextFilter.ts'
	import { ActivityFilter } from '@/dtos/request/activity/ActivityFilter.ts'
	import { useActivitySelectOptions } from '@/composables/activity/UseActivitySelectOptions.ts'
	import type { SelectOption } from '@/dtos/response/general/SelectOption.ts'

	const { fetchRoleSelectOptions, fetchCategorySelectOptions } = useActivitySelectOptions()

	const activeTab = ref('activities')
	const nameTextFilter = ref(new NameTextFilter())
	const activityFilter = ref(new ActivityFilter())
	const roleCombobox = ref<any[]>([])
	const categoryCombobox = ref<any[]>([])
	const roleOptions = ref<SelectOption[]>([])
	const categoryOptions = ref<SelectOption[]>([])

	onMounted(async () => {
		roleOptions.value = await fetchRoleSelectOptions()
		categoryOptions.value = await fetchCategorySelectOptions()
	})

	watch(activeTab, () => {
		nameTextFilter.value = new NameTextFilter()
		activityFilter.value = new ActivityFilter()
		roleCombobox.value = []
		categoryCombobox.value = []
	})

	watch(
		roleCombobox,
		vals => {
			activityFilter.value.roleIds = vals.filter(v => typeof v === 'number') as number[]
			const strings = vals.filter(v => typeof v === 'string') as string[]
			activityFilter.value.roleName = strings.length ? strings.join(' ') : null
		},
		{ deep: true },
	)

	watch(
		categoryCombobox,
		vals => {
			activityFilter.value.categoryIds = vals.filter(v => typeof v === 'number') as number[]
			const strings = vals.filter(v => typeof v === 'string') as string[]
			activityFilter.value.categoryName = strings.length ? strings.join(' ') : null
		},
		{ deep: true },
	)
</script>
