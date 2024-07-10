<template>
    <VApp>
        <header>
            <VAppBar app>
                <div class="d-flex justify-space-between w-100">
                    <div class="d-flex align-center">
                        <VAppBarTitle class="flex-0-0 mx-3"> AntiProcrastination app </VAppBarTitle>
                        <template v-if="userStore.getToken">
                            <RouterLink class="my-auto pa-2" to="/">{{ $t('navigation.home') }}</RouterLink>
                            <RouterLink class="my-auto pa-2" to="/history">{{ $t('navigation.history') }}</RouterLink>
                            <RouterLink class="my-auto pa-2" to="/routine-to-do-list">{{ $t('navigation.routineToDoList') }}</RouterLink>
                            <RouterLink class="my-auto pa-2" to="/to-do-list">{{ $t('navigation.toDoList') }}</RouterLink>
                            <RouterLink class="my-auto pa-2" to="/create-new-activity">{{ $t('navigation.createNewActivity') }}</RouterLink>
                            <VMenu offset-y>
                                <template v-slot:activator="{ props }">
                                    <RouterLink class="my-auto pa-2" to="" v-bind="props">{{ $t('navigation.addActivityToHistory') }}</RouterLink>
                                </template>
                                <VList class="d-flex flex-column">
                                    <RouterLink class="my-auto pa-2" to="/stopwatch">{{ $t('navigation.stopwatch') }}</RouterLink>
                                    <RouterLink class="my-auto pa-2" to="/timer">{{ $t('navigation.timer') }}</RouterLink>
                                    <RouterLink class="my-auto pa-2" to="/alarm">{{ $t('navigation.alarm') }}</RouterLink>
                                    <RouterLink class="my-auto pa-2" to="/add-activity-manually">{{ $t('navigation.addActivityManually') }}</RouterLink>
                                </VList>
                            </VMenu>
                            <RouterLink class="my-auto pa-2" to="/planner">{{ $t('navigation.taskPlanner') }}</RouterLink>

                        </template>
                    </div>
                    <div class="d-flex align-center">
                        <div v-if="!userStore.getToken">
                            <RouterLink class="my-auto pa-2" to="/registration">{{ $t('authorization.registration') }}</RouterLink>
                            <RouterLink class="my-auto pa-2" to="/login">{{ $t('authorization.login') }}</RouterLink>
                        </div>
                        <div v-else>
                            <RouterLink class="ml-3 mr-1 my-auto pa-2 bg-blue-grey" to="/user-settings">{{ userStore.getEmail }}</RouterLink>
                            <RouterLink class="my-auto pa-2" to="/login" @click="logout">{{ $t('authorization.logOut') }}</RouterLink>
                        </div>
                        <VSelect
                            class="flex-0-0 mx-2"
                            v-model="$i18n.locale"
                            :items="$i18n.availableLocales"
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
        <VMain>
            <VContainer class="h-100" fluid>
                <RouterView />
            </VContainer>
        </VMain>
        <Snackbar></Snackbar>
        <LoadingFullscreen></LoadingFullscreen>
    </VApp>
</template>
<script setup lang="ts">
    import { ref, watchEffect, onMounted } from 'vue';
    import Snackbar from './components/feedback/Snackbar.vue';
    import LoadingFullscreen from './components/dialogs/LoadingFullscreen.vue';
    import { importDefaults } from './compositions/Defaults';
    const { router, userStore, showErrorSnackbar } = importDefaults();
    axios.interceptors.response.use(
        (response) => {
            return Promise.resolve(response);
        },
        (error) => {
            if (router.currentRoute.value.name !== 'login' && (error.response.status === 403 || error.response.status === 401)) {
                showErrorSnackbar('Error validating your login credentials! Logging out.', { closable: false });
                logoutClient();
            }
            console.log('aaaa', error);
            switch (error.status) {
                case 409:
                    showErrorSnackbar('Conflict');
                    break;
                default:
                    break;
            }
            return Promise.reject(error);
        }
    );

    const checkTokenValid = () => {
        axios
            .post('/user/auth/checkTokenValidity', {})
            .then((response) => {
                console.log(`\\\\\\\\\\\\\\\\\\\\\\\\\\`);
            })
            .catch((error) => {
                console.log('//////////////////////////');
                logoutClient();
            });
    };
    const logout = () => {
        axios.post('/user/auth/logout', {}).then((response) => {});
        logoutClient();
    };
    const logoutClient = () => {
        userStore.logout();
        router.push({ name: 'login' });
    };
    // watchEffect(() => {
    //     const token = userStore.getToken;
    //     if (!token) {
    //         logoutClient();
    //     }
    // });

    console.log(process.env.VITE_API_URL);
    console.log(import.meta.env.VITE_API_URL);
</script>
<style scoped>
    header {
        line-height: 1.5;
        max-height: 100vh;
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
