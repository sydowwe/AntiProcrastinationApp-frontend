import { defineStore } from 'pinia';

export const useUserStore = defineStore('user', {
  state: () => ({
    token: '',
    email: '',
  }),
  getters: {
    getToken: (state) => state.token,
    getEmail: (state) => state.email,
  },
  actions: { 
    setToken(token: string) {
      this.token = token;
    },
    setEmail(email: string) {
      this.email = email;
    },
  
    login(email: string, token: string) {
      this.token = token;
      this.email = email;
    },
    logout() {
      this.$reset();
    },
  },
});
