<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '../../stores/auth';
import { toast } from 'vue3-toastify';
import apiClient from '../../plugins/axios';

/**
 * Vue de gestion du profil utilisateur
 * Permet de modifier le nom et l'email de l'utilisateur
 */

const authStore = useAuthStore();

// État du formulaire
const name = ref('');
const email = ref('');

/**
 * Charge les données du profil au montage du composant
 */
onMounted(() => {
  if (authStore.user) {
    name.value = authStore.user.name || '';
    email.value = authStore.user.email || '';
  }
});

/**
 * Met à jour le profil utilisateur via l'API
 */
const updateProfile = async () => {
  if (!name.value || !email.value) {
    toast.error('Veuillez remplir tous les champs');
    return;
  }

  try {
    const response = await apiClient.put('/profile', {
      name: name.value,
      email: email.value
    });
    
    // Mettre à jour les données locales
    authStore.user = response.data;
    
    toast.success('Profil mis à jour avec succès');
  } catch (err) {
    toast.error('Erreur lors de la mise à jour du profil');
  }
};
</script>

<template>
  <div>
    <h2>Mon profil</h2>
    
    <form @submit.prevent="updateProfile">
      <div>
        <label>Nom complet :</label>
        <input v-model="name" type="text" required />
      </div>
      
      <div>
        <label>Email :</label>
        <input v-model="email" type="email" required />
      </div>
      
      <button type="submit">Mettre à jour</button>
    </form>
  </div>
</template>
