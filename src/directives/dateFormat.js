// Directive pour formater les dates

// Fonction pour ajouter un zéro devant si nécessaire
function addZero(num) {
  if (num < 10) {
    return '0' + num;
  }
  return String(num);
}

export const dateFormat = {
  mounted(el, binding) {
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
  },
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
