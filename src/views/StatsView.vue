<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'vue-chartjs';

import { useTimeEntryStore } from '../stores/timeEntries';
import { useProjectStore } from '../stores/projects';
import { useActivityStore } from '../stores/activities';

/**
 * Vue des statistiques et rapports
 * 
 * Fonctionnalités principales:
 * - Filtrage par période (date de début et de fin)
 * - Filtrage par projet
 * - Graphique en barres du temps par projet (Chart.js)
 * - Graphique en donut du temps par activité (Chart.js)
 * - Liste détaillée des entrées avec pagination
 * - Calcul du temps total de la période
 * 
 * La pagination est côté client avec 10 entrées par page
 */

// Enregistrement des composants Chart.js nécessaires
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const timeEntryStore = useTimeEntryStore();
const projectStore = useProjectStore();
const activityStore = useActivityStore();

// Filtres de recherche
const startDate = ref('');
const endDate = ref('');
const selectedProjectId = ref('');

// Pagination client-side
const currentPage = ref(1);
const rowsPerPage = ref(10);

/**
 * Initialisation au chargement du composant
 * Configure les dates par défaut (du début du mois à aujourd'hui)
 * Charge les données initiales
 */
onMounted(() => {
  // Par défaut : du début du mois à aujourd'hui
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  
  startDate.value = firstDay.toISOString().split('T')[0];
  endDate.value = now.toISOString().split('T')[0];

  // Charger les projets, activités et données
  Promise.all([
    projectStore.fetchProjects(),
    activityStore.fetchActivities(),
    fetchData()
  ]);
});


const fetchData = async () => {
  const filters = {
    from: startDate.value,
    to: endDate.value
  };
  
  if (selectedProjectId.value) {
    filters.project_id = selectedProjectId.value;
  }
  
  await timeEntryStore.fetchTimeEntries(filters);
};

// Rechargement des données au changement de filtre
watch([startDate, endDate, selectedProjectId], () => {
    fetchData();
    currentPage.value = 1; // Retour page 1
});

// Helpers d'affichage
const getProjectName = (id) => projectStore.projects.find(p => p.id === id)?.name || 'Inconnu';
const getActivityName = (id) => activityStore.activities.find(a => a.id === id)?.name || 'Inconnu';
const getActivityColor = (id) => activityStore.activities.find(a => a.id === id)?.color || '#ccc';

// --- Configuration des Graphiques ---

const chartDataProject = computed(() => {
    const data = {};
    
    timeEntryStore.timeEntries.forEach(entry => {
        if (!entry.end) return; // Ignorer les activités en cours
        
        const duration = (new Date(entry.end) - new Date(entry.start)) / 1000 / 3600; // en heures
        const name = getProjectName(entry.project_id);
        
        data[name] = (data[name] || 0) + duration;
    });

    return {
        labels: Object.keys(data),
        datasets: [{
            label: 'Heures par Projet',
            backgroundColor: '#6366f1',
            data: Object.values(data)
        }]
    };
});

const chartDataActivity = computed(() => {
    const data = {};
    const colors = [];
    
    timeEntryStore.timeEntries.forEach(entry => {
        if (!entry.end) return;
        
        const duration = (new Date(entry.end) - new Date(entry.start)) / 1000 / 3600;
        const name = getActivityName(entry.activity_id);
        const color = getActivityColor(entry.activity_id);
        
        if (!data[name]) {
            data[name] = 0;
            colors.push(color);
        }
        data[name] += duration;
    });

    return {
        labels: Object.keys(data),
        datasets: [{
            label: 'Heures par Activité',
            backgroundColor: colors,
            data: Object.values(data)
        }]
    };
});

const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { position: 'bottom', labels: { color: '#94a3b8' } },
        title: { display: false }
    },
    scales: {
        y: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } },
        x: { ticks: { color: '#94a3b8' }, grid: { display: false } }
    }
};

const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { position: 'right', labels: { color: '#94a3b8' } }
    }
};

// --- KPIs & Liste ---

const totalDuration = computed(() => {
    let seconds = 0;
    timeEntryStore.timeEntries.forEach(entry => {
        if (entry.end) {
            seconds += (new Date(entry.end) - new Date(entry.start)) / 1000;
        }
    });
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
});

const projectCount = computed(() => {
   const uniqueProjects = new Set(timeEntryStore.timeEntries.map(e => e.project_id));
   return uniqueProjects.size;
});

// Liste triée et paginée (Bonus)
const sortedEntries = computed(() => {
    return [...timeEntryStore.timeEntries]
        .filter(e => e.end)
        .sort((a, b) => new Date(b.start) - new Date(a.start));
});

const paginatedEntries = computed(() => {
    const start = (currentPage.value - 1) * rowsPerPage.value;
    const end = start + rowsPerPage.value;
    return sortedEntries.value.slice(start, end);
});

const totalPages = computed(() => Math.ceil(sortedEntries.value.length / rowsPerPage.value));

