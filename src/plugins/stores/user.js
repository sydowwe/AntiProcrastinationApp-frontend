// src/store/auth.js
import { defineStore } from 'pinia';

export const useUserStore = defineStore('user', {
  state: () => ({
    token: null,
    email: null,
    secretKey2FA: null,
  }),
  getters: {
    getToken: (state) => state.token,
    getEmail: (state) => state.email,
    getSecretKey2FA: (state) => state.secretKey2FA,
  },
  actions: {
    setToken(token) {
      this.token = token;
    },
    setEmail(email) {
      this.email = email;
    },
    setSecretKey2FA(secretKey2FA) {
      this.secretKey2FA = secretKey2FA;
    },
    logout(){
      this.$reset;
    }
  },
});
