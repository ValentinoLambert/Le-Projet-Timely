<template>
  <div class="toast-container">
    <transition-group name="toast" tag="div">
      <div 
        v-for="toast in toastStore.toasts" 
        :key="toast.id" 
        :class="['toast', 'toast-' + toast.type]"
      >
        {{ toast.message }}
      </div>
    </transition-group>
  </div>
</template>

<script setup>
import { useToastStore } from '../stores/toast';

const toastStore = useToastStore();
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
}

.toast {
  padding: 10px 15px;
  margin-bottom: 10px;
  background-color: #333;
  color: white;
  border-radius: 3px;
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.3s;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
}
</style>
