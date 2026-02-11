<script setup>
import { onMounted, ref, computed } from 'vue';
import { useObjectiveStore } from '../stores/objectives';
import { marked } from 'marked';

const objectiveStore = useObjectiveStore();

// État local du formulaire et des filtres
const newObjName = ref('');
const newObjContent = ref(''); // Contenu description (Markdown)
const showCompleted = ref(false); // Filtre pour afficher/masquer les terminés
const expandedIds = ref(new Set()); // Suivi des éléments dépliés

// Chargement initial des objectifs
onMounted(() => {
  objectiveStore.fetchObjectives();
});

// Tri des objectifs : les plus récents en premier (ID décroissant)
const sortedObjectives = computed(() => {
  return [...objectiveStore.objectives].sort((a, b) => b.id - a.id);
});

// Filtrage selon l'état "terminé"
const filteredObjectives = computed(() => {
  if (showCompleted.value) return sortedObjectives.value;
  return sortedObjectives.value.filter(obj => !obj.done);
});

// Calcul du taux d'avancement journalier (entier arrondi)
const completionRate = computed(() => {
    const total = objectiveStore.todayTotalCount;
    if (total === 0) return 0;
    return Math.round((objectiveStore.todayDoneCount / total) * 100);
});

/**
 * Ajoute un nouvel objectif via le store
 * Réinitialise le formulaire en cas de succès
 */
const addObjective = async () => {
  if (!newObjName.value) return;
  try {
    await objectiveStore.createObjective(newObjName.value, newObjContent.value);
    newObjName.value = '';
    newObjContent.value = '';
  } catch (err) {
    // L'erreur est gérée globalement ou dans le store (ex: toast)
  }
};

const deleteObj = async (id) => {
    await objectiveStore.deleteObjective(id);
};

const toggleObj = async (obj) => {
    await objectiveStore.toggleObjective(obj);
};

/**
 * Gère l'affichage/masquage des détails (description Markdown)
 * @param {number} id - ID de l'objectif
 */
const toggleExpand = (id) => {
    if (expandedIds.value.has(id)) {
        expandedIds.value.delete(id);
    } else {
        expandedIds.value.add(id);
    }
};

/**
 * Convertit le contenu Markdown en HTML
 */
const renderMarkdown = (content) => {
    if (!content) return '';
    return marked.parse(content);
};
</script>

<template>
  <div class="card">
    <div class="header-row">
      <h3>Objectifs du Jour</h3>
      <div v-if="objectiveStore.todayTotalCount > 0" class="completion-badge text-sm">
        {{ completionRate }}%
      </div>
    </div>
    
    <p class="text-sm text-muted mb-4">Définissez vos priorités pour la journée.</p>

    <form @submit.prevent="addObjective" class="objective-form">
      <input 
        v-model="newObjName" 
        placeholder="Titre de l'objectif..." 
        class="full-width mb-2"
        required
      />
      <textarea
        v-model="newObjContent"
        placeholder="Description (Markdown supporté)..."
        class="full-width mb-2"
        rows="2"
      ></textarea>
      <button type="submit" class="full-width">Ajouter</button>
    </form>

    <div class="filter-row text-sm">
      <label class="checkbox-label">
        <input type="checkbox" v-model="showCompleted" />
        <span class="text-muted ml-2">Afficher les terminés</span>
      </label>
    </div>
    
    <ul class="obj-list">
      <li v-for="obj in filteredObjectives" :key="obj.id" :class="{ done: obj.done }">
        <div class="obj-main">
            <label class="item-row">
            <input 
                type="checkbox" 
                :checked="obj.done" 
                @change="toggleObj(obj)" 
            />
            <span class="obj-text">{{ obj.name }}</span>
            </label>
            
            <div class="actions">
                <button 
                    v-if="obj.content" 
                    @click.stop="toggleExpand(obj.id)" 
                    class="action-btn" 
                    :title="expandedIds.has(obj.id) ? 'Masquer détails' : 'Voir détails'"
                >
                    <span class="chevron" :class="{ rotated: expandedIds.has(obj.id) }">▼</span>
                </button>
                <button @click.stop="deleteObj(obj.id)" class="action-btn delete-btn" title="Supprimer">
                &times;
                </button>
            </div>
        </div>
        
        <!-- Markdown Description -->
        <div v-if="expandedIds.has(obj.id) && obj.content" class="obj-details">
            <div class="markdown-body" v-html="renderMarkdown(obj.content)"></div>
        </div>
      </li>
    </ul>
    
    <div v-if="filteredObjectives.length === 0" class="empty-state text-sm text-muted">
      {{ showCompleted ? 'Aucun objectif pour le moment.' : 'Rien à faire (ou tout est fait !).' }}
    </div>
  </div>
</template>

<style scoped>
.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.mb-4 { margin-bottom: 1rem; }
.mb-2 { margin-bottom: 0.5rem; }
.ml-2 { margin-left: 0.5rem; }

.completion-badge {
  background-color: rgba(255, 255, 255, 0.1);
  padding: 0.125rem 0.5rem;
  border-radius: 99px;
  font-weight: 600;
  color: var(--primary-color);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.filter-row { 
    margin: 1rem 0; 
    display: flex;
    justify-content: flex-end;
}
.checkbox-label { display: flex; align-items: center; cursor: pointer; }

.obj-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.obj-list li {
  display: flex;
  flex-direction: column;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--border-color);
}
.obj-list li:last-child { border-bottom: none; }

.obj-main {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
}

.item-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  cursor: pointer;
}

.obj-text {
  transition: color 0.2s;
  font-weight: 500;
}

.done .obj-text {
  text-decoration: line-through;
  color: var(--text-secondary);
}

.actions {
    display: flex;
    gap: 0.5rem;
}

.action-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 1rem;
  padding: 0.25rem 0.5rem;
  cursor: pointer;
  transition: color 0.2s;
}

.delete-btn:hover { color: var(--danger-color); }
.action-btn:hover { color: var(--text-primary); }

.obj-details {
    margin-top: 0.5rem;
    padding: 0.75rem;
    background-color: rgba(0, 0, 0, 0.2);
    border-radius: 6px;
    font-size: 0.9rem;
    color: var(--text-secondary);
}

.chevron {
    display: inline-block;
    transition: transform 0.2s ease;
    font-size: 0.8rem;
}

.rotated {
    transform: rotate(180deg);
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