const prevPage = () => { if (currentPage.value > 1) currentPage.value--; };
const nextPage = () => { if (currentPage.value < totalPages.value) currentPage.value++; };

const formatDateTime = (iso) => {
    return new Date(iso).toLocaleString('fr-FR', { 
        day: '2-digit', month: '2-digit', year: 'numeric', 
        hour: '2-digit', minute: '2-digit' 
    });
};

const formatDuration = (entry) => {
    const s = (new Date(entry.end) - new Date(entry.start)) / 1000;
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return `${h}h ${m}m`;
};
</script>

<template>
  <div class="stats-container">
    <div class="header-section">
      <h2>Statistiques & Rapports</h2>
      
      <div class="filters-bar">
        <div class="filter-group">
            <label>Du</label>
            <input type="date" v-model="startDate" />
        </div>
        <div class="filter-group">
            <label>Au</label>
            <input type="date" v-model="endDate" />
        </div>
        <div class="filter-group">
            <label>Projet</label>
            <select v-model="selectedProjectId">
                <option value="">Tous les projets</option>
                <option v-for="p in projectStore.projects" :key="p.id" :value="p.id">{{ p.name }}</option>
            </select>
        </div>
      </div>
    </div>

    <!-- KPI Cards -->
    <div class="kpi-grid">
        <div class="card kpi-card">
            <div class="kpi-value">{{ totalDuration }}</div>
            <div class="kpi-label">Temps Total</div>
        </div>
        <div class="card kpi-card">
            <div class="kpi-value">{{ projectCount }}</div>
            <div class="kpi-label">Projets Concernés</div>
        </div>
        <div class="card kpi-card">
            <div class="kpi-value">{{ timeEntryStore.timeEntries.length }}</div>
            <div class="kpi-label">Entrées</div>
        </div>
    </div>

    <!-- Charts -->
    <div class="charts-grid">
        <div class="card" v-if="!selectedProjectId">
            <h3>Répartition par Projet</h3>
            <div class="chart-wrapper">
                <Bar :data="chartDataProject" :options="chartOptions" />
            </div>
        </div>
        <div class="card">
            <h3>Répartition par Activité</h3>
            <div class="chart-wrapper">
                <Doughnut :data="chartDataActivity" :options="doughnutOptions" />
            </div>
        </div>
    </div>

    <!-- Detailed List -->
    <div class="card list-section">
        <h3>Détail des entrées</h3>
        <table class="data-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Projet</th>
                    <th>Activité</th>
                    <th>Durée</th>
                    <th>Note</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="entry in paginatedEntries" :key="entry.id">
                    <td>{{ formatDateTime(entry.start) }}</td>
                    <td>{{ getProjectName(entry.project_id) }}</td>
                    <td>
                        <span class="badge" :style="{ backgroundColor: getActivityColor(entry.activity_id) }"></span>
                        {{ getActivityName(entry.activity_id) }}
                    </td>
                    <td>{{ formatDuration(entry) }}</td>
                    <td class="text-muted text-sm">{{ entry.comment }}</td>
                </tr>
                <tr v-if="paginatedEntries.length === 0">
                    <td colspan="5" class="text-center text-muted">Aucune donnée sur cette période.</td>
                </tr>
            </tbody>
        </table>
        
        <!-- Pagination Controls -->
        <div class="pagination-controls" v-if="totalPages > 1">
            <button @click="prevPage" :disabled="currentPage === 1">Précédent</button>
            <span>Page {{ currentPage }} / {{ totalPages }}</span>
            <button @click="nextPage" :disabled="currentPage === totalPages">Suivant</button>
        </div>
    </div>
  </div>
</template>

<style scoped>
.stats-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 1rem;
}

.header-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    flex-wrap: wrap;
    gap: 1rem;
}

.filters-bar {
    display: flex;
    gap: 1rem;
    align-items: center;
}

.filter-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.kpi-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
}

.kpi-card {
    text-align: center;
    padding: 1.5rem;
    background: linear-gradient(145deg, var(--surface-color), rgba(255, 255, 255, 0.02));
}

.kpi-value {
    font-size: 2.5rem;
    font-weight: 700;
    color: var(--primary-color);
    margin-bottom: 0.5rem;
}

.kpi-label {
    color: var(--text-secondary);
    font-size: 0.875rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.charts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
}

.chart-wrapper {
    height: 300px;
    position: relative;
}

.data-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 1rem;
}

.data-table th {
    text-align: left;
    padding: 1rem;
    border-bottom: 2px solid var(--border-color);
    color: var(--text-secondary);
}

.data-table td {
    padding: 1rem;
    border-bottom: 1px solid var(--border-color);
}

.badge {
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 50%; /* Changed to circular based on generic badge */
    margin-right: 0.5rem;
}

.pagination-controls {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1rem;
    margin-top: 1.5rem;
}

.text-center { text-align: center; }

@media (max-width: 768px) {
    .header-section { flex-direction: column; align-items: flex-start; }
    .filters-bar { flex-wrap: wrap; }
    .charts-grid { grid-template-columns: 1fr; }
}
</style>
