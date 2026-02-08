<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '../../stores/auth';
import { useToastStore } from '../../stores/toast';
import apiClient from '../../plugins/axios';

const authStore = useAuthStore();
const toastStore = useToastStore();

const name = ref('');
const email = ref('');

onMounted(() => {
  if (authStore.user) {
    name.value = authStore.user.name || '';
    email.value = authStore.user.email || '';
  }
});

const updateProfile = async () => {
  if (!name.value || !email.value) {
    toastStore.show('Veuillez remplir tous les champs');
    return;
  }

  try {
    const response = await apiClient.put('/profile', {
      name: name.value,
      email: email.value
    });
    authStore.user = response.data;
    toastStore.show('Profil mis à jour avec succès');
  } catch (err) {
    toastStore.show('Erreur lors de la mise à jour du profil');
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
