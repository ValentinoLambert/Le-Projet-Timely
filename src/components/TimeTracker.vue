<script setup>
import { onMounted, ref, computed, onUnmounted } from 'vue';
import { toast } from 'vue3-toastify';
import { marked } from 'marked';
import { useTimeEntryStore } from '../stores/timeEntries';
import { useProjectStore } from '../stores/projects';
import { useActivityStore } from '../stores/activities';

const timeEntryStore = useTimeEntryStore();
const projectStore = useProjectStore();
const activityStore = useActivityStore();

const selectedProjectId = ref('');
const selectedActivityId = ref('');
const comment = ref('');

// Mode édition ou aperçu pour les notes Markdown
const isEditingNotes = ref(true);

// Gestion du commentaire actif (lecture/écriture via le store)
const activeComment = computed({
  get() {
    return timeEntryStore.activeEntry?.comment || '';
  },
  set(value) {
    if (timeEntryStore.activeEntry) {
      timeEntryStore.updateActiveComment(value);
    }
  }
});

// Formatage de la durée (secondes -> HH:MM:SS)
const formatDuration = (seconds) => {
  if (!seconds && seconds !== 0) return '00:00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

// Logique du chronomètre
const currentDuration = ref(0);
let timerInterval = null;

const updateTimer = () => {
    if (timeEntryStore.activeEntry?.start) {
        // Calcul du temps écoulé en temps réel
        const startTime = new Date(timeEntryStore.activeEntry.start);
        const now = new Date();
        const diff = Math.floor((now - startTime) / 1000);
        currentDuration.value = diff > 0 ? diff : 0;
    } else {
        currentDuration.value = 0;
    }
};

onMounted(() => {
  Promise.all([
    projectStore.fetchProjects(),
    activityStore.fetchActivities(),
    timeEntryStore.fetchTimeEntries()
  ]).then(() => {
      updateTimer();
  });
  
  // Mise à jour toutes les secondes
  timerInterval = setInterval(updateTimer, 1000);
});

onUnmounted(() => {
    if (timerInterval) clearInterval(timerInterval);
});

// Utilitaires d'affichage
const getProjectName = (id) => projectStore.projects.find(p => p.id === id)?.name || 'Projet inconnu';
const getActivityName = (id) => activityStore.activities.find(a => a.id === id)?.name || 'Activité inconnue';
const getActivityColor = (id) => activityStore.activities.find(a => a.id === id)?.color || '#ccc';

const startActivity = async () => {
    if (!selectedProjectId.value || !selectedActivityId.value) return;
    
    try {
        await timeEntryStore.createTimeEntry(selectedProjectId.value, selectedActivityId.value, comment.value);
        
        // Réinitialisation du formulaire
        selectedProjectId.value = '';
        selectedActivityId.value = '';
        comment.value = '';
        
        // Force une mise à jour immédiate du timer
        setTimeout(updateTimer, 100); 
    } catch (e) {
        toast.error("Impossible de démarrer l'activité");
    }
};

const stopActivity = async () => {
    if (!timeEntryStore.activeEntry) return;
    
    try {
        await timeEntryStore.stopTimeEntry(timeEntryStore.activeEntry.id);
        currentDuration.value = 0;
    } catch (e) {
        toast.error("Erreur lors de l'arrêt de l'activité");
    }
};

const formatTime = (isoString) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
};

/**
 * Convertit le Markdown en HTML pour l'affichage
 */
const renderMarkdown = (content) => {
  if (!content) return '';
  return marked.parse(content);
};
</script>

