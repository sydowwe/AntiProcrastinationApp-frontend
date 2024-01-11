import { defineStore } from 'pinia';
import { UserStoreItem } from '../../classes/User';

export const useUserStore = defineStore('user', {
  state: () => ({
    user: new UserStoreItem(),
  }),
  getters: {
    getId: (state): number => state.user.id,
    getToken: (state): string => state.user.token,
    getEmail: (state): string => state.user.email,
    getUser: (state): UserStoreItem => state.user,
  },
  actions: {
    setId(id: number): void {
      this.user.id = id;
    },
    setToken(token: string): void {
      this.user.token = token;
    },
    setEmail(email: string): void {
      this.user.email = email;
    },
    setUser(user: UserStoreItem): void {
      const token = this.getToken;
      this.user = user;
      if(token.length>0){
        this.user.token = token;
      }
    },
    logout(): void {
      this.$reset();
    },
  },
});
