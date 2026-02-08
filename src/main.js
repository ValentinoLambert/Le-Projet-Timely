import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPersist from 'pinia-plugin-persist'
import App from './App.vue'
import router from './router'
import apiClient from './plugins/axios'

const app = createApp(App)
const pinia = createPinia()

// Utiliser le plugin de persistance comme indiqué dans le cours
pinia.use(piniaPersist)

// Ajouter axios à tous les stores
pinia.use(({ store }) => {
  store.$api = apiClient
})

app.use(pinia)
app.use(router)

app.mount('#app')
