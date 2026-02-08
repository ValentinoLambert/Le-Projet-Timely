<script setup>
import { onMounted, ref } from 'vue';
import { useProjectStore } from '../../stores/projects';

const projectStore = useProjectStore();

const newName = ref('');
const newDescription = ref('');
const searchKeywords = ref('');

onMounted(() => {
  projectStore.fetchProjects();
});

const addProject = async () => {
  if (!newName.value) {
    alert('Le nom est obligatoire');
    return;
  }

  try {
    await projectStore.createProject(newName.value, newDescription.value);
    newName.value = '';
    newDescription.value = '';
  } catch (err) {
    alert('Erreur lors de la création du projet');
  }
};

const toggleProject = async (project) => {
  try {
    await projectStore.toggleProject(project);
    await projectStore.fetchProjects();
  } catch (err) {
    alert('Erreur lors de la modification du projet');
  }
};

const filteredProjects = () => {
  if (!searchKeywords.value) return projectStore.projects;
  
  const keywords = searchKeywords.value.toLowerCase();
  return projectStore.projects.filter(p => 
    p.name.toLowerCase().includes(keywords) || 
    (p.description && p.description.toLowerCase().includes(keywords))
  );
};
</script>

<template>
  <div>
    <h2>Mes projets</h2>
    
    <form @submit.prevent="addProject" style="margin-bottom: 20px; padding: 10px; border: 1px solid #ddd;">
      <h3>Ajouter un projet</h3>
      <div>
        <label>Nom :</label>
        <input v-model="newName" type="text" required />
      </div>
      <div>
        <label>Description :</label>
        <textarea v-model="newDescription"></textarea>
      </div>
      <button type="submit">Ajouter</button>
    </form>

    <div style="margin-bottom: 10px;">
      <label>Rechercher :</label>
      <input v-model="searchKeywords" type="text" placeholder="Mots-clés..." />
    </div>

    <div v-if="projectStore.loading">Chargement...</div>
    
    <div v-else-if="filteredProjects().length > 0">
      <ul>
        <li v-for="project in filteredProjects()" :key="project.id">
          <strong>{{ project.name }}</strong>
          <span v-if="!project.is_enabled" style="color: red;"> (Désactivé)</span>
          <p v-if="project.description">{{ project.description }}</p>
          <button @click="toggleProject(project)">
            {{ project.is_enabled ? 'Désactiver' : 'Activer' }}
          </button>
        </li>
      </ul>
    </div>

    <p v-else>Aucun projet trouvé.</p>
  </div>
</template>
