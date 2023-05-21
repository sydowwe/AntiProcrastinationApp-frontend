<template>
    <header>
      <nav class="navbar navbar-expand-lg bg-dark navbar-dark">
        <div class="container-fluid">
          <router-link class="navbar-brand" to="/">DontWasteTime</router-link>
          <button
            class="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarSupportedContent"
            aria-controls="navbarSupportedContent"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span class="navbar-toggler-icon"></span>
          </button>
          <div class="collapse navbar-collapse" id="navbarSupportedContent">
            <ul class="navbar-nav me-auto mb-2 mb-lg-0">
              <li class="nav-item" v-for="route in routes" :key="route.path">
                <router-link
                  :to="route.path"
                  class="nav-link"
                  :class="{ active: isRouteActive(route) }"
                >
                  {{ route.meta.title }}
                </router-link>
              </li>
            </ul>
            <form class="d-flex" role="search">
              <input
                class="form-control me-2"
                type="search"
                placeholder="Search"
                aria-label="Search"
              />
              <button class="btn btn-outline-success" type="submit">
                Search
              </button>
            </form>
          </div>
        </div>
      </nav>
    </header>
  </template>
  
  <script>
  import { useRoute, useRouter } from 'vue-router';
  
  export default {
    name: 'Navbar',
    setup() {
      const route = useRoute();
      const router = useRouter();
  
      const routes = router.options.routes;
  
      const isRouteActive = (routeItem) => {
        return route.path === routeItem.path;
      };
  
      return {
        route,
        routes,
        isRouteActive,
      };
    },
  };
  </script>
  
