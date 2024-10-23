<template>
<header v-cloak>
	<VAppBar app>
		<div class="d-flex justify-space-between w-100 pr-3">
			<div class="d-flex align-center">
				<VAppBarTitle class="flex-0-0 mx-3">Eshop</VAppBarTitle>
				<RouterLink class="my-auto pa-2" to="/">{{ $t('navigation.home') }}</RouterLink>
				<RouterLink class="my-auto pa-2 text-red" to="">
					Admin
					<VMenu :open-on-focus="false" activator="parent" open-on-hover>
						<VSheet class="d-flex flex-column ga-1" color="bg">
						</VSheet>
					</VMenu>
				</RouterLink>

			</div>
			<div>
				<NavSearchBar></NavSearchBar>
			</div>
			<div class="d-flex align-center ga-3">
				<NavFavoritesList></NavFavoritesList>
				<NavShoppingCart></NavShoppingCart>
				<div v-if="!userStore.isAuthenticated">
					<RouterLink class="my-auto pa-2" to="/registration">{{ $t('authorization.registration') }}</RouterLink>
					<RouterLink class="my-auto pa-2" to="/login">{{ $t('authorization.login') }}</RouterLink>
				</div>
				<div v-else>
					<NavUserDropdown></NavUserDropdown>
				</div>
				<VSelect
					class="flex-0-0"
					v-model="i18n.locale.value"
					:items="i18n.availableLocales"
					density="compact"
					width="auto"
					hide-details
					:clearable="false"
				>
				</VSelect>
				<!-- <VAppBarNavIcon></VAppBarNavIcon> -->
			</div>
		</div>
	</VAppBar>
</header>
</template>
<script setup lang="ts">
import {useI18n} from 'vue-i18n';
import {importDefaults} from '@/compositions/Defaults';
import {ref} from 'vue';
import NavShoppingCart from '@/components/nav/NavShoppingCart.vue';
import NavSearchBar from '@/components/nav/NavSearchBar.vue';
import NavFavoritesList from '@/components/nav/NavFavoritesList.vue';

const {router, userStore, showErrorSnackbar} = importDefaults();
const i18n = useI18n();

// s nazvami namiesto znakov
// const currencies = Object.keys(AvailableCurrencies).map(key => ({title: key, value: AvailableCurrencies[key as keyof typeof AvailableCurrencies]}) );

//TODO fix locale return to default after refresh
function sendChangeLocale() {
	if (userStore.isAuthenticated) {
		axios.put('/user/change-locale/' + i18n.locale.value).then((response) => {
			console.log(response)
		});
	}
}

</script>
<style scoped>

</style>