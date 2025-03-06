<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'vue-toast-notification';
import api from '@/utils/api';
import { ShieldCheckIcon, PresentationChartBarIcon, XMarkIcon } from '@heroicons/vue/24/outline';

const router = useRouter();
const toast = useToast();
const user = ref(null);
const stats = ref({
  cookiesBlocked: 142,
  trackersStopped: 89,
  adsPrevented: 236,
});
const { t } = useI18n();

const getUserData = async () => {
  try {
    const response = await api.get('/user');
    user.value = response.data.user.username;
  } catch (error) {
    toast.error('Failed to load user data');
  }
};

onMounted(() => {
  getUserData();
});
</script>

<template>
  <div class="min-h-[400px] p-6 space-y-8 bg-gray-50 dark:bg-gray-900">
    <!-- Header Section -->
    <div class="space-y-2">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-50">
        {{ t("home.welcome") }}, <span class="text-orangePrimary dark:text-orangePrimary-dark">{{ user || t("home.user") }}</span>
      </h1>
      <p class="text-gray-600 dark:text-gray-300">
        {{ t("home.subtitle") }}
      </p>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <!-- Cookies Blocked Card -->
      <div class="bg-orangePrimary/10 dark:bg-orangePrimary-dark/20 p-6 rounded-xl transition-all duration-300 hover:scale-[1.02]">
        <div class="flex items-center gap-4">
          <div class="p-3 bg-orangePrimary/20 dark:bg-orangePrimary-dark/30 rounded-lg">
            <svg
                class="w-8 h-8 text-orangePrimary dark:text-orangePrimary-dark"
                viewBox="0 0 32 32"
            >
              <path
                  fill="currentColor"
                  d="M16 2C8.2 2 2 8.2 2 16s6.2 14 14 14s14-6.2 14-14S23.8 2 16 2zm0 26C9.4 28 4 22.6 4 16S9.4 4 16 4s12 5.4 12 12s-5.4 12-12 12zm6-18c-1.1 0-2 .9-2 2s.9 2 2 2s2-.9 2-2s-.9-2-2-2zm-12 4c-1.1 0-2 .9-2 2s.9 2 2 2s2-.9 2-2s-.9-2-2-2zm6-8c-1.1 0-2 .9-2 2s.9 2 2 2s2-.9 2-2s-.9-2-2-2zm0 12c-1.1 0-2 .9-2 2s.9 2 2 2s2-.9 2-2s-.9-2-2-2zm6 4c-1.1 0-2 .9-2 2s.9 2 2 2s2-.9 2-2s-.9-2-2-2z"
              />
            </svg>
          </div>
          <div>
            <h3 class="text-2xl font-bold text-gray-900 dark:text-white">{{ stats.cookiesBlocked }}</h3>
            <p class="text-gray-600 dark:text-gray-300 text-sm">{{ t("home.cookies_blocked") }}</p>
          </div>
        </div>
      </div>

      <!-- Trackers Stopped Card -->
      <div class="bg-orangePrimary/10 dark:bg-orangePrimary-dark/20 p-6 rounded-xl transition-all duration-300 hover:scale-[1.02]">
        <div class="flex items-center gap-4">
          <div class="p-3 bg-orangePrimary/20 dark:bg-orangePrimary-dark/30 rounded-lg">
            <ShieldCheckIcon class="w-8 h-8 text-orangePrimary dark:text-orangePrimary-dark" />
          </div>
          <div>
            <h3 class="text-2xl font-bold text-gray-900 dark:text-white">{{ stats.trackersStopped }}</h3>
            <p class="text-gray-600 dark:text-gray-300 text-sm">{{ t("home.trackers_stopped") }}</p>
          </div>
        </div>
      </div>

      <!-- Ads Prevented Card -->
      <div class="bg-orangePrimary/10 dark:bg-orangePrimary-dark/20 p-6 rounded-xl transition-all duration-300 hover:scale-[1.02]">
        <div class="flex items-center gap-4">
          <div class="p-3 bg-orangePrimary/20 dark:bg-orangePrimary-dark/30 rounded-lg">
            <XMarkIcon class="w-8 h-8 text-orangePrimary dark:text-orangePrimary-dark" />
          </div>
          <div>
            <h3 class="text-2xl font-bold text-gray-900 dark:text-white">{{ stats.adsPrevented }}</h3>
            <p class="text-gray-600 dark:text-gray-300 text-sm">{{ t("home.ads_prevented") }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Visualization Section -->
    <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
          {{ t("home.activity_today") }}
        </h2>
        <PresentationChartBarIcon class="w-6 h-6 text-orangePrimary dark:text-orangePrimary-dark" />
      </div>
      <div class="h-32 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse">
        <!-- Add your chart implementation here -->
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="grid grid-cols-2 gap-4">
      <button class="p-4 bg-orangePrimary/10 dark:bg-orangePrimary-dark/20 rounded-xl hover:bg-orangePrimary/20 transition-colors">
        <span class="text-orangePrimary dark:text-orangePrimary-dark font-medium">{{ t("home.quick_scan") }}</span>
      </button>
      <button class="p-4 bg-orangePrimary/10 dark:bg-orangePrimary-dark/20 rounded-xl hover:bg-orangePrimary/20 transition-colors">
        <span class="text-orangePrimary dark:text-orangePrimary-dark font-medium">{{ t("home.settings") }}</span>
      </button>
    </div>
  </div>
</template>
