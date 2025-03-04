<template>
<header v-cloak>
	<VAppBar app>
		<div class="d-flex align-center justify-space-between w-100 pr-3">
			<div class="d-flex align-center">
				<VAppBarTitle class="flex-0-0 mx-3"> AntiProcrastination app </VAppBarTitle>
				<template v-if="userStore.isAuthenticated">
					<RouterLink class="my-auto pa-2" to="/">{{ $t('navigation.home') }}</RouterLink>
					<RouterLink class="my-auto pa-2" to="/history">{{ $t('navigation.history') }}</RouterLink>
					<RouterLink class="my-auto pa-2" to="/routine-to-do-list">{{ $t('navigation.routineToDoList') }}</RouterLink>
					<RouterLink class="my-auto pa-2" to="/to-do-list">{{ $t('navigation.toDoList') }}</RouterLink>
					<RouterLink class="my-auto pa-2" to="/create-new-activity">{{ $t('navigation.createNewActivity') }}</RouterLink>
					<RouterLink class="my-auto pa-2" to="">
						{{ $t('navigation.addActivityToHistory') }}
						<VMenu offset-y :open-on-focus="false" activator="parent" open-on-hover>
							<VSheet class="d-flex flex-column ga-1" color="bg">
								<RouterLink class="my-auto pa-2" to="/pomodoro-timer">{{ $t('navigation.pomodoroTimer') }}</RouterLink>
								<RouterLink class="my-auto pa-2" to="/stopwatch">{{ $t('navigation.stopwatch') }}</RouterLink>
								<RouterLink class="my-auto pa-2" to="/timer">{{ $t('navigation.timer') }}</RouterLink>
								<RouterLink class="my-auto pa-2" to="/alarm-list">{{ $t('navigation.alarm') }}</RouterLink>
								<RouterLink class="my-auto pa-2" to="/add-activity-manually">{{ $t('navigation.addActivityManually') }}</RouterLink>
							</VSheet>
						</VMenu>
					</RouterLink>
					<RouterLink class="my-auto pa-2" to="/planner">{{ $t('navigation.taskPlanner') }}</RouterLink>

				</template>
			</div>

			<div class="d-flex align-center ga-3">
				<div v-if="!userStore.isAuthenticated">
					<RouterLink class="my-auto pa-2" to="/registration">{{ $t('authorization.registration') }}</RouterLink>
					<RouterLink class="my-auto pa-2" to="/login">{{ $t('authorization.login') }}</RouterLink>
				</div>
				<div v-else>
					<NavUserDropdown></NavUserDropdown>
				</div>
				<VSelect
					class="flex-0-0 mx-2"
					v-model="i18n.locale.value"
					:items="i18n.availableLocales"
					density="compact"
					width="auto"
					hide-details
					:clearable="false"
					@update:modelValue="sendChangeLocale"
				></VSelect>
				<!-- <VAppBarNavIcon></VAppBarNavIcon> -->
			</div>
		</div>
	</VAppBar>
</header>
</template>
<script setup lang="ts">
import {useI18n} from 'vue-i18n';
import {importDefaults} from '@/compositions/general/Defaults';
import NavUserDropdown from '@/components/nav/NavUserDropdown.vue';

const {router, userStore, showErrorSnackbar} = importDefaults();
const i18n = useI18n();

//TODO fix locale return to default after refresh
function sendChangeLocale(){
	if(userStore.isAuthenticated){
		axios.put('/user/change-current-locale/'+i18n.locale.value).then((response) => {
			console.log(response)
		});
	}
}
</script>
<style scoped>
header {
	line-height: 1.5;
}

.logo {
	display: block;
	margin: 0 auto 2rem;
}

nav {
	width: 100%;
	font-size: 12px;
	text-align: center;
	margin-top: 2rem;
}

nav a.router-link-exact-active {
	color: var(--color-text);
}

nav a.router-link-exact-active:hover {
	background-color: transparent;
}

nav a {
	display: inline-block;
	padding: 0 1rem;
	border-left: 1px solid var(--color-border);
}

nav a:first-of-type {
	border: 0;
}

@media (min-width: 1024px) {
	header {
		display: flex;
		place-items: center;
		padding-right: calc(var(--section-gap) / 2);
	}

	.logo {
		margin: 0 2rem 0 0;
	}

	header .wrapper {
		display: flex;
		place-items: flex-start;
		flex-wrap: wrap;
	}

	nav {
		text-align: left;
		margin-left: -1rem;
		font-size: 1rem;

		padding: 1rem 0;
		margin-top: 1rem;
	}
}
</style>