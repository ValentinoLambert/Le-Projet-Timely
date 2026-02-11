<script setup>
import { ref } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';

/**
 * Vue de connexion
 * Permet à l'utilisateur de se connecter avec une clé API existante
 */

const authStore = useAuthStore();
const router = useRouter();

// État du formulaire
const apiKey = ref('');
const error = ref('');
const loading = ref(false);

/**
 * Gère la soumission du formulaire de connexion
 * Appelle le store auth pour valider la clé API et récupérer le profil
 */
const login = async () => {
  // Validation basique
  if (!apiKey.value) {
    error.value = 'Veuillez saisir une clé API';
    return;
  }
  
  loading.value = true;
  error.value = '';
  
  try {
    // Tenter la connexion via le store
    await authStore.login(apiKey.value);
    
    // Rediriger vers la page d'accueil si succès
    router.push('/');
  } catch (err) {
    // Afficher l'erreur en cas d'échec
    error.value = 'Clé API invalide ou problème de connexion';
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="auth-container">
    <div class="card auth-card">
      <h1>Bienvenue sur Timely</h1>
      <p class="subtitle">Connectez-vous pour suivre votre temps</p>
      
      <form @submit.prevent="login">
        <label for="apiKey">Clé API</label>
        <input 
          id="apiKey" 
          v-model="apiKey" 
          type="text" 
          placeholder="Entrez votre clé API" 
          required 
        />
        
        <p v-if="error" class="error-msg">{{ error }}</p>
        
        <button type="submit" :disabled="loading">
          {{ loading ? 'Connexion en cours...' : 'Se connecter' }}
        </button>
      </form>
      
      <div class="footer">
        <p>Pas encore de compte ? <router-link to="/register">Créer un compte</router-link></p>
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
