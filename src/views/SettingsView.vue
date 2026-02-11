<script setup>
import { onMounted, ref } from 'vue';
import { useProjectStore } from '../stores/projects';
import { useActivityStore } from '../stores/activities';

/**
 * Vue de paramètres avec navigation par onglets
 * Permet la gestion rapide des projets et activités
 * Version simplifiée pour accès rapide (version complète dans /settings/projects et /settings/activities)
 */

const projectStore = useProjectStore();
const activityStore = useActivityStore();

// État du formulaire et navigation
const newProjectName = ref('');
const newProjectDesc = ref('');
const newActivityName = ref('');
const newActivityColor = ref('#000000');
const activeTab = ref('projects');


onMounted(() => {
  projectStore.fetchProjects();
  activityStore.fetchActivities();
});

const addProject = async () => {
  if (!newProjectName.value) return;
  try {
    await projectStore.createProject(newProjectName.value, newProjectDesc.value);
    newProjectName.value = '';
    newProjectDesc.value = '';
  } catch (err) { alert('Erreur'); }
};

const addActivity = async () => {
  if (!newActivityName.value) return;
  try {
    await activityStore.createActivity(newActivityName.value, newActivityColor.value);
    newActivityName.value = '';
  } catch (err) { alert('Erreur'); }
};
</script>

<template>
  <div>
    <div class="page-header">
      <h2>Paramètres</h2>
    </div>

    <div class="tabs">
      <button 
        :class="['tab-btn', { active: activeTab === 'projects' }]" 
        @click="activeTab = 'projects'"
      >
        Projets
      </button>
      <button 
        :class="['tab-btn', { active: activeTab === 'activities' }]" 
        @click="activeTab = 'activities'"
      >
        Activités
      </button>
    </div>

    <!-- Section Projets -->
    <section v-if="activeTab === 'projects'" class="card">
      <div class="section-header">
        <h3>Gestion des Projets</h3>
        <span class="badge">{{ projectStore.projects.length }}</span>
      </div>

      <form @submit.prevent="addProject" class="add-form">
        <div class="grid grid-cols-2 gap-2">
          <input v-model="newProjectName" placeholder="Nom du projet" required />
          <input v-model="newProjectDesc" placeholder="Description (optionnel)" />
        </div>
        <button type="submit" class="full-width">Ajouter le projet</button>
      </form>

      <ul class="clean-list">
        <li v-for="project in projectStore.projects" :key="project.id" :class="{ inactive: !project.active }">
          <div class="item-info">
            <span class="item-name">{{ project.name }}</span>
            <span v-if="project.description" class="item-desc text-muted text-sm">{{ project.description }}</span>
          </div>
          
          <button 
            @click="projectStore.toggleProject(project)" 
            :class="project.active ? 'secondary' : 'primary'"
            class="sm-btn"
          >
            {{ project.active ? 'Désactiver' : 'Activer' }}
          </button>
        </li>
      </ul>
    </section>

    <!-- Section Activités -->
    <section v-if="activeTab === 'activities'" class="card">
      <div class="section-header">
        <h3>Gestion des Activités</h3>
        <span class="badge">{{ activityStore.activities.length }}</span>
      </div>

      <form @submit.prevent="addActivity" class="add-form">
        <div class="color-input-group">
          <input type="color" v-model="newActivityColor" class="color-picker" />
          <input v-model="newActivityName" placeholder="Nom de l'activité" required class="flex-grow" />
        </div>
        <button type="submit" class="full-width">Ajouter l'activité</button>
      </form>

      <ul class="clean-list">
        <li v-for="activity in activityStore.activities" :key="activity.id" :class="{ inactive: !activity.active }">
          <div class="item-info row">
            <span class="color-dot" :style="{ backgroundColor: activity.color }"></span>
            <span class="item-name">{{ activity.name }}</span>
          </div>
          
          <button 
            @click="activityStore.toggleActivity(activity)"
            :class="activity.active ? 'secondary' : 'primary'"
            class="sm-btn"
          >
            {{ activity.active ? 'Désactiver' : 'Activer' }}
          </button>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.page-header { margin-bottom: 2rem; }

.tabs {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.tab-btn {
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--text-secondary);
  padding: 0.5rem 1rem;
  font-weight: 500;
  border-radius: 0;
}

.tab-btn:hover { color: var(--text-primary); }

.tab-btn.active {
  color: var(--primary-color);
  border-bottom-color: var(--primary-color);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.badge {
  background-color: var(--secondary-color);
  padding: 0.125rem 0.5rem;
  border-radius: 99px;
  font-size: 0.875rem;
  font-weight: 600;
}

.add-form {
  background-color: var(--bg-color);
  padding: 1rem;
  border-radius: var(--radius);
  margin-bottom: 1.5rem;
}

.grid-cols-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; }
.full-width { width: 100%; margin-top: 0.5rem; }
.flex-grow { flex-grow: 1; margin-bottom: 0; }

.color-input-group {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.color-picker {
  width: 40px;
  padding: 0;
  height: 38px;
  cursor: pointer;
}

.clean-list {
  list-style: none;
  padding: 0;
}

.clean-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--border-color);
}
.clean-list li:last-child { border-bottom: none; }

.item-info { display: flex; flex-direction: column; }
.item-info.row { flex-direction: row; align-items: center; gap: 0.75rem; }

.item-name { font-weight: 500; }
.inactive { opacity: 0.5; }

.color-dot {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.sm-btn {
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
}
</style>
