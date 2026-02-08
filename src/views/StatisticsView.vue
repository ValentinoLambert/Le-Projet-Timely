<script setup>
import { ref, computed, onMounted } from 'vue';
import { useTimeEntryStore } from '../stores/timeEntries';
import { useProjectStore } from '../stores/projects';
import { useActivityStore } from '../stores/activities';
import { Bar, Pie } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement } from 'chart.js';
import { formatDuration } from '../mixins/durations';
import { formatDateTime } from '../mixins/dates';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement);

const timeEntryStore = useTimeEntryStore();
const projectStore = useProjectStore();
const activityStore = useActivityStore();

const dateFrom = ref('');
const dateTo = ref('');
const selectedProject = ref('');

onMounted(async () => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const today = now.getFullYear() + '-' + 
                (month < 10 ? '0' + month : month) + '-' + 
                (day < 10 ? '0' + day : day);
  dateFrom.value = today;
  dateTo.value = today;
  
  await Promise.all([
    timeEntryStore.fetchTimeEntries(),
    projectStore.fetchProjects(),
    activityStore.fetchActivities()
  ]);
});

const filteredEntries = computed(() => {
  const entries = [];
  
  // Filtrer les entrées
  for (let i = 0; i < timeEntryStore.timeEntries.length; i++) {
    const entry = timeEntryStore.timeEntries[i];
    
    if (!entry.end) continue;
    
    const d = new Date(entry.start);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const entryDate = d.getFullYear() + '-' + 
                      (month < 10 ? '0' + month : month) + '-' + 
                      (day < 10 ? '0' + day : day);
    
    if (dateFrom.value && entryDate < dateFrom.value) continue;
    if (dateTo.value && entryDate > dateTo.value) continue;
    if (selectedProject.value && entry.project_id !== selectedProject.value) continue;
    
    entries.push(entry);
  }
  
  // Tri chronologique ascendant (tri à bulles simple)
  for (let i = 0; i < entries.length - 1; i++) {
    for (let j = 0; j < entries.length - 1 - i; j++) {
      const dateA = new Date(entries[j].start);
      const dateB = new Date(entries[j + 1].start);
      if (dateA > dateB) {
        const temp = entries[j];
        entries[j] = entries[j + 1];
        entries[j + 1] = temp;
      }
    }
  }
  
  return entries;
});

const totalDuration = computed(() => {
  let totalSeconds = 0;
  for (let i = 0; i < filteredEntries.value.length; i++) {
    const entry = filteredEntries.value[i];
    const start = new Date(entry.start);
    const end = new Date(entry.end);
    totalSeconds = totalSeconds + Math.floor((end - start) / 1000);
  }
  return formatDuration(totalSeconds);
});

const timeByProject = computed(() => {
  const byProject = {};
  for (let i = 0; i < filteredEntries.value.length; i++) {
    const entry = filteredEntries.value[i];
    let project = null;
    for (let j = 0; j < projectStore.projects.length; j++) {
      if (projectStore.projects[j].id === entry.project_id) {
        project = projectStore.projects[j];
        break;
      }
    }
    const projectName = project ? project.name : 'Sans projet';
    if (!byProject[projectName]) byProject[projectName] = 0;
    const start = new Date(entry.start);
    const end = new Date(entry.end);
    byProject[projectName] += Math.floor((end - start) / 1000);
  }
  return byProject;
});

const timeByActivity = computed(() => {
  const byActivity = {};
  for (let i = 0; i < filteredEntries.value.length; i++) {
    const entry = filteredEntries.value[i];
    let activity = null;
    for (let j = 0; j < activityStore.activities.length; j++) {
      if (activityStore.activities[j].id === entry.activity_id) {
        activity = activityStore.activities[j];
        break;
      }
    }
    const activityName = activity ? activity.name : 'Sans activité';
    const activityColor = activity ? activity.color : '#cccccc';
    if (!byActivity[activityName]) {
      byActivity[activityName] = { seconds: 0, color: activityColor };
    }
    const start = new Date(entry.start);
    const end = new Date(entry.end);
    byActivity[activityName].seconds += Math.floor((end - start) / 1000);
  }
  return byActivity;
});

const numberOfProjects = computed(() => {
  return Object.keys(timeByProject.value).length;
});

const projectChartData = computed(() => {
  const projectTimes = Object.values(timeByProject.value);
  const hoursData = [];
  for (let i = 0; i < projectTimes.length; i++) {
    hoursData.push((projectTimes[i] / 3600).toFixed(2));
  }
  
  return {
    labels: Object.keys(timeByProject.value),
    datasets: [{
      label: 'Temps (heures)',
      data: hoursData,
      backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40']
    }]
  };
});

