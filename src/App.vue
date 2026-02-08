<script setup>
import { useAuthStore } from './stores/auth';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();

const logout = () => {
  authStore.logout();
  router.push('/login');
};
</script>

<template>
  <header v-if="authStore.isAuthenticated">
    <nav>
      <router-link to="/">Accueil</router-link> |
      <router-link to="/settings">Paramètres</router-link> |
      <router-link to="/statistics">Statistiques</router-link> |
      <button @click="logout">Déconnexion</button>
    </nav>
  </header>
  <main>
    <router-view />
  </main>
</template>

<style>
nav { 
  padding: 10px; 
  border-bottom: 2px solid #ccc; 
  background-color: #f5f5f5;
  margin-bottom: 20px;
}
nav a { 
  margin: 0 10px; 
  text-decoration: none; 
  color: #333;
}
nav a.router-link-active {
  font-weight: bold;
  color: #000;
}
</style>
