<script setup>
import { onMounted, ref } from 'vue';
import { useProjectStore } from '../../stores/projects';
import { useToastStore } from '../../stores/toast';

const projectStore = useProjectStore();
const toastStore = useToastStore();

const newName = ref('');
const newDescription = ref('');
const searchKeywords = ref('');
const editing = ref(null);

onMounted(() => {
  projectStore.fetchProjects();
});

const addProject = async () => {
  if (!newName.value) {
    toastStore.show('Le nom est obligatoire');
    return;
  }

  try {
    await projectStore.createProject(newName.value, newDescription.value);
    newName.value = '';
    newDescription.value = '';
    toastStore.show('Projet créé avec succès');
  } catch (err) {
    toastStore.show('Erreur lors de la création du projet');
  }
};

const toggleProject = async (project) => {
  try {
    await projectStore.toggleProject(project);
    await projectStore.fetchProjects();
    toastStore.show(project.is_enabled ? 'Projet désactivé' : 'Projet activé');
  } catch (err) {
    toastStore.show('Erreur lors de la modification');
  }
};

const editProject = (project) => {
  editing.value = {
    id: project.id,
    name: project.name,
    description: project.description || ''
  };
};

const saveEdit = async () => {
  if (!editing.value || !editing.value.name) {
    toastStore.show('Le nom est obligatoire');
    return;
  }
  
  try {
    await projectStore.updateProject(
      editing.value.id,
      editing.value.name,
      editing.value.description
    );
    editing.value = null;
    await projectStore.fetchProjects();
    toastStore.show('Projet modifié avec succès');
  } catch (err) {
    toastStore.show('Erreur lors de la modification');
  }
};

const cancelEdit = () => {
  editing.value = null;
};

const filteredProjects = () => {
  if (!searchKeywords.value) return projectStore.projects;
  
  const keywords = searchKeywords.value.toLowerCase();
  const result = [];
  for (let i = 0; i < projectStore.projects.length; i++) {
    const matchName = projectStore.projects[i].name.toLowerCase().includes(keywords);
    const matchDescription = projectStore.projects[i].description && projectStore.projects[i].description.toLowerCase().includes(keywords);
    if (matchName || matchDescription) {
      result.push(projectStore.projects[i]);
    }
  }
  return result;
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
      <transition-group name="list" tag="ul">
        <li v-for="project in filteredProjects()" :key="project.id">
          
          <!-- Mode édition -->
          <div v-if="editing && editing.id === project.id" style="border: 1px solid blue; padding: 10px; margin: 5px 0;">
            <div>
              <label>Nom :</label>
              <input v-model="editing.name" type="text" required />
            </div>
            <div>
              <label>Description :</label>
              <textarea v-model="editing.description"></textarea>
            </div>
            <button @click="saveEdit">Enregistrer</button>
            <button @click="cancelEdit">Annuler</button>
          </div>
          
          <!-- Mode affichage -->
          <div v-else>
            <strong>{{ project.name }}</strong>
            <span v-if="!project.is_enabled" style="color: red;"> (Désactivé)</span>
            <p v-if="project.description">{{ project.description }}</p>
            <button @click="editProject(project)">Modifier</button>
            <button @click="toggleProject(project)">
              {{ project.is_enabled ? 'Désactiver' : 'Activer' }}
            </button>
          </div>
        </li>
      </transition-group>
    </div>

    <p v-else>Aucun projet trouvé.</p>
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
</style>
