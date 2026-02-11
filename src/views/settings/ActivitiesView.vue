<script setup>
import { onMounted, ref, computed } from 'vue';
import { toast } from 'vue3-toastify';
import { marked } from 'marked';
import { useActivityStore } from '../../stores/activities';

/**
 * Vue de gestion des activités
 * 
 * Fonctionnalités:
 * - CRUD complet des activités
 * - Support Markdown pour les descriptions
 * - Activation/désactivation d'activités
 * - Recherche par mots-clés
 * - Affichage dépliable des descriptions
 */

const activityStore = useActivityStore();

// État du formulaire
const newName = ref('');
const newColor = ref('#3498db');
const newDescription = ref('');
const searchKeywords = ref('');
const editing = ref(null);
const expandedIds = ref(new Set());


onMounted(() => {
  activityStore.fetchActivities();
});

/**
 * Ajoute une nouvelle activité avec description Markdown optionnelle
 * Réinitialise le formulaire après succès
 */
const addActivity = async () => {
  if (!newName.value) {
    toast.error('Le nom est obligatoire');
    return;
  }

  try {
    await activityStore.createActivity(newName.value, newColor.value, newDescription.value);
    newName.value = '';
    newColor.value = '#3498db';
    newDescription.value = '';
    toast.success('Activité créée avec succès');
  } catch (err) {
    toast.error('Erreur lors de la création de l\'activité');
  }
};

const toggleActivity = async (activity) => {
  try {
    await activityStore.toggleActivity(activity);
    await activityStore.fetchActivities();
    toast.info(activity.is_enabled ? 'Activité désactivée' : 'Activité activée');
  } catch (err) {
    toast.error('Erreur lors de la modification');
  }
};

const editActivity = (activity) => {
  editing.value = {
    id: activity.id,
    name: activity.name,
    color: activity.color || '#3498db',
    description: activity.description || ''
  };
};

const saveEdit = async () => {
  if (!editing.value || !editing.value.name) {
    toast.error('Le nom est obligatoire');
    return;
  }
  
  try {
    await activityStore.updateActivity(
      editing.value.id,
      editing.value.name,
      editing.value.color,
      editing.value.description
    );
    editing.value = null;
    await activityStore.fetchActivities();
    toast.success('Activité modifiée avec succès');
  } catch (err) {
    toast.error('Erreur lors de la modification');
  }
};

const cancelEdit = () => {
  editing.value = null;
};

/**
 * Bascule l'affichage de la description pour une activité
 */
const toggleExpand = (id) => {
  if (expandedIds.value.has(id)) {
    expandedIds.value.delete(id);
  } else {
    expandedIds.value.add(id);
  }
};

/**
 * Convertit le Markdown en HTML pour l'affichage
 */
const renderMarkdown = (content) => {
  if (!content) return '';
  return marked.parse(content);
};

/**
 * Filtre les activités selon les mots-clés de recherche
 */
const filteredActivities = () => {
  if (!searchKeywords.value) return activityStore.activities;
  
  const keywords = searchKeywords.value.toLowerCase();
  const result = [];
  for (let i = 0; i < activityStore.activities.length; i++) {
    if (activityStore.activities[i].name.toLowerCase().includes(keywords)) {
      result.push(activityStore.activities[i]);
    }
  }
  return result;
};
</script>

