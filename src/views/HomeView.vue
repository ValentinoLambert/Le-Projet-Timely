<script setup>
import { useAuthStore } from '../stores/auth';
import ObjectivesList from '../components/ObjectivesList.vue';
import TimeTracker from '../components/TimeTracker.vue';

const authStore = useAuthStore();
</script>

<template>
  <div>
    <h1>Tableau de bord</h1>
    <p v-if="authStore.user">Bonjour, {{ authStore.user.name }} !</p>
    
    <hr />
    
    <!-- Section du Time Tracker -->
    <section>
      <TimeTracker />
    </section>

    <hr />

    <!-- Section des objectifs journaliers -->
    <section>
      <ObjectivesList />
    </section>
  </div>
</template>
