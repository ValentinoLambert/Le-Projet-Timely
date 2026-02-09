<script setup>
import { useAuthStore } from '../stores/auth';
import ObjectivesList from '../components/ObjectivesList.vue';
import TimeTracker from '../components/TimeTracker.vue';

const authStore = useAuthStore();
</script>

<template>
  <div>
    <div class="page-header">
      <h1>Tableau de bord</h1>
      <p class="text-muted">
        {{ new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) }}
      </p>
    </div>
    
    <div class="grid-layout">
      <!-- Zone Principale : Time Tracker -->
      <div class="main-col">
        <TimeTracker />
      </div>

      <!-- Sidebar : Objectifs -->
      <aside class="sidebar-col">
        <ObjectivesList />
      </aside>
    </div>
  </div>
</template>

<style scoped>
.page-header {
  margin-bottom: 2rem;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 1rem;
}

.page-header h1 { margin-bottom: 0.25rem; }
.page-header p { text-transform: capitalize; margin: 0; }

.grid-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

@media (min-width: 1024px) {
  .grid-layout {
    grid-template-columns: 2fr 1fr;
  }
}
</style>
