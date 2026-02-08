<script setup>
import { onMounted, ref } from 'vue';
import { useActivityStore } from '../../stores/activities';
import { useToastStore } from '../../stores/toast';

const activityStore = useActivityStore();
const toastStore = useToastStore();

const newName = ref('');
const newColor = ref('#3498db');
const searchKeywords = ref('');
const editing = ref(null);

onMounted(() => {
  activityStore.fetchActivities();
});

const addActivity = async () => {
  if (!newName.value) {
    toastStore.show('Le nom est obligatoire');
    return;
  }

  try {
    await activityStore.createActivity(newName.value, newColor.value);
    newName.value = '';
    newColor.value = '#3498db';
    toastStore.show('Activité créée avec succès');
  } catch (err) {
    toastStore.show('Erreur lors de la création de l\'activité');
  }
};

const toggleActivity = async (activity) => {
  try {
    await activityStore.toggleActivity(activity);
    await activityStore.fetchActivities();
    toastStore.show(activity.is_enabled ? 'Activité désactivée' : 'Activité activée');
  } catch (err) {
    toastStore.show('Erreur lors de la modification');
  }
};

const editActivity = (activity) => {
  editing.value = {
    id: activity.id,
    name: activity.name,
    color: activity.color || '#3498db'
  };
};

const saveEdit = async () => {
  if (!editing.value || !editing.value.name) {
    toastStore.show('Le nom est obligatoire');
    return;
  }
  
  try {
    await activityStore.updateActivity(
      editing.value.id,
      editing.value.name,
      editing.value.color
    );
    editing.value = null;
    await activityStore.fetchActivities();
    toastStore.show('Activité modifiée avec succès');
  } catch (err) {
    toastStore.show('Erreur lors de la modification');
  }
};

const cancelEdit = () => {
  editing.value = null;
};

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
            <button @click="saveEdit">Enregistrer</button>
            <button @click="cancelEdit">Annuler</button>
          </div>
          
          <!-- Mode affichage -->
          <div v-else>
            <span :style="{ display: 'inline-block', width: '20px', height: '20px', backgroundColor: activity.color, marginRight: '10px' }"></span>
            <strong>{{ activity.name }}</strong>
            <span v-if="!activity.is_enabled" style="color: red;"> (Désactivé)</span>
            <br />
            <button @click="editActivity(activity)">Modifier</button>
            <button @click="toggleActivity(activity)">
              {{ activity.is_enabled ? 'Désactiver' : 'Activer' }}
            </button>
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
</style>
