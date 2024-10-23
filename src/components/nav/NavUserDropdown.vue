<script setup lang="ts">
import {ref} from 'vue';
import {importDefaults} from '@/compositions/Defaults';

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
const menu = ref(false);


</script>

<template>
<VMenu
	v-model="menu"
	:close-on-content-click="false"
	offset-y
>
	<template #activator="{ props }">
		<VBtn
			v-bind="props"
			color="primary"
			variant="elevated"
			prepend-icon="user"
			:append-icon="menu ? 'fa-solid fa-chevron-up' : 'fa-solid fa-chevron-down'"
		>
			My Account
		</VBtn>
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
</template>

<style scoped>

</style>