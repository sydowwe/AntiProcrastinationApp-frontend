<template>
<header v-cloak>
	<nav>
		<VAppBar v-if="!mdAndDown" app sticky color="primary-accent" class="w-100 px-3" justify-end>
			<div class="d-flex align-center flex-fill ga-1">
				<VSheet class="d-flex px-2 py-1 mr-1" color="primary-container" style="border-radius: 7px; border: 2px black solid">
					<VAppBarTitle class="flex-0-0">Adhd time organizer</VAppBarTitle>
				</VSheet>
				<template v-if="userStore.isAuthenticated">
					<template v-for="item in filteredItems" :key="item.title">
						<!-- Regular menu item without children -->
						<VBtn
							v-if="!item.children"
							:to="item.to"
							:prepend-icon="item.icon"
							variant="text"
							class="pr-2"
						>
							{{ $t(`navigation.${item.title}`) }}
						</VBtn>

						<!-- Menu item with dropdown children -->
						<VMenu
							v-else
							:close-on-content-click="false"
							location="bottom"
						>
							<template v-slot:activator="{ props, isActive }">
								<VBtn
									v-bind="props"
									:prepend-icon="item.icon"
									:append-icon="isActive ? 'chevron-up' : 'chevron-down'"
									variant="text"
									class="pr-2"
								>
									{{ $t(`navigation.${item.title}`) }}
								</VBtn>
							</template>
							<VCard class="mt-1" elevation="8" min-width="200">
								<VList class="pa-0" density="compact">
									<VListItem
										v-for="child in item.children"
										:key="child.title"
										:to="child.to"
										:prepend-icon="child.icon"
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
					:close-on-content-click="false"
					location="bottom"
				>
					<template v-slot:activator="{ props, isActive }">
						<VBtn
							v-bind="props"
							color="primary-container"
							class="ml-3 px-3 py-2"
							prepend-icon="user"
							:append-icon="isActive ? 'chevron-up' : 'chevron-down'"
							variant="flat"
						>
							{{ userStore.userName }}
						</VBtn>
					</template>
					<VCard class="mt-1" elevation="8" min-width="180">
						<VList class="pa-0" density="compact">
							<VListItem
								to="/user-settings"
								prepend-icon="user-gear"
								title="Nastavenia"
								class="px-4 py-2"
							/>
							<VListItem
								@click="logout"
								prepend-icon="arrow-right-from-bracket"
								title="Odhlásiť sa"
								class="px-4 py-2"
							/>
						</VList>
					</VCard>
				</VMenu>
				<VIconBtn
					class="ml-2"
					@click="toggleTheme"
					:icon="theme.global.current.value.dark ? 'sun' : 'moon'"
					variant="elevated"
					:color="theme.global.current.value.dark ? 'white' : 'black'"
					:title="theme.global.current.value.dark ? 'Svetlý režim' : 'Tmavý režim'"
				/>
			</div>
		</VAppBar>

		<!-- Mobile Navigation Drawer -->
		<template v-else>
			<VNavigationDrawer
				v-model="drawer"
				color="primary-accent"
				location="end"
				temporary
			>
				<VListItem
					prepend-icon="user"
					class="py-2"
					:title="userStore.userName"
				>
					<template v-slot:append>
						<VIconBtn icon="arrow-right-from-bracket" style="border-radius: 7px" color="#AAA" @click="logout" size="45"
						          variant="flat"></VIconBtn>
					</template>
				</VListItem>

				<VDivider></VDivider>

				<VList density="compact" nav>
					<template v-for="item in filteredItems" :key="item.title">
						<!-- Mobile menu item without children -->
						<VListItem
							v-if="!item.children"
							:value="item.title"
							:to="item.to"
							:prepend-icon="item.icon"
							:title="$t(`navigation.${item.title}`)"
							@click="drawer = false"
						/>

						<!-- Mobile menu group with children -->
						<VListGroup v-else :value="item.title + '-group'">
							<template v-slot:activator="{ props }">
								<VListItem
									v-bind="props"
									:prepend-icon="item.icon"
									:title="$t(`navigation.${item.title}`)"
								/>
							</template>
							<VListItem
								v-for="child in item.children"
								:key="child.title"
								:value="child.title"
								:to="child.to"
								:prepend-icon="child.icon"
								:title="$t(`navigation.${child.title}`)"
								class="pl-8"
								@click="drawer = false"
							/>
						</VListGroup>
					</template>
				</VList>
			</VNavigationDrawer>

			<!-- Mobile App Bar -->
			<VAppBar app color="primary-accent">
				<div class="pl-2 w-100 d-flex ga-3 align-center">
					<VSheet class="d-flex px-2 py-1" color="primary-container" style="border-radius: 7px; border: 3px black double">
						<VAppBarTitle>Moja digitálna firma</VAppBarTitle>
					</VSheet>
					<div v-if="userStore.isAuthenticated">
						<VIcon icon="thumbtack" size="15" class="mr-1 mb-1"></VIcon>
						<span class="opacity-60">{{ currentSite ? $t(`navigation.${currentSite.title}`) : '' }}</span>
					</div>
					<div class="ml-auto">
						<VAppBarNavIcon v-if="userStore.isAuthenticated" class="mr-2" @click.stop="drawer = !drawer"/>
					</div>
				</div>
			</VAppBar>
		</template>
	</nav>