<template>
  <div>
    <h2>Mes activités</h2>
    
    <form @submit.prevent="addActivity" style="margin-bottom: 20px; padding: 10px; border: 1px solid #ddd;">
      <h3>Ajouter une activité</h3>
      <div>
        <label>Nom :</label>
        <input v-model="newName" type="text" required />
      </div>
      <div>
        <label>Couleur :</label>
        <input v-model="newColor" type="color" />
      </div>
      <div>
        <label>Description (Markdown supporté) :</label>
        <textarea v-model="newDescription" rows="3" placeholder="Description optionnelle..."></textarea>
      </div>
      <button type="submit">Ajouter</button>
    </form>

    <div style="margin-bottom: 10px;">
      <label>Rechercher :</label>
      <input v-model="searchKeywords" type="text" placeholder="Mots-clés..." />
    </div>

    <div v-if="activityStore.loading">Chargement...</div>
    
    <div v-else-if="filteredActivities().length > 0">
      <transition-group name="list" tag="ul">
        <li v-for="activity in filteredActivities()" :key="activity.id">
          
          <!-- Mode édition -->
          <div v-if="editing && editing.id === activity.id" style="border: 1px solid blue; padding: 10px; margin: 5px 0;">
            <div>
              <label>Nom :</label>
              <input v-model="editing.name" type="text" required />
            </div>
            <div>
              <label>Couleur :</label>
              <input v-model="editing.color" type="color" />
            </div>
            <div>
              <label>Description (Markdown) :</label>
              <textarea v-model="editing.description" rows="3" placeholder="Description optionnelle..."></textarea>
            </div>
            <button @click="saveEdit">Enregistrer</button>
            <button @click="cancelEdit">Annuler</button>
          </div>
          
          <!-- Mode affichage -->
          <div v-else>
            <span :style="{ display: 'inline-block', width: '20px', height: '20px', backgroundColor: activity.color, marginRight: '10px' }"></span>
            <strong>{{ activity.name }}</strong>
            <span v-if="!activity.is_enabled" style="color: red;"> (Désactivé)</span>
            <br />
            
            <!-- Boutons d'action -->
            <button @click="editActivity(activity)">Modifier</button>
            <button @click="toggleActivity(activity)">
              {{ activity.is_enabled ? 'Désactiver' : 'Activer' }}
            </button>
            <button 
              v-if="activity.description" 
              @click="toggleExpand(activity.id)"
              style="margin-left: 10px;"
            >
              {{ expandedIds.has(activity.id) ? '▲ Masquer' : '▼ Détails' }}
            </button>
            
            <!-- Description en Markdown -->
            <div 
              v-if="expandedIds.has(activity.id) && activity.description" 
              class="description-box"
            >
              <div class="markdown-body" v-html="renderMarkdown(activity.description)"></div>
            </div>
          </div>
        </li>
      </transition-group>
    </div>

    <p v-else>Aucune activité trouvée.</p>
  </div>
</template>

<style scoped>
.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}

.list-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.list-move {
  transition: transform 0.5s ease;
}

.description-box {
  margin-top: 10px;
  padding: 10px;
  background-color: rgba(0, 0, 0, 0.05);
  border-left: 3px solid var(--primary-color, #6366f1);
  border-radius: 4px;
  font-size: 0.9rem;
}


/* Styles Markdown Complets */
:deep(.markdown-body) {
  line-height: 1.6;
  color: var(--text-primary);
}

:deep(.markdown-body p) { 
  margin-bottom: 0.75rem; 
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
  padding-left: 1.5rem; 
  margin-bottom: 0.75rem; 
}

:deep(.markdown-body li) {
  margin-bottom: 0.25rem;
}

:deep(.markdown-body h1), 
:deep(.markdown-body h2), 
:deep(.markdown-body h3) { 
  font-weight: 700; 
  margin-top: 1rem; 
  margin-bottom: 0.5rem; 
  color: var(--text-primary);
}

:deep(.markdown-body h1) { font-size: 1.5rem; }
:deep(.markdown-body h2) { font-size: 1.25rem; }
:deep(.markdown-body h3) { font-size: 1.1rem; }

:deep(.markdown-body code) {
  background-color: rgba(255, 255, 255, 0.1);
  padding: 0.1rem 0.3rem;
  border-radius: 3px;
  font-family: monospace;
  font-size: 0.85rem;
}

:deep(.markdown-body pre) {
  background-color: rgba(0, 0, 0, 0.3);
  padding: 0.75rem;
  border-radius: 6px;
  overflow-x: auto;
  margin-bottom: 0.75rem;
}

:deep(.markdown-body pre code) {
  background-color: transparent;
  padding: 0;
}

:deep(.markdown-body a) {
  color: var(--primary-color);
  text-decoration: underline;
}

:deep(.markdown-body a:hover) {
  opacity: 0.8;
}

:deep(.markdown-body blockquote) {
  border-left: 3px solid var(--primary-color);
  padding-left: 1rem;
  margin-left: 0;
  color: var(--text-secondary);
  font-style: italic;
}
</style>
