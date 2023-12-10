<script setup>
    import { RouterLink, RouterView } from 'vue-router';
</script>

<template>
    <v-app>
        <header>
            <v-app-bar app>
                <div class="d-flex justify-space-between w-100">
                    <div class="d-flex align-center">
                        <VAppBarTitle class="flex-0-0 mx-3"> AntiProcrastination app </VAppBarTitle>
                        <template v-if="userStore.getEmail">
                            <RouterLink class="my-auto pa-2" to="/">{{ $t('navigation.home') }}</RouterLink>
                            <RouterLink class="my-auto pa-2" to="/history">{{ $t('navigation.history') }}</RouterLink>
                            <RouterLink class="my-auto pa-2" to="/to-do-list">{{ $t('navigation.toDoList') }}</RouterLink>
                            <RouterLink class="my-auto pa-2" to="/create-new-activity">{{ $t('navigation.createNewActivity') }}</RouterLink>
                            <RouterLink class="my-auto pa-2" to="/stopwatch">{{ $t('navigation.stopwatch') }}</RouterLink>
                            <RouterLink class="my-auto pa-2" to="/timer">{{ $t('navigation.timer') }}</RouterLink>
                            <RouterLink class="my-auto pa-2" to="/alarm">{{ $t('navigation.alarm') }}</RouterLink>
                            <RouterLink class="my-auto pa-2" to="/add-activity-manually">{{ $t('navigation.addActivityManually') }}</RouterLink>
                        </template>
                    </div>
                    <div class="d-flex align-center">
                        <div v-if="!userStore.getEmail">
                            <RouterLink class="my-auto pa-2" to="/registration">{{ $t('authorization.registration') }}</RouterLink>
                            <RouterLink class="my-auto pa-2" to="/login">{{ $t('authorization.login') }}</RouterLink>
                        </div>
                        <div v-else>
                            <VLabel class="ml-3 mr-1">{{ userStore.getEmail }}</VLabel>
                            <RouterLink class="my-auto pa-2" to="/login" @click="logout">{{ $t('authorization.logOut') }}</RouterLink>
                        </div>
                        <VSelect class="flex-0-0 mx-2" v-model="$i18n.locale" :items="$i18n.availableLocales" density="compact" width="auto" hide-details :clearable="false"> </VSelect>
                        <!-- <VAppBarNavIcon></VAppBarNavIcon> -->
                    </div>
                </div>
            </v-app-bar>
        </header>
        <v-main>
            <v-container class="h-100" fluid>
                <RouterView />
            </v-container>
        </v-main>
    </v-app>
</template>
<script>
    import { useUserStore } from './plugins/stores/user';
    export default {
        data() {
            return {};
        },
        computed: {
            userStore() {
                return useUserStore();
            },
        },
        mounted() {},
        created(){
            console.log(this.userStore.getEmail);
        },
        methods: {
            logout() {
                axios
                    .post(
                        '/user/auth/logout',
                        {},
                        {
                            headers: {
                                Authorization: `Bearer ${this.userStore.getToken}`,
                            },
                        }
                    )
                    .then((response) => {
                        
                    })
                    .catch((error) => {
                        console.log(error);
                    });
                    this.userStore.logout();
            },
        },
    };
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