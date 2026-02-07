<script setup>
import { onMounted, ref, computed } from 'vue';
import { useObjectiveStore } from '../stores/objectives';

const objectiveStore = useObjectiveStore();
const newObjName = ref('');
const newObjContent = ref('');

// Charger les objectifs au montage du composant
onMounted(() => {
  objectiveStore.fetchObjectives();
});

// Ajout d'un objectif
const addObjective = async () => {
  if (!newObjName.value) return;
  try {
    await objectiveStore.createObjective(newObjName.value, newObjContent.value);
    // Réinitialisation du formulaire
    newObjName.value = '';
    newObjContent.value = '';
  } catch (err) {
    alert('Erreur lors de l\'ajout de l\'objectif');
  }
};

// Suppression d'un objectif avec confirmation
const deleteObj = async (id) => {
  if (confirm('Voulez-vous vraiment supprimer cet objectif ?')) {
    try {
      await objectiveStore.deleteObjective(id);
    } catch (err) {
      alert('Erreur lors de la suppression');
    }
  }
};
</script>

<template>
  <div>
    <h3>Objectifs du jour</h3>
    
    <!-- Formulaire d'ajout -->
    <form @submit.prevent="addObjective">
      <div>
        <input v-model="newObjName" placeholder="Titre de l'objectif" required />
      </div>
      <div>
        <textarea v-model="newObjContent" placeholder="Description (optionnel)"></textarea>
      </div>
      <button type="submit">Ajouter l'objectif</button>
    </form>

    <div v-if="objectiveStore.loading">Chargement...</div>
    
    <!-- Liste des objectifs -->
    <div v-if="objectiveStore.objectives.length > 0">
      <p>Progression : {{ objectiveStore.completionRate }}%</p>
      
      <ul>
        <li v-for="obj in objectiveStore.objectives" :key="obj.id">
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
          
          <p v-if="obj.content">{{ obj.content }}</p>
          
          <button @click="deleteObj(obj.id)">Supprimer</button>
        </li>
      </ul>
    </div>
    <p v-else>Aucun objectif pour aujourd'hui.</p>
  </div>
</template>
