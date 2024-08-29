import { defineStore } from 'pinia';
import { UserStoreItem } from '@/classes/User';

export const useUserStore = defineStore('user', {
  state: () => ({
    user: new UserStoreItem(),
  }),
  getters: {
    getId: (state): number => state.user.id,
    getEmail: (state): string => state.user.email,
    isAuthenticated: (state): boolean => state.user.isAuthenticated,
    getUser: (state): UserStoreItem => state.user,
  },
  actions: {
    setId(id: number): void {
      this.user.id = id;
    },
    authenticated(){
      this.user.isAuthenticated = true;
    },
    setEmail(email: string): void {
      this.user.email = email;
    },
    logout(): void {
      this.$reset();      
    },
  },
});
