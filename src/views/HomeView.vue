<script setup>
import { useAuthStore } from '../stores/auth';
import ObjectivesList from '../components/ObjectivesList.vue';

const authStore = useAuthStore();
</script>

<template>
  <div>
    <h1>Tableau de bord</h1>
    <p v-if="authStore.user">Bonjour, {{ authStore.user.name }} !</p>
    
    <hr />
    
    <!-- Section des objectifs journaliers -->
    <section>
      <ObjectivesList />
    </section>

    <hr />

    <!-- Section du Time Tracker (Partie 4) -->
    <section>
      <h2>Time Tracker</h2>
      <p>(À venir dans la partie 4)</p>
    </section>
  </div>
</template>
