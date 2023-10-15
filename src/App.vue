<script setup>
    import { RouterLink, RouterView } from 'vue-router';
</script>

<template>
    <v-app>
        <header>
            <v-app-bar app>
                <VAppBarTitle> AntiProcrastination app </VAppBarTitle>
                <select v-model="$i18n.locale">
                    <option v-for="locale in $i18n.availableLocales" :key="`locale-${locale}`" :value="locale">{{ locale }}</option>
                </select>
                <RouterLink class="my-auto pa-2" to="/">Home</RouterLink>
                <RouterLink class="my-auto pa-2" to="/login">Login</RouterLink>
                <RouterLink class="my-auto pa-2" to="/registration">Register</RouterLink>
                <RouterLink class="my-auto pa-2" to="/history">History</RouterLink>
                <RouterLink class="my-auto pa-2" to="/toDoList">To-do list</RouterLink>
                <RouterLink class="my-auto pa-2" to="/createNewActivity">Create activity</RouterLink>
                <RouterLink class="my-auto pa-2" to="/stopwatch">Stopwatch</RouterLink>
                <RouterLink class="my-auto pa-2" to="/timer">Timer</RouterLink>
                <RouterLink class="my-auto pa-2" to="/alarm">Alarm</RouterLink>
                <RouterLink class="my-auto pa-2" to="/addActivityManually">Add activity to history</RouterLink>
                <VAppBarNavIcon></VAppBarNavIcon>
            </v-app-bar>
        </header>
        <v-main>
            <v-container class="h-100" fluid>
                <RouterView />
            </v-container>
        </v-main>
    </v-app>
</template>

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
