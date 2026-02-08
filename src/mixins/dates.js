// Fonctions utilitaires pour la manipulation des dates

// Fonction pour ajouter un zéro devant si nécessaire
function addZero(num) {
  if (num < 10) {
    return '0' + num;
  }
  return String(num);
}

export function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const day = addZero(date.getDate());
  const month = addZero(date.getMonth() + 1);
  const year = date.getFullYear();
  return day + '/' + month + '/' + year;
}

export function formatDateTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const day = addZero(date.getDate());
  const month = addZero(date.getMonth() + 1);
  const year = date.getFullYear();
  const hours = addZero(date.getHours());
  const minutes = addZero(date.getMinutes());
  return day + '/' + month + '/' + year + ' ' + hours + ':' + minutes;
}