const activityChartData = computed(() => {
  const activityTimes = Object.values(timeByActivity.value);
  const hoursData = [];
  const colors = [];
  for (let i = 0; i < activityTimes.length; i++) {
    hoursData.push((activityTimes[i].seconds / 3600).toFixed(2));
    colors.push(activityTimes[i].color);
  }
  
  return {
    labels: Object.keys(timeByActivity.value),
    datasets: [{
      label: 'Temps (heures)',
      data: hoursData,
      backgroundColor: colors
    }]
  };
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false
};

// Méthodes helper pour afficher les noms
function getProjectName(projectId) {
  let project = null;
  for (let i = 0; i < projectStore.projects.length; i++) {
    if (projectStore.projects[i].id === projectId) {
      project = projectStore.projects[i];
      break;
    }
  }
  if (project) {
    return project.name;
  }
  return '-';
}

function getActivityName(activityId) {
  let activity = null;
  for (let i = 0; i < activityStore.activities.length; i++) {
    if (activityStore.activities[i].id === activityId) {
      activity = activityStore.activities[i];
      break;
    }
  }
  if (activity) {
    return activity.name;
  }
  return '-';
}
</script>

<template>
  <div class="statistics">
    <h1>Statistiques</h1>
    
    <div class="filters">
      <label>
        Du: <input type="date" v-model="dateFrom" required />
      </label>
      <label>
        Au: <input type="date" v-model="dateTo" required />
      </label>
      <label>
        Projet: 
        <select v-model="selectedProject">
          <option value="">Tous les projets</option>
          <option v-for="project in projectStore.projects" :key="project.id" :value="project.id">
            {{ project.name }}
          </option>
        </select>
      </label>
    </div>
    
    <div class="summary">
      <h2>Temps total: {{ totalDuration }}</h2>
      <p v-if="!selectedProject">{{ numberOfProjects }} projet(s) concerné(s)</p>
    </div>
    
    <div class="charts" v-if="filteredEntries.length > 0">
      <div class="chart" v-if="!selectedProject">
        <h3>Répartition par projet</h3>
        <Pie :data="projectChartData" :options="chartOptions" />
      </div>
      
      <div class="chart">
        <h3>Répartition par activité</h3>
        <Bar :data="activityChartData" :options="chartOptions" />
      </div>
    </div>
    
    <div class="entries-list">
      <h3>Entrées de temps ({{ filteredEntries.length }})</h3>
      <table v-if="filteredEntries.length > 0">
        <thead>
          <tr>
            <th>Date début</th>
            <th>Date fin</th>
            <th>Projet</th>
            <th>Activité</th>
            <th>Durée</th>
            <th>Commentaire</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="entry in filteredEntries" :key="entry.id">
            <td>{{ formatDateTime(entry.start) }}</td>
            <td>{{ formatDateTime(entry.end) }}</td>
            <td>{{ getProjectName(entry.project_id) }}</td>
            <td>{{ getActivityName(entry.activity_id) }}</td>
            <td>{{ formatDuration(Math.floor((new Date(entry.end) - new Date(entry.start)) / 1000)) }}</td>
            <td>{{ entry.comment || '-' }}</td>
          </tr>
        </tbody>
      </table>
      <p v-else>Aucune entrée pour cette période</p>
    </div>
  </div>
</template>

<style scoped>
.statistics {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.filters {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
  padding: 15px;
  background-color: #f5f5f5;
  border-radius: 5px;
}

.filters label {
  display: flex;
  align-items: center;
  gap: 10px;
}

.filters input,
.filters select {
  padding: 5px 10px;
  border: 1px solid #ddd;
  border-radius: 3px;
}

.summary {
  text-align: center;
  margin-bottom: 40px;
  padding: 20px;
  background-color: #e3f2fd;
  border-radius: 5px;
}

.summary h2 {
  margin: 0 0 10px 0;
  color: #1976d2;
}

.charts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  margin-bottom: 40px;
}

.charts.single {
  grid-template-columns: 1fr;
}

.chart {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  height: 400px;
}

.chart h3 {
  margin-top: 0;
  text-align: center;
}

.entries-list {
  margin-top: 40px;
}

.entries-list h3 {
  margin-bottom: 20px;
}

table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

th, td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

th {
  background-color: #f5f5f5;
  font-weight: bold;
}

tr:hover {
  background-color: #f9f9f9;
}

@media (max-width: 768px) {
  .charts {
    grid-template-columns: 1fr;
  }
  
  .filters {
    flex-direction: column;
  }
}
</style>
