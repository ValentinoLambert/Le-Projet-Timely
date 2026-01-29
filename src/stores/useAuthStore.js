import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    apiKey: null,
    name: '',
    email: ''
  }),
  persist: {
    enabled: true,
    strategies: [
      { storage: localStorage, paths: ['apiKey', 'name', 'email'] }
    ]
  },
  actions: {
    setApiKey(key) {
      this.apiKey = key
    },
    setProfile(name, email) {
      this.name = name
      this.email = email
    },
    logout() {
      this.apiKey = null
      this.name = ''
      this.email = ''
      this.$reset()
    }
  }
})
