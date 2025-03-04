
<template>
<RouterLink class="ml-3 mr-1 pa-2 bg-blue-grey" to=""
>
	<VIcon icon="user" class="ml-1 mr-2"></VIcon> {{ userStore.user?.email }}
	<VMenu
		 activator="parent" open-on-hover
		:close-on-content-click="false"
		offset-y
	>
		<template #activator="{ props }">

		</template>

		<!-- Dropdown Content -->
		<VSheet class="d-flex flex-column ga-2 pa-2">
			<RouterLink class="pa-2 text-white" to="/user-settings">
				<VIcon icon="user-gear" class="ml-1 mr-2"></VIcon>
				Account settings
			</RouterLink>
			<RouterLink class="pa-2 text-white" to="/login" @click="logout">
				<VIcon icon="arrow-right-from-bracket" class="mr-2"></VIcon>
				{{ $t('authorization.logOut') }}
			</RouterLink>
		</VSheet>
	</VMenu>
</RouterLink>

</template>
<script setup lang="ts">
import {importDefaults} from '@/compositions/general/Defaults';

const {router, userStore, showErrorSnackbar} = importDefaults();

const logoutClient = () => {
	userStore.logout();
	router.push({name: 'login'});
};
const logout = () => {
	axios.post('/user/logout', {}).then(() => {
	});
	logoutClient();
};
</script>

<style scoped>

</style>