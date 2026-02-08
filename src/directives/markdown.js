import { marked } from 'marked';

// Directive pour afficher du markdown
export const markdown = {
  mounted(el, binding) {
    const text = binding.value || '';
    el.innerHTML = marked(text);
  },
  updated(el, binding) {
    const text = binding.value || '';
    el.innerHTML = marked(text);
  }
};
