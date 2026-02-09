import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPersist from 'pinia-plugin-persist'
import App from './App.vue'
import router from './router'
import './assets/base.css' 
import apiClient from './plugins/axios'
import Vue3Toastify, { toast } from 'vue3-toastify';
import 'vue3-toastify/dist/index.css';
import { dateFormat } from './directives/dateFormat';

const app = createApp(App)
const pinia = createPinia()

// Pinia Plugins
pinia.use(piniaPersist)
pinia.use(({ store }) => {
  store.$api = apiClient;
  store.$toast = toast;
});

app.use(pinia)
app.use(router)
app.use(Vue3Toastify, {
  autoClose: 3000,
  position: 'bottom-right',
  theme: 'dark',
});

app.component('v-date-format', dateFormat); 
app.directive('date-format', dateFormat);

app.mount('#app')


