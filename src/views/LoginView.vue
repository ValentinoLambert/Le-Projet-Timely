<script setup>
import { ref } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();
const apiKey = ref('');
const error = ref('');

const login = async () => {
  try {
    await authStore.login(apiKey.value);
    router.push('/');
  } catch (err) {
    error.value = 'Clé API invalide ou erreur réseau';
  }
};
</script>

<template>
  <div>
    <h1>Connexion</h1>
    <form @submit.prevent="login">
      <input v-model="apiKey" placeholder="Votre Clé API" required />
      <button type="submit">Se connecter</button>
    </form>
    <p v-if="error" style="color:red">{{ error }}</p>
    <p>Pas de compte ? <router-link to="/register">S'inscrire</router-link></p>
  </div>
</template>
