<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { RouterLink, RouterView, useRouter } from 'vue-router';

// Stores Pinia
import { useAuthStore } from './stores/auth';
import { useTimeEntryStore } from './stores/timeEntries';
import { useObjectiveStore } from './stores/objectives';
import { useProjectStore } from './stores/projects';
import { useActivityStore } from './stores/activities';

// Initialisation des instances
const router = useRouter();
const authStore = useAuthStore();
const timeEntryStore = useTimeEntryStore();
const objectiveStore = useObjectiveStore();
const projectStore = useProjectStore();
const activityStore = useActivityStore();

/**
 * Gestion de la déconnexion utilisateur
 * Redirige vers la page de connexion après nettoyage du store
 */
const logout = () => {
  authStore.logout();
  router.push('/login');
};

// Récupération de l'entrée active (si elle existe)
const activeActivity = computed(() => timeEntryStore.activeEntry);

// Récupération du nom du projet actif
const activeProjectName = computed(() => {
  if (!activeActivity.value) return '';
  const p = projectStore.projects.find(p => p.id === activeActivity.value.project_id);
  return p ? p.name : 'Inconnu';
});

// Récupération du nom de l'activité active
const activeActivityName = computed(() => {
  if (!activeActivity.value) return '';
  const a = activityStore.activities.find(a => a.id === activeActivity.value.activity_id);
  return a ? a.name : 'Inconnu';
});

/**
 * Timer en temps réel synchronisé avec TimeTracker
 * Calcule directement depuis la date de début de l'activité active
 */
const currentDuration = ref(0);
let timerInterval = null;

/**
 * Met à jour la durée écoulée en calculant la différence
 * entre maintenant et le début de l'activité
 */
const updateTimer = () => {
  if (timeEntryStore.activeEntry?.start) {
    const startTime = new Date(timeEntryStore.activeEntry.start);
    const now = new Date();
    const diff = Math.floor((now - startTime) / 1000);
    currentDuration.value = diff > 0 ? diff : 0;
  } else {
    currentDuration.value = 0;
  }
};

/**
 * Démarre le timer au montage et le met à jour toutes les secondes
 */
onMounted(() => {
  updateTimer();
  timerInterval = setInterval(updateTimer, 1000);
});

/**
 * Nettoie l'intervalle au démontage du composant
 */
onUnmounted(() => {
  if (timerInterval) {
    clearInterval(timerInterval);
  }
});

// Calcul de la durée écoulée pour l'activité en cours
// Format: HH:MM:SS
const activeDuration = computed(() => {
  const seconds = currentDuration.value;
  if (!seconds && seconds !== 0) return '00:00:00';
  
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
});

// Calcul du total d'heures travaillées aujourd'hui
// Format: XhXX
const totalHoursToday = computed(() => {
  const seconds = timeEntryStore.totalTodaySeconds;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h${m > 0 ? m.toString().padStart(2, '0') : ''}`;
});

// Progression des objectifs journaliers (Réalisés / Total)
const objectivesProgress = computed(() => {
  return `${objectiveStore.todayDoneCount} / ${objectiveStore.todayTotalCount}`;
});

/**
 * Arrête l'activité en cours directement depuis le header
 */
const stopActivity = async () => {
  if (activeActivity.value) {
    await timeEntryStore.stopTimeEntry(activeActivity.value.id);
    currentDuration.value = 0;
  }
};
</script>

<template>
  <div id="app-container">
    <header v-if="authStore.isAuthenticated">
      <div class="logo">Timely</div>
      
      <nav>
        <div class="nav-links">
          <RouterLink to="/" class="nav-item">Tableau de bord</RouterLink>
          <RouterLink to="/stats" class="nav-item">Statistiques</RouterLink>
          <RouterLink to="/settings" class="nav-item">Paramètres</RouterLink>
        </div>

        <div class="header-stats">
            <!-- Indicateur d'activité active -->
            <div v-if="activeActivity" class="active-indicator">
                <span class="pulse-dot"></span>
                <div class="active-info">
                    <span class="active-title" :title="activeProjectName + ' - ' + activeActivityName">
                        {{ activeProjectName }} / {{ activeActivityName }}
                    </span>
                    <span class="active-timer">{{ activeDuration }}</span>
                </div>
                <button @click="stopActivity" class="stop-btn" title="Arrêter l'activité">
                    <div class="stop-icon"></div>
                </button>
            </div>

            <!-- Statistiques Journalières -->
            <div class="daily-summary">
                <div class="stat-item" title="Temps total travaillé aujourd'hui">
                    <span class="stat-label">Temps</span>
                    <span class="stat-value">{{ totalHoursToday }}</span>
                </div>
                <div class="stat-item" title="Objectifs atteints / Total">
                    <span class="stat-label">Objectifs</span>
                    <span class="stat-value">{{ objectivesProgress }}</span>
                </div>
            </div>

            <button @click="logout" class="logout-btn secondary text-sm">Déconnexion</button>
        </div>

      </nav>
    </header>
    
    <main>
      <router-view />
    </main>
  </div>
</template>

<style scoped>
header {
    background-color: var(--surface-color);
    border-bottom: 1px solid var(--border-color);
    padding: 1rem 2rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.logo {
  font-weight: 700;
  font-size: 1.5rem;
  color: var(--primary-color);
  letter-spacing: -0.025em;
}

nav {
    display: flex;
    align-items: center;
    gap: 3rem;
    flex: 1;
    justify-content: space-between;
    margin-left: 3rem;
}

.nav-links {
  display: flex;
  gap: 1.5rem;
}

.nav-item {
    text-decoration: none;
    color: var(--text-secondary);
    font-weight: 500;
    transition: color 0.2s;
}

.nav-item:hover, .nav-item.router-link-active {
    color: var(--text-primary);
}

.header-stats {
    display: flex;
    align-items: center;
    gap: 1.5rem;
}

.active-indicator {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    background-color: rgba(99, 102, 241, 0.1);
    padding: 0.35rem 1rem;
    border-radius: 99px;
    border: 1px solid rgba(99, 102, 241, 0.2);
}

.pulse-dot {
    width: 8px;
    height: 8px;
    background-color: var(--primary-color);
    border-radius: 50%;
    animation: pulse 2s infinite;
}

.active-info {
    display: flex;
    flex-direction: column;
    font-size: 0.75rem;
    line-height: 1.2;
}

.active-title {
    font-weight: 600;
    max-width: 200px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--text-primary);
}

.active-timer {
    font-family: monospace;
    color: var(--primary-color);
    font-weight: 700;
}

.stop-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.25rem;
    margin-left: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: background-color 0.2s;
}

.stop-btn:hover {
    background-color: rgba(239, 68, 68, 0.1);
}

.stop-icon {
    width: 12px;
    height: 12px;
    background-color: var(--danger-color);
    border-radius: 2px;
}

.daily-summary {
    display: flex;
    gap: 1.5rem;
    font-size: 0.875rem;
    color: var(--text-secondary);
    border-left: 1px solid var(--border-color);
    border-right: 1px solid var(--border-color);
    padding: 0 1.5rem;
}

.stat-item {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    line-height: 1.2;
}

.stat-label {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-muted);
}

.stat-value {
    font-weight: 600;
    color: var(--text-primary);
}

.logout-btn {
    padding: 0.35rem 1rem;
}

@keyframes pulse {
    0% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4); }
    70% { box-shadow: 0 0 0 6px rgba(99, 102, 241, 0); }
    100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0); }
}
</style>
