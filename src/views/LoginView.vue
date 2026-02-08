<script setup>
import { ref } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useToastStore } from '../stores/toast';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const toastStore = useToastStore();
const router = useRouter();
const apiKey = ref('');

const login = async () => {
  try {
    await authStore.login(apiKey.value);
    toastStore.show('Connexion réussie');
    router.push('/');
  } catch (err) {
    toastStore.show('Clé API invalide');
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
    <p>Pas de compte ? <router-link to="/register">S'inscrire</router-link></p>
  </div>
</template>
