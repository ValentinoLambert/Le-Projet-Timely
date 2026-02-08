<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useAuthStore } from './stores/auth';
import { useTimeEntryStore } from './stores/timeEntries';
import { useObjectiveStore } from './stores/objectives';
import { useRouter } from 'vue-router';
import ToastNotifications from './components/ToastNotifications.vue';
import { formatDuration } from './mixins/durations';

const authStore = useAuthStore();
const timeEntryStore = useTimeEntryStore();
const objectiveStore = useObjectiveStore();
const router = useRouter();

const currentDuration = ref(0);
let interval = null;

// Fonction pour calculer la durée actuelle
const updateCurrentDuration = () => {
  const active = timeEntryStore.activeEntry;
  if (active && active.start) {
    const start = new Date(active.start);
    const now = new Date();
    currentDuration.value = Math.floor((now - start) / 1000);
  } else {
    currentDuration.value = 0;
  }
};

// Surveiller les changements de l'entrée active
watch(() => timeEntryStore.activeEntry, (newActive) => {
  // Recalculer immédiatement quand une nouvelle entrée active apparaît
  updateCurrentDuration();
});

onMounted(async () => {
  if (authStore.isAuthenticated) {
    await timeEntryStore.fetchTimeEntries();
    objectiveStore.fetchObjectives();
    
    // Calculer immédiatement la durée après le chargement des données
    updateCurrentDuration();
    
    // Mettre à jour la durée en cours toutes les secondes
    interval = setInterval(() => {
      updateCurrentDuration();
    }, 1000);
  }
});

onUnmounted(() => {
  if (interval) clearInterval(interval);
});

const logout = () => {
  authStore.logout();
  router.push('/login');
};

// Utiliser les getters centralisés du store
const totalToday = computed(() => {
  return formatDuration(timeEntryStore.totalTodaySeconds);
});

const objectivesCount = computed(() => {
  return objectiveStore.todayDoneCount + '/' + objectiveStore.todayTotalCount;
});

const stopCurrentActivity = async () => {
  if (timeEntryStore.activeEntry) {
    await timeEntryStore.stopTimeEntry(timeEntryStore.activeEntry.id);
  }
};
</script>

<template>
  <ToastNotifications />
  <header v-if="authStore.isAuthenticated">
    <nav>
      <div class="nav-left">
        <router-link to="/">Activité</router-link> |
        <router-link to="/statistics">Statistiques</router-link> |
        <router-link to="/settings">Paramètres</router-link>
      </div>
      
      <div class="nav-center" v-if="timeEntryStore.activeEntry">
        <span class="active-indicator">●</span>
        <strong>En cours:</strong>
        <span>{{ (timeEntryStore.activeEntry.project && timeEntryStore.activeEntry.project.name) || 'Projet' }} - {{ (timeEntryStore.activeEntry.activity && timeEntryStore.activeEntry.activity.name) || 'Activité' }}</span>
        <span class="duration">{{ formatDuration(currentDuration) }}</span>
        <button @click="stopCurrentActivity" class="stop-btn">Arrêter</button>
      </div>
      
      <div class="nav-right">
        <span>Aujourd'hui: {{ totalToday }}</span> |
        <span>Objectifs: {{ objectivesCount }}</span> |
        <button @click="logout">Déconnexion</button>
      </div>
    </nav>
  </header>
  <router-view />
</template>

<style>
nav { 
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px; 
  border-bottom: 2px solid #ccc; 
  background-color: #f5f5f5;
  margin-bottom: 20px;
}

.nav-left, .nav-center, .nav-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.nav-center {
  background-color: #e3f2fd;
  padding: 8px 15px;
  border-radius: 5px;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}

.active-indicator {
  color: #4caf50;
  font-size: 20px;
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.duration {
  font-family: monospace;
  font-size: 18px;
  font-weight: bold;
  color: #1976d2;
}

.stop-btn {
  background-color: #f44336;
  color: white;
  border: none;
  padding: 5px 15px;
  border-radius: 3px;
  cursor: pointer;
}

.stop-btn:hover {
  background-color: #d32f2f;
}

nav a { 
  margin: 0 5px; 
  text-decoration: none; 
  color: #333;
}

nav a.router-link-active {
  font-weight: bold;
  color: #1976d2;
}

nav button {
  background: none;
  border: none;
  color: #333;
  cursor: pointer;
  font-size: 14px;
}

nav button:hover {
  color: #1976d2;
}
</style>
