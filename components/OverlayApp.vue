<template>
  <div
      v-if="isVisible"
      class="fixed z-[99999] font-sans text-gray-800 dark:text-gray-200"
      :style="{
      left: `${position.x}px`,
      top: `${position.y}px`,
      cursor: isDragging ? 'grabbing' : 'default'
    }"
  >
    <!-- Main Card Container -->
    <div class="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-2xl shadow-2xl w-[360px] max-h-[85vh] flex flex-col overflow-hidden border border-gray-100 dark:border-gray-700 transition-all duration-300">

      <!-- Header (Draggable Area) -->
      <div
          @mousedown="startDrag"
          class="flex justify-between items-center px-4 py-3 bg-white/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700 cursor-grab active:cursor-grabbing"
          :class="{ 'cursor-grabbing': isDragging }"
      >
        <div class="flex items-center gap-2 pointer-events-none">
          <img src="@/assets/logo.webp" class="w-6 h-6" alt="Logo" />
          <span class="font-bold text-lg text-orange-500 dark:text-orange-400">Datalyz</span>
          <span class="text-xs text-gray-400 dark:text-gray-500 ml-1">{{ isDragging ? '✋ Dragging...' : '👆 Drag me' }}</span>
        </div>
        <div class="flex gap-2 pointer-events-auto">
          <!-- Dark Mode Toggle -->
          <button
              @click.stop="toggleDarkMode"
              class="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-500 dark:text-gray-400"
              :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
          >
            <!-- Sun Icon (Light Mode) -->
            <svg v-if="isDark" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
            </svg>
            <!-- Moon Icon (Dark Mode) -->
            <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
            </svg>
          </button>

          <!-- Close Button -->
          <button @click.stop="closeOverlay" class="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-500 dark:text-gray-400">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      </div>

      <!-- Scrollable Content Area -->
      <div class="flex-1 overflow-y-auto custom-scrollbar p-0 relative bg-gray-50 dark:bg-gray-900">
        <component :is="activeComponent" @navigate="navigate" />
      </div>

      <!-- Bottom Navigation (Only show if logged in) -->
      <div v-if="authStore.isAuthenticated" class="bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 flex justify-around p-2 text-xs font-medium text-gray-500 dark:text-gray-400">
        <button @click="navigate('Home')" class="flex flex-col items-center gap-1 hover:text-orange-500 dark:hover:text-orange-400 transition-colors" :class="{'text-orange-500 dark:text-orange-400': currentView === 'Home'}">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
          </svg>
          Home
        </button>
        <button @click="navigate('Analytics')" class="flex flex-col items-center gap-1 hover:text-orange-500 dark:hover:text-orange-400 transition-colors" :class="{'text-orange-500 dark:text-orange-400': currentView === 'Analytics'}">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
          </svg>
          Analytics
        </button>
        <button @click="navigate('Preferences')" class="flex flex-col items-center gap-1 hover:text-orange-500 dark:hover:text-orange-400 transition-colors" :class="{'text-orange-500 dark:text-orange-400': currentView === 'Preferences'}">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
          </svg>
          Settings
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useDarkMode } from '@/composables/useDarkMode';
import { useDraggable } from '@/composables/useDraggable';

// Import components directly
import Login from '@/components/Login.vue';
import Home from '@/components/Home.vue';
import Analytics from '@/components/Analytics.vue';
import Preferences from '@/components/Preferences.vue';

const authStore = useAuthStore();
const { isDark, toggleDarkMode } = useDarkMode();
const { position, isDragging, startDrag } = useDraggable();

const isVisible = ref(false);
const currentView = ref('Home');

// Simple Router
const activeComponent = computed(() => {
  if (!authStore.isAuthenticated) return Login;
  switch (currentView.value) {
    case 'Home': return Home;
    case 'Analytics': return Analytics;
    case 'Preferences': return Preferences;
    default: return Home;
  }
});

function navigate(viewName: string) {
  currentView.value = viewName;
}

function closeOverlay() {
  isVisible.value = false;
}

function toggleOverlay() {
  isVisible.value = !isVisible.value;
  console.log('🎯 Overlay toggled:', isVisible.value);
}

// Lifecycle for Auth & Events
onMounted(async () => {
  await authStore.initAuth();

  // Listen for toggle events from content script
  window.addEventListener('datalyz:toggle', toggleOverlay);

  console.log('✅ OverlayApp mounted and listening for toggle events');
});

onUnmounted(() => {
  window.removeEventListener('datalyz:toggle', toggleOverlay);
});
</script>

<style scoped>
/* Scrollbar Styling for Webkit */
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 20px;
}

/* Dark mode scrollbar */
.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #4b5563;
}

.dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: #6b7280;
}

/* Smooth dragging animation */
.fixed {
  transition: none;
}
</style>
