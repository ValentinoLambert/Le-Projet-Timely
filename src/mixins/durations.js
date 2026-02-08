// Fonctions utilitaires pour la manipulation des durées

// Fonction pour ajouter un zéro devant si nécessaire
function addZero(num) {
  if (num < 10) {
    return '0' + num;
  }
  return String(num);
}

export function formatDuration(seconds) {
  if (!seconds || seconds < 0) return '0m';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  // Format pour affichage compteur: HH:MM:SS
  if (hours > 0) {
    return addZero(hours) + ':' + addZero(minutes) + ':' + addZero(secs);
  } else {
    return addZero(minutes) + ':' + addZero(secs);
  }
}

export function calculateDuration(start, end) {
  if (!start || !end) return 0;
  const startDate = new Date(start);
  const endDate = new Date(end);
  return Math.floor((endDate - startDate) / 1000);
}

export function calculateDurationFromNow(start) {
  if (!start) return 0;
  const startDate = new Date(start);
  const now = new Date();
  return Math.floor((now - startDate) / 1000);
}
