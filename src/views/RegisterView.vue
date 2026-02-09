<script setup>
import { ref } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();
const name = ref('');
const email = ref('');
const error = ref('');
const loading = ref(false);

const register = async () => {
  if (!name.value || !email.value) {
    error.value = 'Tous les champs sont requis';
    return;
  }
  loading.value = true;
  error.value = '';
  try {
    await authStore.register(name.value, email.value);
    router.push('/');
  } catch (err) {
    error.value = 'Erreur lors de la création du compte. Vérifiez votre email.';
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="auth-container">
    <div class="card auth-card">
      <h1>Créer un compte</h1>
      <p class="subtitle">Obtenez votre clé API pour commencer</p>
      
      <form @submit.prevent="register">
        <label for="name">Nom complet</label>
        <input 
          id="name" 
          v-model="name" 
          type="text" 
          placeholder="Jean Dupont" 
          required 
        />

        <label for="email">Adresse email</label>
        <input 
          id="email" 
          v-model="email" 
          type="email" 
          placeholder="jean.dupont@example.com" 
          required 
        />
        
        <p v-if="error" class="error-msg">{{ error }}</p>
        
        <button type="submit" :disabled="loading">
          {{ loading ? 'Création...' : 'S\'inscrire' }}
        </button>
      </form>
      
      <div class="footer">
        <p>Déjà un compte ? <router-link to="/login">Se connecter</router-link></p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
}

.auth-card {
  width: 100%;
  max-width: 400px;
  text-align: center;
}

.subtitle {
  color: #6b7280;
  margin-bottom: 2rem;
}

form {
  display: flex;
  flex-direction: column;
  text-align: left;
}

label {
  font-weight: 500;
  margin-bottom: 0.25rem;
  color: var(--text-color);
}

.error-msg {
  color: var(--danger-color);
  font-size: 0.875rem;
  margin-top: -0.5rem;
  margin-bottom: 1rem;
}

.footer {
  margin-top: 1.5rem;
  font-size: 0.875rem;
  color: #6b7280;
}

.footer a {
  color: var(--primary-color);
  text-decoration: none;
}
</style>