</header>
</template>

<script setup lang="ts">
import {useDisplay, useTheme} from 'vuetify/framework';
import {computed, onMounted, ref} from 'vue';
import {useUserStore} from '@/stores/userStore.ts';
import router from '@/plugins/router.ts';
import {API} from '@/plugins/axiosConfig.ts';

const {mdAndDown} = useDisplay()
const drawer = ref(false)

const theme = useTheme()

const toggleTheme = () => {
	const newTheme = theme.global.current.value.dark ? 'light' : 'dark'
	theme.change(newTheme)
	localStorage.setItem('theme', newTheme)
}

// Restore theme preference on component mount
onMounted(() => {
	const savedTheme = localStorage.getItem('theme')
	if (savedTheme) {
		theme.change(savedTheme)
	}
})

interface MenuItem {
	title: string;
	icon: string;
	to?: string;
	needsAdmin: boolean;
	children?: MenuItem[];
}

const items: MenuItem[] = [
	{title: 'home', icon: 'home', to: '/', needsAdmin: false},
	{title: 'history', icon: 'clock-rotate-left', to: '/history', needsAdmin: false},
	{title: 'createNewActivity', icon: 'plus', to: '/create-new-activity', needsAdmin: false},
	{
		title: 'toDoList',
		icon: 'list-check',
		needsAdmin: false,
		children: [
			{title: 'toDoList', icon: 'list-check', to: '/todo-list', needsAdmin: false},
			{title: 'routineToDoList', icon: 'rotate', to: '/routine-todo-list', needsAdmin: false},
		]
	},
	{
		title: 'addActivityToHistory',
		icon: 'plus-circle',
		needsAdmin: false,
		children: [
			{title: 'addActivityManually', icon: 'pen', to: '/add-activity-manually', needsAdmin: false},
			{title: 'pomodoroTimer', icon: 'hourglass-end', to: '/pomodoro-timer', needsAdmin: false},
			{title: 'stopwatch', icon: 'stopwatch', to: '/stopwatch', needsAdmin: false},
			{title: 'timer', icon: 'clock', to: '/timer', needsAdmin: false},
			{title: 'alarm', icon: 'alarm-clock', to: '/alarm-list', needsAdmin: false},
		]
	},
	{title: 'taskPlanner', icon: 'calendar-days', to: '/planner', needsAdmin: false},
	{title: 'dayPlanner', icon: 'calendar-days', to: '/day-planner', needsAdmin: false},
]

// Filter items based on user permissions
const filteredItems = computed(() => {
	const filterMenuItem = (item: MenuItem): MenuItem | null => {
		// If user is not admin and item requires admin, hide it

		// If item has children, filter them recursively
		if (item.children) {
			const filteredChildren = item.children
				.map(child => filterMenuItem(child))
				.filter(child => child !== null) as MenuItem[];

			// If no children remain after filtering, hide the parent item
			if (filteredChildren.length === 0) {
				return null;
			}

			return {
				...item,
				children: filteredChildren
			};
		}

		return item;
	};

	return items
		.map(item => filterMenuItem(item))
		.filter(item => item !== null) as MenuItem[];
});

// Helper function to get all menu items (including children) for current site detection
const getAllMenuItems = (items: MenuItem[]): MenuItem[] => {
	const result: MenuItem[] = [];
	for (const item of items) {
		if (item.to) {
			result.push(item);
		}
		if (item.children) {
			result.push(...getAllMenuItems(item.children));
		}
	}
	return result;
};

const currentSite = computed(() => {
	const allItems = getAllMenuItems(filteredItems.value);
	return [...allItems].reverse().find(site => site.to && router.currentRoute.value.path.startsWith(site.to));
});

const userStore = useUserStore();
const logout = () => {
	API.post('/user/logout', {}).then(() => {
		userStore.logout();
		router.push({name: 'login'});
	});
};
</script>

<style scoped>
</style>