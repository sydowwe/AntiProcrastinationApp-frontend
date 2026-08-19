<template>
	<div class="py-4 h-100 w-100 d-flex flex-column">
		<div class="d-flex align-center">
			<VTabs
				v-model="activeTab"
				color="primaryOutline"
			>
				<VTab value="activities">{{ t('activities.activitiesTab') }}</VTab>
				<VTab value="roles">{{ t('activities.roles') }}</VTab>
				<VTab value="categories">{{ t('activities.categories') }}</VTab>
			</VTabs>
			<div class="d-flex ga-2 ml-14 flex-1-1">
				<template v-if="activeTab === 'activities'">
					<VTextField
						v-model="activityFilter.name"
						:label="t('general.name')"
						clearable
						hideDetails
						density="compact"
					/>
					<VTextField
						v-model="activityFilter.text"
						:label="t('general.text')"
						clearable
						hideDetails
						density="compact"
					/>
					<VCombobox
						v-model="roleCombobox"
						:label="t('activities.roles')"
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
						v-model="categoryCombobox"
						:label="t('activities.categories')"
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
						:label="t('general.name')"
						clearable
						hideDetails
						density="compact"
					/>
					<VTextField
						v-model="nameTextFilter.text"
						:label="t('general.text')"
						clearable
						hideDetails
						density="compact"
					/>
				</template>
			</div>
		</div>
		<VTabsWindow
			v-model="activeTab"
			class="flex-fill mt-2"
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
	import { useRoute, useRouter } from 'vue-router'
	import { useI18n } from 'vue-i18n'
	import ActivityTable from '@/core/activity/component/ActivityTable.vue'
	import RoleTable from '@/core/activity/component/activityRole/ActivityRoleTable.vue'
	import CategoryTable from '@/core/activity/component/activityCategory/ActivityCategoryTable.vue'
	import { NameTextFilter } from '@/core/activity/dto/request/NameTextFilter.ts'
	import { ActivityFilter } from '@/core/activity/dto/request/ActivityFilter.ts'
	import { useActivitySelectOptions } from '@/core/activity/composable/UseActivitySelectOptions.ts'
	import type { SelectOption } from '@/_common/dto/response/general/SelectOption.ts'

	const { t } = useI18n()
	const { fetchRoleSelectOptions, fetchCategorySelectOptions } = useActivitySelectOptions()
	const route = useRoute()
	const router = useRouter()

	const activeTab = ref((route.params.tab as string) || 'activities')
	const nameTextFilter = ref(new NameTextFilter())
	const activityFilter = ref(new ActivityFilter())
	const roleCombobox = ref<(SelectOption | string)[]>([])
	const categoryCombobox = ref<(SelectOption | string)[]>([])
	const roleOptions = ref<SelectOption[]>([])
	const categoryOptions = ref<SelectOption[]>([])

	onMounted(async () => {
		roleOptions.value = await fetchRoleSelectOptions()
		categoryOptions.value = await fetchCategorySelectOptions()
	})

	watch(activeTab, newTab => {
		if (route.params.tab !== newTab) {
			router.replace({ name: 'activitySettings', params: { tab: newTab } })
		}
	})

	watch(
		activeTab,
		() => {
			nameTextFilter.value = new NameTextFilter()
			activityFilter.value = new ActivityFilter()
			roleCombobox.value = []
			categoryCombobox.value = []
		},
		{ immediate: false },
	)

	watch(
		() => route.params.tab,
		newTab => {
			if (newTab && newTab !== activeTab.value) {
				activeTab.value = newTab as string
			}
		},
	)

	watch(
		roleCombobox,
		vals => {
			activityFilter.value.roleIds = vals.filter((v): v is SelectOption => typeof v !== 'string').map(v => v.id)
			const strings = vals.filter((v): v is string => typeof v === 'string')
			activityFilter.value.roleName = strings.length ? strings.join(' ') : null
		},
		{ deep: true },
	)

	watch(
		categoryCombobox,
		vals => {
			activityFilter.value.categoryIds = vals
				.filter((v): v is SelectOption => typeof v !== 'string')
				.map(v => v.id)
			const strings = vals.filter((v): v is string => typeof v === 'string')
			activityFilter.value.categoryName = strings.length ? strings.join(' ') : null
		},
		{ deep: true },
	)
</script>
