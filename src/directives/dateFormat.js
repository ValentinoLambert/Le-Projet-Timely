/**
 * Directive Vue personnalisée pour le formatage des dates
 * 
 * Utilisation dans les templates:
 * - v-date-format="dateString" → Format complet: DD/MM/YYYY HH:MM
 * - v-date-format:short="dateString" → Date seule: DD/MM/YYYY
 * - v-date-format:time="dateString" → Heure seule: HH:MM
 * 
 * Exemple: <span v-date-format="entry.start"></span>
 * Résultat: 11/02/2026 14:30
 */

/**
 * Ajoute un zéro devant les nombres < 10
 * Utilisé pour formater les jours, mois, heures et minutes
 * 
 * @param {number} num - Nombre à formater
 * @returns {string} Nombre formaté avec zéro initial si nécessaire
 */
function addZero(num) {
  if (num < 10) {
    return '0' + num;
  }
  return String(num);
}

/**
 * Définition de la directive date-format
 * 
 * Hooks du cycle de vie:
 * - mounted: Premier affichage de l'élément
 * - updated: Mise à jour de la valeur
 */
export const dateFormat = {
  /**
   * Hook appelé quand l'élément est monté dans le DOM
   * 
   * @param {HTMLElement} el - Élément du DOM cible
   * @param {Object} binding - Objet de binding contenant value et arg
   */
  mounted(el, binding) {
    const dateString = binding.value;
    
    // Si pas de date fournie, afficher vide
    if (!dateString) {
      el.textContent = '';
      return;
    }

    // Créer un objet Date et extraire les composants
    const date = new Date(dateString);
    const day = addZero(date.getDate());
    const month = addZero(date.getMonth() + 1);
    const year = date.getFullYear();
    const hours = addZero(date.getHours());
    const minutes = addZero(date.getMinutes());

    // Format par défaut: date et heure complètes
    let formatted = day + '/' + month + '/' + year + ' ' + hours + ':' + minutes;

    // Formats alternatifs selon l'argument
    if (binding.arg === 'short') {
      // Format court: date seule
      formatted = day + '/' + month + '/' + year;
    } else if (binding.arg === 'time') {
      // Format heure seule
      formatted = hours + ':' + minutes;
    }

    // Injecter le texte formaté dans l'élément
    el.textContent = formatted;
  },
  
  /**
   * Hook appelé quand la valeur de binding change
   * Même logique que mounted pour maintenir le formatage à jour
   * 
   * @param {HTMLElement} el - Élément du DOM cible
   * @param {Object} binding - Objet de binding contenant value et arg
   */
  updated(el, binding) {
    const dateString = binding.value;
    
    if (!dateString) {
      el.textContent = '';
      return;
    }

    const date = new Date(dateString);
    const day = addZero(date.getDate());
    const month = addZero(date.getMonth() + 1);
    const year = date.getFullYear();
    const hours = addZero(date.getHours());
    const minutes = addZero(date.getMinutes());

    let formatted = day + '/' + month + '/' + year + ' ' + hours + ':' + minutes;

    if (binding.arg === 'short') {
      formatted = day + '/' + month + '/' + year;
    } else if (binding.arg === 'time') {
      formatted = hours + ':' + minutes;
    }

    el.textContent = formatted;
  }
};
