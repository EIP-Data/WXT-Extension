<template>
  <div
      v-if="isVisible"
      class="fixed z-[99999] font-sans text-gray-800 dark:text-gray-200 animate-slide-in"
      :style="{
      left: `${position.x}px`,
      top: `${position.y}px`,
      cursor: isDragging ? 'grabbing' : 'default'
    }"
  >
    <!-- Main Card Container -->
    <div
        class="bg-gradient-to-br from-white/95 to-gray-50/95 dark:from-gray-800/95 dark:to-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl w-[450px] max-h-[85vh] flex flex-col overflow-hidden border border-gray-200/50 dark:border-gray-700/50 transition-all duration-300"
        :class="{ 'scale-[1.02] shadow-3xl': isDragging }"
    >

      <!-- Header (Draggable Area) -->
      <div
          @mousedown="startDrag"
          class="flex justify-between items-center px-4 py-3 bg-white/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700 cursor-grab active:cursor-grabbing group relative"
          :class="{ 'cursor-grabbing': isDragging }"
      >
        <!-- Animated drag indicator -->
        <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <div class="flex gap-1">
            <div class="w-1 h-4 bg-orange-400 dark:bg-orange-500 rounded-full animate-drag-pulse" style="animation-delay: 0ms;"></div>
            <div class="w-1 h-4 bg-orange-400 dark:bg-orange-500 rounded-full animate-drag-pulse" style="animation-delay: 150ms;"></div>
            <div class="w-1 h-4 bg-orange-400 dark:bg-orange-500 rounded-full animate-drag-pulse" style="animation-delay: 300ms;"></div>
          </div>
        </div>

        <!-- Logo and Brand (Clickable) -->
        <a
            @click.stop="openDatalyzWebsite"
            class="flex items-center gap-2 pointer-events-auto cursor-pointer hover:opacity-80 transition-opacity duration-200"
        >
          <img
              src="@/assets/logo.webp"
              class="w-6 h-6 transition-all duration-300 hover:drop-shadow-[0_0_8px_rgba(251,146,60,0.6)]"
              alt="Logo"
          />
          <span class="font-bold text-lg text-orange-500 dark:text-orange-400">Datalyz</span>
        </a>

        <!-- Action Buttons -->
        <div class="flex gap-2 pointer-events-auto">
          <!-- Dark Mode Toggle -->
          <button
              @click.stop="toggleDarkMode"
              class="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all duration-200 text-gray-500 dark:text-gray-400 hover:scale-110"
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
          <button
              @click.stop="closeOverlay"
              class="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all duration-200 text-gray-500 dark:text-gray-400 hover:scale-110"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      </div>

      <!-- Scrollable Content Area with Gradient Fades -->
      <div class="flex-1 overflow-y-auto custom-scrollbar p-0 relative bg-gray-50 dark:bg-gray-900">
        <!-- Top gradient fade -->
        <div class="sticky top-0 h-4 bg-gradient-to-b from-gray-50 dark:from-gray-900 to-transparent pointer-events-none z-10"></div>

        <!-- Consent gate: shown on first install until the user decides -->
        <ConsentModal v-if="consentStore.hasConsented === null" />
        <component v-else :is="activeComponent" @navigate="navigate" />

        <!-- Bottom gradient fade -->
        <div class="sticky bottom-0 h-4 bg-gradient-to-t from-gray-50 dark:from-gray-900 to-transparent pointer-events-none z-10"></div>
      </div>

      <!-- Bottom Navigation (Only show if logged in AND consent given) -->
      <div v-if="authStore.isAuthenticated && consentStore.hasConsented === true" class="bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 flex justify-around p-2 text-xs font-medium text-gray-500 dark:text-gray-400">
        <button
            @click="navigate('Home')"
            class="flex flex-col items-center gap-1 hover:text-orange-500 dark:hover:text-orange-400 transition-all duration-200 py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 relative"
            :class="{'text-orange-500 dark:text-orange-400': currentView === 'Home'}"
        >
          <!-- Active indicator -->
          <div
              v-if="currentView === 'Home'"
              class="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-orange-500 dark:bg-orange-400 rounded-full"
          ></div>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
          </svg>
          Home
        </button>
        <button
            @click="navigate('Analytics')"
            class="flex flex-col items-center gap-1 hover:text-orange-500 dark:hover:text-orange-400 transition-all duration-200 py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 relative"
            :class="{'text-orange-500 dark:text-orange-400': currentView === 'Analytics'}"
        >
          <!-- Active indicator -->
          <div
              v-if="currentView === 'Analytics'"
              class="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-orange-500 dark:bg-orange-400 rounded-full"
          ></div>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
          </svg>
          Analytics
        </button>
        <button
            @click="navigate('Preferences')"
            class="flex flex-col items-center gap-1 hover:text-orange-500 dark:hover:text-orange-400 transition-all duration-200 py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 relative"
            :class="{'text-orange-500 dark:text-orange-400': currentView === 'Preferences'}"
        >
          <!-- Active indicator -->
          <div
              v-if="currentView === 'Preferences'"
              class="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-orange-500 dark:bg-orange-400 rounded-full"
          ></div>
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
import { useConsentStore } from '@/stores/consent';
import { useDarkMode } from '@/composables/useDarkMode';
import { useDraggable } from '@/composables/useDraggable';

// Import components directly
import Login from '@/components/Login.vue';
import Home from '@/components/Home.vue';
import Analytics from '@/components/Analytics.vue';
import Preferences from '@/components/Preferences.vue';
import ConsentModal from '@/components/ConsentModal.vue';

const authStore = useAuthStore();
const consentStore = useConsentStore();
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

function openDatalyzWebsite() {
  window.open('https://datalyz.com', '_blank', 'noopener,noreferrer');
  console.log('🌐 Opening Datalyz website');
}

// Lifecycle for Auth & Events
onMounted(async () => {
  // Consent must be loaded first — the modal gate depends on it
  await consentStore.initConsent();
  await authStore.initAuth();

  // Listen for toggle events from content script
  window.addEventListener('datalyz:toggle', toggleOverlay);
});

onUnmounted(() => {
  window.removeEventListener('datalyz:toggle', toggleOverlay);
});
</script>

<style scoped>
/* Entrance animation */
@keyframes slide-in {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.animate-slide-in {
  animation: slide-in 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

/* Drag pulse animation */
@keyframes drag-pulse {
  0%, 100% {
    transform: scaleY(1);
    opacity: 0.5;
  }
  50% {
    transform: scaleY(1.5);
    opacity: 1;
  }
}

.animate-drag-pulse {
  animation: drag-pulse 1s ease-in-out infinite;
}

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
  transition: background-color 0.2s;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: #94a3b8;
}

/* Dark mode scrollbar */
.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #4b5563;
}

.dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: #6b7280;
}

/* Smooth dragging - disable transitions during drag */
.fixed {
  transition: none;
}

/* Enhanced shadow for dragging state */
.shadow-3xl {
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35);
}
</style>
