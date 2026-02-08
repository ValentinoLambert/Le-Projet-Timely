<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();
</script>

<template>
  <div>
    <h1>Paramètres</h1>
    
    <nav style="margin: 20px 0; padding: 10px; background-color: #fafafa; border: 1px solid #ddd;">
      <router-link to="/settings/profile">Mon profil</router-link> |
      <router-link to="/settings/projects">Mes projets</router-link> |
      <router-link to="/settings/activities">Mes activités</router-link>
    </nav>

    <router-view />
  </div>
</template>

<style scoped>
nav a { 
  margin: 0 10px; 
  text-decoration: none; 
  color: #555;
}
nav a.router-link-active {
  font-weight: bold;
  color: #000;
  text-decoration: underline;
}
</style>
