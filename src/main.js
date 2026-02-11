import { createApp } from 'vue';
import { createPinia } from 'pinia';
import piniaPersist from 'pinia-plugin-persist';
import App from './App.vue';
import router from './router';
import './assets/base.css';
import apiClient from './plugins/axios';
import Vue3Toastify, { toast } from 'vue3-toastify';
import 'vue3-toastify/dist/index.css';
import { dateFormat } from './directives/dateFormat';

/**
 * Point d'entrée principal de l'application Vue 3
 * 
 * Configuration:
 * - Vue 3 avec Composition API
 * - Pinia pour la gestion d'état
 * - Vue Router pour la navigation
 * - Plugin Axios pour les requêtes API
 * - Vue3 Toastify pour les notifications
 * - Directive personnalisée pour le formatage de dates
 */

// Créer l'instance Vue
const app = createApp(App);

// Créer l'instance Pinia
const pinia = createPinia();

/**
 * Configuration des plugins Pinia
 * 
 * 1. pinia-plugin-persist: Persiste l'état dans le localStorage
 *    Utilisé pour garder l'utilisateur connecté après un refresh
 * 
 * 2. Plugin personnalisé: Injecte $api et $toast dans tous les stores
 *    Permet d'utiliser this.$api et this.$toast directement dans les stores
 *    sans avoir à les importer dans chaque fichier
 */
pinia.use(piniaPersist);
pinia.use(({ store }) => {
  // Injection du client Axios configuré
  store.$api = apiClient;
  
  // Injection de la fonction toast pour les notifications
  store.$toast = toast;
});

// Appliquer les plugins à l'application
app.use(pinia);
app.use(router);

/**
 * Configuration de Vue3 Toastify
 * - autoClose: Fermeture automatique après 3 secondes
 * - position: En bas à droite de l'écran
 * - theme: Mode sombre pour correspondre au design de l'app
 */
app.use(Vue3Toastify, {
  autoClose: 3000,
  position: 'bottom-right',
  theme: 'dark',
});

/**
 * Enregistrement de la directive de formatage de dates
 * Permet d'utiliser v-date-format dans les templates
 * pour afficher automatiquement les dates au format français
 */
app.directive('date-format', dateFormat);

// Monter l'application sur l'élément #app du DOM
app.mount('#app');