<template>
  <div class="tracker-container">
    <!-- Active Timer Card -->
    <div v-if="timeEntryStore.activeEntry" class="card active-timer-card">
      <div class="active-header">
        <div class="status-indicator">
          <span class="status-dot pulse"></span>
          <span class="status-text">En cours</span>
        </div>
        <div class="timer-display">{{ formatDuration(currentDuration) }}</div>
      </div>
      
      <div class="active-details">
        <h3 class="project-title">
          {{ getProjectName(timeEntryStore.activeEntry.project_id) }}
          <span class="separator">/</span>
          <span class="activity-name" :style="{ color: getActivityColor(timeEntryStore.activeEntry.activity_id) }">
            {{ getActivityName(timeEntryStore.activeEntry.activity_id) }}
          </span>
        </h3>
        
        <div class="comment-group">
            <label class="text-sm text-muted">Notes</label>
            <textarea 
                v-model="activeComment" 
                placeholder="Ajouter des notes (Markdown supporté)..." 
                rows="3"
            ></textarea>
            
            <!-- Aperçu direct Markdown -->
            <div v-if="activeComment" class="live-preview">
              <span class="preview-label">Aperçu :</span>
              <div class="markdown-body" v-html="renderMarkdown(activeComment)"></div>
            </div>
        </div>

        <button @click="stopActivity" class="danger">Arrêter</button>
      </div>
    </div>

    <!-- Start New Timer Card -->
    <div v-else class="card">
      <h3>Démarrer une activité</h3>
      <form @submit.prevent="startActivity">
        <div class="grid grid-cols-2 gap-2">
            <div>
              <label>Projet</label>
              <select v-model="selectedProjectId" required>
                  <option value="" disabled selected>Choisir...</option>
                  <option v-for="p in projectStore.activeProjects" :key="p.id" :value="p.id">{{ p.name }}</option>
              </select>
            </div>
            <div>
              <label>Activité</label>
              <select v-model="selectedActivityId" required>
                  <option value="" disabled selected>Choisir...</option>
                  <option v-for="a in activityStore.activeActivities" :key="a.id" :value="a.id">{{ a.name }}</option>
              </select>
            </div>
        </div>
        
        <label>Description</label>
        <input v-model="comment" placeholder="Sur quoi travaillez-vous ?" />
        
        <button type="submit" class="full-width">Démarrer</button>
      </form>
    </div>

    <!-- Today's Entries List -->
    <div class="entries-list">
        <h3>Activités du jour</h3>
        <div v-if="timeEntryStore.todayEntries.length === 0" class="empty-state text-muted text-sm">
            Aucune activité enregistrée aujourd'hui.
        </div>
        <ul v-else class="entry-list-ul">
            <li v-for="entry in timeEntryStore.todayEntries" :key="entry.id" class="entry-item">
                <div class="entry-main">
                     <span class="activity-marker" :style="{ backgroundColor: getActivityColor(entry.activity_id) }"></span>
                     <div class="entry-content">
                        <div class="entry-header">
                          <span class="entry-project">{{ getProjectName(entry.project_id) }}</span>
                          <span class="entry-activity text-muted">{{ getActivityName(entry.activity_id) }}</span>
                        </div>
                        <div v-if="entry.comment" class="entry-comment-box">
                          <div class="markdown-body text-sm" v-html="renderMarkdown(entry.comment)"></div>
                        </div>
                     </div>
                </div>
                <div class="entry-time text-sm">
                    {{ formatTime(entry.start) }} - {{ entry.end ? formatTime(entry.end) : '...' }}
                </div>
            </li>
        </ul>
    </div>
  </div>
</template>

<style scoped>
.active-timer-card {
    border: 1px solid var(--primary-color);
    background-color: rgba(96, 165, 250, 0.1); 
}

.active-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--border-color);
}

.status-indicator {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.status-text {
    color: var(--primary-color);
    font-weight: 600;
    font-size: 0.875rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.timer-display {
    font-family: monospace;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--primary-color);
}

.status-dot {
    width: 8px;
    height: 8px;
    background-color: var(--primary-color);
    border-radius: 50%;
}

.pulse {
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.4; }
    100% { opacity: 1; }
}

.project-title {
    margin: 0;
    font-size: 1.125rem;
}

.separator {
    color: var(--text-secondary);
    margin: 0 0.5rem;
}

.comment-group {
    margin: 1rem 0;
}

.live-preview {
  margin-top: 0.75rem;
  padding: 0.75rem;
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
  border-left: 3px solid var(--primary-color);
}

.preview-label {
  display: block;
  font-size: 0.75rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.entry-comment-box {
  margin-top: 0.25rem;
}

/* Styles Markdown Complets */
:deep(.markdown-body) {
  line-height: 1.6;
  color: var(--text-primary);
}

:deep(.markdown-body p) { 
  margin-bottom: 0.5rem; 
}

:deep(.markdown-body strong) {
  font-weight: 700;
  color: var(--primary-color);
}

:deep(.markdown-body em) {
  font-style: italic;
  color: var(--text-secondary);
}

:deep(.markdown-body ul),
:deep(.markdown-body ol) { 
  padding-left: 1.2rem; 
  margin-bottom: 0.5rem; 
}

:deep(.markdown-body h1), 
:deep(.markdown-body h2), 
:deep(.markdown-body h3) { 
  font-weight: 700; 
  margin-top: 0.75rem; 
  margin-bottom: 0.25rem; 
  color: var(--text-primary);
}

:deep(.markdown-body h1) { font-size: 1.2rem; }
:deep(.markdown-body h2) { font-size: 1.1rem; }
:deep(.markdown-body h3) { font-size: 1rem; }

:deep(.markdown-body code) {
  background-color: rgba(255, 255, 255, 0.1);
  padding: 0.1rem 0.3rem;
  border-radius: 3px;
  font-family: monospace;
  font-size: 0.85rem;
}

:deep(.markdown-body a) {
  color: var(--primary-color);
  text-decoration: underline;
}

.full-width { width: 100%; }

.grid-cols-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
}

.entry-list-ul {
    list-style: none;
    padding: 0;
    margin: 0;
}

.entry-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 0;
    border-bottom: 1px solid var(--border-color);
}

.entry-item:last-child { border-bottom: none; }

.entry-main {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
}

.activity-marker {
    width: 4px;
    height: 30px; 
    border-radius: 2px;
}

.entry-content {
    display: flex;
    flex-direction: column;
}

.entry-header {
    display: flex;
    gap: 0.5rem;
    align-items: baseline;
}

.entry-project { font-weight: 500; }

.entry-time {
    color: var(--text-secondary);
    font-family: monospace;
    white-space: nowrap;
}
</style>
