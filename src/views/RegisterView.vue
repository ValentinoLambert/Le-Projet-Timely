<script setup>
import { ref } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useToastStore } from '../stores/toast';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const toastStore = useToastStore();
const router = useRouter();
const name = ref('');
const email = ref('');
const apiKeyShown = ref('');

const register = async () => {
  try {
    const res = await authStore.register(name.value, email.value);
    apiKeyShown.value = (res && (res.api_key || res.apikey || res.key)) || authStore.apiKey || '';
    toastStore.show('Compte créé');
  } catch (err) {
    toastStore.show('Erreur lors de la création du compte');
  }
};

function continueToHome() {
  router.push('/');
}
</script>

<template>
  <div>
    <h1>Inscription</h1>
    <form @submit.prevent="register">
      <input v-model="name" placeholder="Nom complet" required />
      <input v-model="email" type="email" placeholder="Email" required />
      <button type="submit">Créer mon compte</button>
    </form>

    <div v-if="apiKeyShown" style="margin-top:12px;">
      <p><strong>Votre clé API :</strong></p>
      <p><code>{{ apiKeyShown }}</code></p>
      <p style="color: red;">Conservez cette clé, elle ne sera plus affichée.</p>
      <button @click="continueToHome">Continuer</button>
    </div>
    <p>Déjà un compte ? <router-link to="/login">Se connecter</router-link></p>
  </div>
</template>
