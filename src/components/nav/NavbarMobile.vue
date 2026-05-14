<template>
	<VNavigationDrawer
		v-model="drawer"
		color="primary-accent"
		location="end"
		temporary
	>
		<VListItem
			prependIcon="user"
			class="py-2"
			:title="userStore.userName"
		>
			<template #append>
				<VIconBtn
					icon="arrow-right-from-bracket"
					style="border-radius: 7px"
					color="#AAA"
					size="45"
					variant="flat"
					@click="logout"
				/>
			</template>
		</VListItem>

		<VDivider />

		<VList
			density="compact"
			nav
		>
			<template
				v-for="item in filteredItems"
				:key="item.title"
			>
				<VListItem
					v-if="!item.children"
					:value="item.title"
					:to="item.to"
					:prependIcon="item.icon"
					:title="$t(`navigation.${item.title}`)"
					@click="drawer = false"
				/>

				<VListGroup
					v-else
					:value="item.title + '-group'"
				>
					<template #activator="{ props }">
						<VListItem
							v-bind="props"
							:prependIcon="item.icon"
							:title="$t(`navigation.${item.title}`)"
						/>
					</template>
					<VListItem
						v-for="child in item.children"
						:key="child.title"
						:value="child.title"
						:to="child.to"
						:prependIcon="child.icon"
						:title="$t(`navigation.${child.title}`)"
						class="pl-8"
						@click="drawer = false"
					/>
				</VListGroup>
			</template>
		</VList>
	</VNavigationDrawer>

	<VAppBar
		app
		color="primary-accent"
	>
		<div class="pl-2 w-100 d-flex ga-3 align-center">
			<VSheet
				class="d-flex px-2 py-1"
				color="primary-container"
				style="border-radius: 7px; border: 3px black double"
			>
				<VAppBarTitle>Adhd time organizer</VAppBarTitle>
			</VSheet>
			<div v-if="userStore.isAuthenticated">
				<VIcon
					icon="thumbtack"
					size="15"
					class="mr-1 mb-1"
				/>
				<span class="opacity-60">
					{{ currentSite ? $t(`navigation.${currentSite.title}`) : '' }}
				</span>
			</div>
			<div class="ml-auto">
				<VAppBarNavIcon
					v-if="userStore.isAuthenticated"
					class="mr-2"
					@click.stop="drawer = !drawer"
				/>
			</div>
		</div>
	</VAppBar>
</template>

<script setup lang="ts">
	import { ref } from 'vue'
	import { API } from '@/plugins/axiosConfig.ts'
	import router from '@/plugins/router.ts'
	import { useNavItems } from '@/components/nav/useNavItems.ts'

	const { filteredItems, currentSite, userStore } = useNavItems()

	const drawer = ref(false)

	function logout() {
		API.post('/auth/logout', {}).then(() => {
			userStore.logout()
			router.push({ name: 'login' })
		})
	}
</script>
