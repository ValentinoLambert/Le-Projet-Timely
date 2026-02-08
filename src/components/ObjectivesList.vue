<script setup>
import { onMounted, ref, computed } from 'vue';
import { useObjectiveStore } from '../stores/objectives';
import { useToastStore } from '../stores/toast';

const objectiveStore = useObjectiveStore();
const toastStore = useToastStore();
const newObjName = ref('');
const newObjContent = ref('');
const showPast = ref(false);
const searchKeywords = ref('');

// Charger les objectifs au montage du composant
onMounted(() => {
  objectiveStore.fetchObjectives();
});

// Ajout d'un objectif
const addObjective = async () => {
  if (!newObjName.value) {
    toastStore.show('Le titre est requis');
    return;
  }
  try {
    await objectiveStore.createObjective(newObjName.value, newObjContent.value);
    // Réinitialisation du formulaire
    newObjName.value = '';
    newObjContent.value = '';
    toastStore.show('Objectif créé');
  } catch (err) {
    toastStore.show('Erreur lors de la création de l\'objectif');
  }
};

// Suppression d'un objectif avec confirmation
const deleteObj = async (id) => {
  if (confirm('Voulez-vous vraiment supprimer cet objectif ?')) {
    try {
      await objectiveStore.deleteObjective(id);
      toastStore.show('Objectif supprimé');
    } catch (err) {
      toastStore.show('Erreur lors de la suppression');
    }
  }
};

// Filtrer les objectifs selon le cahier des charges
// Par défaut: tous les objectifs du jour (done ou pas)
// Avec toggle: inclure aussi les objectifs passés déjà réalisés
const todayObjectives = computed(() => {
  const today = new Date();
  const result = [];
  for (let i = 0; i < objectiveStore.objectives.length; i++) {
    const objDate = new Date(objectiveStore.objectives[i].date);
    if (objDate.toDateString() === today.toDateString()) {
      result.push(objectiveStore.objectives[i]);
    }
  }
  return result;
});

const pastDoneObjectives = computed(() => {
  const today = new Date();
  const result = [];
  for (let i = 0; i < objectiveStore.objectives.length; i++) {
    const objDate = new Date(objectiveStore.objectives[i].date);
    if (objectiveStore.objectives[i].done && objDate.toDateString() !== today.toDateString()) {
      result.push(objectiveStore.objectives[i]);
    }
  }
  return result;
});

const displayedObjectives = computed(() => {
  let objectives = [];
  
  if (showPast.value) {
    for (let i = 0; i < todayObjectives.value.length; i++) {
      objectives.push(todayObjectives.value[i]);
    }
    for (let i = 0; i < pastDoneObjectives.value.length; i++) {
      objectives.push(pastDoneObjectives.value[i]);
    }
  } else {
    for (let i = 0; i < todayObjectives.value.length; i++) {
      objectives.push(todayObjectives.value[i]);
    }
  }
  
  if (searchKeywords.value) {
    const keywords = searchKeywords.value.toLowerCase();
    const filtered = [];
    for (let i = 0; i < objectives.length; i++) {
      const matchName = objectives[i].name.toLowerCase().includes(keywords);
      const matchContent = objectives[i].content && objectives[i].content.toLowerCase().includes(keywords);
      if (matchName || matchContent) {
        filtered.push(objectives[i]);
      }
    }
    return filtered;
  }
  
  return objectives;
});
</script>

<template>
  <div>
    <h3>Objectifs du jour</h3>
    
    <!-- Formulaire d'ajout -->
    <form @submit.prevent="addObjective">
      <div>
        <input v-model="newObjName" placeholder="Titre de l'objectif" v-autofocus required />
      </div>
      <div>
        <textarea v-model="newObjContent" placeholder="Description en Markdown (optionnel)"></textarea>
      </div>
      <button type="submit">Ajouter l'objectif</button>
    </form>

    <div v-if="objectiveStore.loading">Chargement...</div>
    
    <!-- Recherche -->
    <div style="margin: 15px 0;">
      <input 
        v-model="searchKeywords" 
        type="text" 
        placeholder="Rechercher un objectif..." 
        style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 3px;"
      />
    </div>
    
    <!-- Filtre pour afficher/masquer les objectifs passés réalisés -->
    <label style="margin: 10px 0; display: block;">
      <input type="checkbox" v-model="showPast" />
      Intégrer les objectifs passés déjà réalisés
    </label>
    
    <!-- Liste des objectifs -->
    <div v-if="displayedObjectives.length > 0">
      <transition-group name="list" tag="ul">
        <li v-for="obj in displayedObjectives" :key="obj.id">
          <!-- Checkbox pour marquer comme fait/non fait -->
          <input 
            type="checkbox" 
            :checked="obj.done" 
            @change="objectiveStore.toggleObjective(obj)" 
          />
          
          <!-- Affichage du titre barré si fait -->
          <span :style="{ textDecoration: obj.done ? 'line-through' : 'none' }">
            <strong>{{ obj.name }}</strong>
          </span>
          
          <!-- Date si différente d'aujourd'hui -->
          <span v-if="obj.date" class="date" v-date-format:short>{{ obj.date }}</span>
          
          <!-- Contenu en markdown si présent -->
          <div v-if="obj.content" v-markdown class="content">{{ obj.content }}</div>
          
          <button @click="deleteObj(obj.id)">Supprimer</button>
        </li>
      </transition-group>
    </div>
    <p v-else>Aucun objectif à atteindre.</p>
  </div>
</template>

<style scoped>
.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}

.list-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}

.list-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

.list-move {
  transition: transform 0.5s ease;
}

.date {
  margin-left: 10px;
  font-size: 12px;
  color: #666;
}

.content {
  margin: 10px 0;
  padding: 10px;
  background-color: #f9f9f9;
  border-left: 3px solid #1976d2;
}
</style>
