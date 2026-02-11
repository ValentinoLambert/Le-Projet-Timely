import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

/**
 * Configuration du routeur Vue Router
 * 
 * Routes:
 * - /login: Page de connexion (publique)
 * - /register: Page d'inscription (publique)
 * - /: Dashboard principal (authentification requise)
 * - /stats: Page de statistiques et rapports (authentification requise)
 * - /settings: Configuration avec sous-routes (authentification requise)
 *   - /settings/profile: Profil utilisateur
 *   - /settings/projects: Gestion des projets
 *   - /settings/activities: Gestion des activités
 * 
 * Toutes les routes sauf login/register nécessitent une authentification
 */
const router = createRouter({
  history: createWebHistory(),
  routes: [
    // Routes publiques (accessibles sans authentification)
    { 
      path: '/login', 
      name: 'login', 
      component: () => import('../views/LoginView.vue') 
    },
    { 
      path: '/register', 
      name: 'register', 
      component: () => import('../views/RegisterView.vue') 
    },
    
    // Routes protégées (nécessitent une authentification)
    { 
      path: '/', 
      name: 'home', 
      component: () => import('../views/HomeView.vue') 
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('../views/SettingsView.vue'),
      // Routes imbriquées pour les différentes sections de paramètres
      children: [
        { 
          path: 'profile', 
          name: 'settings-profile', 
          component: () => import('../views/settings/ProfileView.vue') 
        },
        { 
          path: 'projects', 
          name: 'settings-projects', 
          component: () => import('../views/settings/ProjectsView.vue') 
        },
        { 
          path: 'activities', 
          name: 'settings-activities', 
          component: () => import('../views/settings/ActivitiesView.vue') 
        }
      ]
    },
    { 
      path: '/stats', 
      name: 'stats', 
      component: () => import('../views/StatsView.vue') 
    }
  ]
});

/**
 * Navigation Guard global
 * Protège les routes qui nécessitent une authentification
 * 
 * Logique:
 * 1. Si route protégée et utilisateur non connecté → Rediriger vers /login
 * 2. Si route publique (login/register) et utilisateur connecté → Rediriger vers /
 * 3. Sinon → Laisser passer
 */
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  
  // Liste des pages accessibles sans authentification
  const publicPages = ['/login', '/register'];
  
  // Vérifier si la route nécessite une authentification
  const authRequired = !publicPages.includes(to.path);

  // Redirection vers login si non authentifié sur une page protégée
  if (authRequired && !authStore.isAuthenticated) {
    return next('/login');
  }
  
  // Redirection vers home si déjà connecté et tente d'accéder à login/register
  if (!authRequired && authStore.isAuthenticated) {
    return next('/');
  }
  
  // Autoriser la navigation
  next();
});

export default router;
