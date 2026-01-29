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
      <button @click="logout">Déconnexion</button>
    </nav>


  </header>
  <main>
    <router-view />
  </main>
</template>

<style>
nav { padding: 10px; border-bottom: 1px solid #ccc; }
</style>
