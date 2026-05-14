<template>
	<VAppBar
		app
		sticky
		color="primary-accent"
		class="w-100 px-3"
		justifyEnd
	>
		<div class="d-flex align-center flex-fill ga-1">
			<VSheet
				class="d-flex px-2 py-1 mr-1"
				color="primary-container"
				style="border-radius: 7px; border: 2px black solid"
			>
				<VAppBarTitle class="flex-0-0">Adhd time organizer</VAppBarTitle>
			</VSheet>
			<template v-if="userStore.isAuthenticated">
				<template
					v-for="item in filteredItems"
					:key="item.title"
				>
					<VBtn
						v-if="!item.children"
						:to="item.to"
						:prependIcon="item.icon"
						variant="text"
						class="pr-2"
					>
						{{ $t(`navigation.${item.title}`) }}
					</VBtn>

					<VMenu
						v-else
						:closeOnContentClick="false"
						location="bottom"
					>
						<template #activator="{ props, isActive }">
							<VBtn
								v-bind="props"
								:prependIcon="item.icon"
								:appendIcon="isActive ? 'chevron-up' : 'chevron-down'"
								variant="text"
								class="pr-2"
							>
								{{ $t(`navigation.${item.title}`) }}
							</VBtn>
						</template>
						<VCard
							class="mt-1"
							elevation="8"
							minWidth="200"
						>
							<VList
								class="pa-0"
								density="compact"
							>
								<VListItem
									v-for="child in item.children"
									:key="child.title"
									:to="child.to"
									:prependIcon="child.icon"
									:title="$t(`navigation.${child.title}`)"
									class="px-4 py-2"
									rounded="0"
								/>
							</VList>
						</VCard>
					</VMenu>
				</template>
			</template>
		</div>
		<div class="d-flex align-center ps-13">
			<VMenu
				v-if="userStore.isAuthenticated"
				:closeOnContentClick="false"
				location="bottom"
			>
				<template #activator="{ props, isActive }">
					<VBtn
						v-bind="props"
						color="primary-container"
						class="ml-3 px-3 py-2"
						prependIcon="user"
						:appendIcon="isActive ? 'chevron-up' : 'chevron-down'"
						variant="flat"
					>
						{{ userStore.userName }}
					</VBtn>
				</template>
				<VCard
					class="mt-1"
					elevation="8"
					minWidth="180"
				>
					<VList
						class="pa-0"
						density="compact"
					>
						<VListItem
							to="/user/settings"
							prependIcon="user-gear"
							:title="$t('controls.settings')"
							class="px-4 py-2"
						/>
						<VListItem
							prependIcon="arrow-right-from-bracket"
							:title="$t('authorization.logOut')"
							class="px-4 py-2"
							@click="logout"
						/>
					</VList>
				</VCard>
			</VMenu>
			<VIconBtn
				class="ml-2"
				:icon="theme.global.current.value.dark ? 'sun' : 'moon'"
				variant="elevated"
				:color="theme.global.current.value.dark ? 'white' : 'black'"
				:title="theme.global.current.value.dark ? $t('theme.switchToLight') : $t('theme.switchToDark')"
				@click="toggleTheme"
			/>
		</div>
	</VAppBar>
</template>

<script setup lang="ts">
	import { useTheme } from 'vuetify/framework'
	import { API } from '@/plugins/axiosConfig.ts'
	import router from '@/plugins/router.ts'
	import { useNavItems } from '@/components/nav/useNavItems.ts'

	const { filteredItems, userStore } = useNavItems()

	const theme = useTheme()

	function toggleTheme() {
		const newTheme = theme.global.current.value.dark ? 'light' : 'dark'
		theme.change(newTheme)
		localStorage.setItem('theme', newTheme)
	}

	function logout() {
		API.post('/auth/logout', {}).then(() => {
			userStore.logout()
			router.push({ name: 'login' })
		})
	}
</script>
