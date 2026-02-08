import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: () => import('../views/LoginView.vue') },
    { path: '/register', name: 'register', component: () => import('../views/RegisterView.vue') },
    { path: '/', name: 'home', component: () => import('../views/HomeView.vue') },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('../views/SettingsView.vue'),
      children: [
        { path: 'profile', name: 'settings-profile', component: () => import('../views/settings/ProfileView.vue') },
        { path: 'projects', name: 'settings-projects', component: () => import('../views/settings/ProjectsView.vue') },
        { path: 'activities', name: 'settings-activities', component: () => import('../views/settings/ActivitiesView.vue') }
      ]
    },
    { path: '/statistics', name: 'statistics', component: () => import('../views/StatisticsView.vue') }
  ]
});



router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  const publicPages = ['/login', '/register'];
  const authRequired = !publicPages.includes(to.path);

  if (authRequired && !authStore.isAuthenticated) {
    return next('/login');
  }
  if (!authRequired && authStore.isAuthenticated) {
    return next('/');
  }
  next();
});

export default router;
