<script setup>
import { ref } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();
const name = ref('');
const email = ref('');
const error = ref('');

const apiKeyShown = ref('')

const register = async () => {
  try {
    const res = await authStore.register(name.value, email.value)
    apiKeyShown.value = (res && (res.api_key || res.apikey || res.key)) || authStore.apiKey || ''
  } catch (err) {
    error.value = (err && err.response && err.response.data && err.response.data.message) || err.message || 'Erreur lors de la création du compte'
    console.error(err)
  }
}

function copyKey() {
  if (!apiKeyShown.value) return
  navigator.clipboard?.writeText(apiKeyShown.value).catch(() => alert('Impossible de copier'))
}

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

    <div v-if="apiKeyShown" style="margin-top:12px;">
      <p><strong>Clé API :</strong> <code>{{ apiKeyShown }}</code></p>
      <button @click="copyKey">Copier la clé</button>
      <button @click="continueToHome" style="margin-left:8px">Continuer</button>
    </div>
    <p>Déjà un compte ? <router-link to="/login">Se connecter</router-link></p>
  </div>
</template>
