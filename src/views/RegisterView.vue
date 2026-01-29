<script setup>
import { ref } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();
const name = ref('');
const email = ref('');
const error = ref('');

const register = async () => {
  try {
    await authStore.register(name.value, email.value);
    router.push('/');
  } catch (err) {
    error.value = 'Erreur lors de la création du compte';
  }
};
</script>

<template>
  <div>
    <h1>Inscription</h1>
    <form @submit.prevent="register">
      <input v-model="name" placeholder="Nom" required />
      <input v-model="email" type="email" placeholder="Email" required />
      <button type="submit">Créer mon compte</button>
    </form>
    <p v-if="error" style="color:red">{{ error }}</p>
    <p>Déjà un compte ? <router-link to="/login">Se connecter</router-link></p>
  </div>
</template>
