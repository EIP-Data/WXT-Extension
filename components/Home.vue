<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'vue-toast-notification';
import api from '@/utils/api';
import { ShieldCheckIcon, PresentationChartBarIcon, XMarkIcon } from '@heroicons/vue/24/outline';
import ProfilingChart from '@/components/Charts/ProfilingChart.vue';

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
  <div class="p-6 space-y-8 bg-gray-50 dark:bg-gray-900">
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
      <!-- Cookies Card -->
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

      <!-- Trackers Card -->
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

      <!-- Ads Card -->
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
    <ProfilingChart
        chart-type="donut"
        :metrics="{
        trackers: [
          { type: 'Analytics', count: 45, percentage: 35 },
          { type: 'Ads', count: 32, percentage: 25 },
          { type: 'Social', count: 28, percentage: 22 },
          { type: 'Other', count: 15, percentage: 18 }
        ],
        ads: [],
        locations: []
      }"
        >
          <template #title>
            {{ t("home.activity_today") }}
          </template>
    </ProfilingChart>

    <ProfilingChart
        chart-type="bar"
        :metrics="{
    trackers: [
      { type: 'Analytics', count: 45 },
      { type: 'Ads', count: 32 },
      { type: 'Social', count: 28 },
      { type: 'Other', count: 15 }
    ],
    ads: [],
    locations: []
  }"
    >
      <template #title>
        {{ t("home.activity_today") }}
      </template>
      <template #icon>
        <svg class="w-5 h-5 text-orangePrimary dark:text-orangePrimary-dark"
             fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
        </svg>
      </template>
    </ProfilingChart>
  </div>
</template>
