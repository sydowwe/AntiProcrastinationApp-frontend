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
						v-model="activityNameDraft"
						:label="t('general.name')"
						clearable
						hideDetails
						density="compact"
					/>
					<VTextField
						v-model="activityTextDraft"
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
					<VBtnToggle
						v-model="archivedView"
						mandatory
						divided
						density="compact"
						variant="outlined"
						color="primaryOutline"
						class="flex-0-0"
					>
						<VBtn value="active">{{ t('activities.archive.viewActive') }}</VBtn>
						<VBtn value="archived">{{ t('activities.archive.viewArchived') }}</VBtn>
						<VBtn value="all">{{ t('activities.archive.viewAll') }}</VBtn>
					</VBtnToggle>
				</template>
				<template v-else>
					<VTextField
						v-model="sharedNameDraft"
						:label="t('general.name')"
						clearable
						hideDetails
						density="compact"
					/>
					<VTextField
						v-model="sharedTextDraft"
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
				<ActivityTable :filter="activitiesFilter" />
			</VTabsWindowItem>
			<VTabsWindowItem
				value="roles"
				class="flex-fill"
			>
				<RoleTable :filter="rolesFilter" />
			</VTabsWindowItem>
			<VTabsWindowItem
				value="categories"
				class="flex-fill"
			>
				<CategoryTable :filter="categoriesFilter" />
			</VTabsWindowItem>
		</VTabsWindow>
	</div>
</template>

<script setup lang="ts">
	import { useRoute, useRouter } from 'vue-router'
	import { useI18n } from 'vue-i18n'
	import ActivityTable from '@/core/activity/component/ActivityTable.vue'
	import RoleTable from '@/core/activity/component/activityRole/ActivityRoleTable.vue'
	import CategoryTable from '@/core/activity/component/activityCategory/ActivityCategoryTable.vue'
	import { useActivitySelectOptions } from '@/core/activity/composable/UseActivitySelectOptions.ts'
	import {
		useActivityFilterDrafts,
		type ActivitySettingsTab,
	} from '@/core/activity/composable/useActivityFilterDrafts.ts'

	const { tab } = defineProps<{ tab: ActivitySettingsTab }>()

	const { t } = useI18n()
	// The shared cache's own refs: creating a role in the roles tab refreshes them, so the activities
	// tab's filter offers it without a reload.
	const { roleOptions, categoryOptions } = useActivitySelectOptions()
	const route = useRoute()
	const router = useRouter()

	const {
		activeTab,
		activitiesFilter,
		rolesFilter,
		categoriesFilter,
		roleCombobox,
		categoryCombobox,
		archivedView,
		activityNameDraft,
		activityTextDraft,
		sharedNameDraft,
		sharedTextDraft,
	} = useActivityFilterDrafts(() => tab, roleOptions, categoryOptions, route, router)
</script>
