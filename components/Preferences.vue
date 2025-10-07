<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import api from "@/utils/api";
import { useRouter } from "vue-router";
import { useToast } from "vue-toast-notification";
import { onMounted, ref } from "vue";
import Dropdown from "@/components/Dropdown.vue";
import { UserPreferences } from "@/types/types";

const toast = useToast();
const preferences = ref({} as UserPreferences);
const { t, locale } = useI18n();

// Tracking state
const isTrackingEnabled = ref(true);
const analytics = ref<any[]>([]);
const isLoadingTracking = ref(false);

const localeOptions = [
  { label: 'English', value: 'en' },
  { label: 'Français', value: 'fr' }
]

const switchLanguage = async (lang: 'en' | 'fr') => {
  locale.value = lang
  await storage.setItem('local:user-lang', lang)
  localStorage.setItem('user-lang', lang)
}

const getPreference = async () => {
  try {
    const response = await api.get('/preferences');
    preferences.value = response.data.preferences;
  } catch (error) {
    toast.error(t('preference.loadError'));
  }
};

const UpdatePreference = async () => {
  try {
    await api.post('/preferences', {
      cookie: preferences.value.cookie,
      language: preferences.value.language,
      data_expiration: preferences.value.data_expiration,
    });
    toast.success(t('preference.saveSuccess'));
  } catch (error) {
    toast.error(t('preference.updateError'));
  }
};

const toggleTracking = async () => {
  isLoadingTracking.value = true;

  try {
    const response = await browser.runtime.sendMessage({
      action: 'TOGGLE_TRACKING',
      data: { enabled: !isTrackingEnabled.value }
    });

    // Add null check for response
    if (response && response.success) {
      isTrackingEnabled.value = response.enabled;
      toast.success(
          isTrackingEnabled.value
              ? t('preference.trackingEnabled')
              : t('preference.trackingDisabled')
      );
    } else {
      // Handle case where response is undefined or failed
      console.error('Invalid response from background:', response);
      toast.error(t('preference.toggleError'));
    }
  } catch (error) {
    console.error('Failed to toggle tracking:', error);
    toast.error(t('preference.toggleError'));
  } finally {
    isLoadingTracking.value = false;
  }
};

const loadAnalytics = async () => {
  try {
    const response = await browser.runtime.sendMessage({ action: 'GET_ANALYTICS' });
    if (response && response.data) {
      analytics.value = response.data;
    }
  } catch (error) {
    console.error('Failed to load analytics:', error);
  }
};

const clearAnalytics = async () => {
  try {
    const response = await browser.runtime.sendMessage({ action: 'CLEAR_ANALYTICS' });
    if (response && response.success) {
      analytics.value = [];
      toast.success(t('preference.analyticsCleared'));
    }
  } catch (error) {
    console.error('Failed to clear analytics:', error);
    toast.error(t('preference.clearAnalyticsError'));
  }
};

const formatTimestamp = (timestamp: number) => {
  return new Date(timestamp).toLocaleString(locale.value);
};

const formatEventType = (type: string) => {
  const types: Record<string, string> = {
    click: t('preference.eventClick'),
    scroll: t('preference.eventScroll'),
    session_summary: t('preference.eventSession'),
    interaction: t('preference.eventInteraction')
  };
  return types[type] || type;
};

onMounted(async () => {
  getPreference();

  // Get current tracking state
  try {
    const response = await browser.runtime.sendMessage({ action: 'GET_TRACKING_STATE' });
    isTrackingEnabled.value = response.enabled;
  } catch (error) {
    console.error('Failed to get tracking state:', error);
  }

  // Listen for real-time analytics updates
  browser.runtime.onMessage.addListener((message) => {
    if (message.action === 'ANALYTICS_UPDATE') {
      analytics.value.unshift(message.data);
      if (analytics.value.length > 100) {
        analytics.value.pop();
      }
    }
  });

  // Load existing analytics
  loadAnalytics();
});
</script>

<template>
  <div class="min-h-screen p-8 transition-colors duration-300 bg-orangePrimary/5 dark:bg-gray-900">
    <div class="max-w-2xl mx-auto space-y-6">

      <!-- User Preferences Section -->
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 overflow-hidden">
        <!-- Header with gradient border -->
        <div class="border-b-4 border-orangePrimary/10 pb-6 mb-8">
          <h1 class="text-3xl font-bold bg-gradient-to-r from-orangePrimary to-amber-600 bg-clip-text text-transparent">
            {{ t('preference.title') }}
          </h1>
        </div>

        <form @submit.prevent="UpdatePreference" class="space-y-8">
          <!-- Custom Styled Checkbox -->
          <div class="group relative">
            <label class="flex items-center space-x-4 cursor-pointer p-4 rounded-xl transition-all duration-200 hover:bg-orangePrimary/5 dark:hover:bg-gray-700/50">
              <div class="relative">
                <input
                    type="checkbox"
                    v-model="preferences.cookie"
                    class="sr-only"
                >
                <div class="w-9 h-5 rounded-full shadow-inner transition-colors duration-300"
                     :class="preferences.cookie ? 'bg-orangePrimary' : 'bg-gray-300 dark:bg-gray-600'">
                  <div class="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300"
                       :class="preferences.cookie ? 'translate-x-4' : ''"></div>
                </div>
              </div>
              <span class="text-lg font-medium text-gray-700 dark:text-gray-200">
                {{ t('preference.cookieLabel') }}
              </span>
            </label>
          </div>

          <!-- Language Selector with Custom Dropdown -->
          <div class="space-y-4">
            <label class="block text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              {{ t('preference.languageLabel') }}
            </label>
            <Dropdown
                :options="localeOptions"
                :selected="locale"
                @select="switchLanguage"
            />
          </div>

          <!-- Data Expiration with Custom Number Input -->
          <div class="space-y-4">
            <label class="block text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              {{ t('preference.expirationLabel') }}
            </label>
            <div class="relative">
              <input
                  type="number"
                  v-model="preferences.data_expiration"
                  class="w-full pl-4 pr-16 py-3 border-2 rounded-xl focus:outline-none focus:border-orangePrimary focus:ring-2 focus:ring-orangePrimary/30 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all"
              >
              <div class="absolute right-3 top-1/2 -translate-y-1/2 flex space-x-2">
                <button
                    type="button"
                    @click="preferences.data_expiration = Math.max(1, preferences.data_expiration - 1)"
                    class="w-8 h-8 flex items-center justify-center rounded-lg bg-orangePrimary/10 hover:bg-orangePrimary/20 text-orangePrimary transition-colors"
                >
                  −
                </button>
                <button
                    type="button"
                    @click="preferences.data_expiration = Math.min(365, preferences.data_expiration + 1)"
                    class="w-8 h-8 flex items-center justify-center rounded-lg bg-orangePrimary/10 hover:bg-orangePrimary/20 text-orangePrimary transition-colors"
                >
                  +
                </button>
              </div>
            </div>
            <p class="text-sm text-gray-500 dark:text-gray-400 italic">
              {{ t('preference.expirationHelp') }}
            </p>
          </div>

          <!-- Animated Save Button -->
          <button
              type="submit"
              class="w-full py-4 px-6 bg-gradient-to-r from-orangePrimary to-amber-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 active:scale-95 relative overflow-hidden"
          >
            <span class="relative z-10">{{ t('preference.saveButton') }}</span>
            <div class="absolute inset-0 bg-white/10 opacity-0 hover:opacity-20 transition-opacity"></div>
          </button>
        </form>
      </div>

      <!-- Tracking Control Section -->
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 overflow-hidden">
        <div class="border-b-4 border-orangePrimary/10 pb-6 mb-8">
          <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-100">
            {{ t('preference.trackingTitle') }}
          </h2>
        </div>

        <!-- Toggle Switch -->
        <div class="flex items-center justify-between mb-6 p-4 rounded-xl bg-orangePrimary/5 dark:bg-gray-700/50">
          <div class="flex-1">
            <p class="text-lg font-medium text-gray-700 dark:text-gray-200 mb-1">
              {{ t('preference.enableTracking') }}
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ t('preference.trackingDescription') }}
            </p>
          </div>

          <button
              @click="toggleTracking"
              :disabled="isLoadingTracking"
              class="relative inline-flex h-10 w-20 items-center rounded-full transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              :class="isTrackingEnabled
              ? 'bg-gradient-to-r from-orangePrimary to-amber-600 shadow-lg'
              : 'bg-gray-300 dark:bg-gray-600'"
          >
            <span
                class="inline-block h-8 w-8 transform rounded-full bg-white transition-transform duration-300 shadow-md"
                :class="isTrackingEnabled ? 'translate-x-11' : 'translate-x-1'"
            />
          </button>
        </div>

        <!-- Status Badge -->
        <div class="flex items-center gap-3 p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700">
          <div
              class="w-3 h-3 rounded-full"
              :class="isTrackingEnabled ? 'bg-green-500 animate-pulse' : 'bg-red-500'"
          />
          <span class="text-base font-semibold" :class="isTrackingEnabled ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
            {{ isTrackingEnabled ? t('preference.statusActive') : t('preference.statusInactive') }}
          </span>
        </div>
      </div>

      <!-- Real-Time Analytics Display -->
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 overflow-hidden">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-100">
            {{ t('preference.analyticsTitle') }}
          </h2>
          <button
              @click="clearAnalytics"
              class="px-4 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all duration-300 hover:scale-105 active:scale-95 font-medium shadow-md"
          >
            {{ t('preference.clearAnalytics') }}
          </button>
        </div>

        <!-- Analytics Counter -->
        <div class="mb-6 p-5 bg-gradient-to-r from-orangePrimary/10 to-amber-600/10 dark:from-orangePrimary/20 dark:to-amber-600/20 rounded-xl border-2 border-orangePrimary/20">
          <div class="flex items-center justify-between">
            <p class="text-sm font-medium text-gray-600 dark:text-gray-300">
              {{ t('preference.totalEvents') }}
            </p>
            <span class="text-3xl font-bold text-orangePrimary dark:text-amber-500">
              {{ analytics.length }}
            </span>
          </div>
        </div>

        <!-- Analytics List -->
        <div class="space-y-3 max-h-[500px] overflow-y-auto pr-2
                    [&::-webkit-scrollbar]:w-2
                    [&::-webkit-scrollbar-track]:rounded-full
                    [&::-webkit-scrollbar-track]:bg-gray-100
                    [&::-webkit-scrollbar-thumb]:rounded-full
                    [&::-webkit-scrollbar-thumb]:bg-orangePrimary/30
                    dark:[&::-webkit-scrollbar-track]:bg-gray-700
                    dark:[&::-webkit-scrollbar-thumb]:bg-orangePrimary/50">

          <div
              v-for="(event, index) in analytics.slice(0, 50)"
              :key="index"
              class="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl border-2 border-gray-200 dark:border-gray-600 hover:border-orangePrimary dark:hover:border-orangePrimary-dark transition-all duration-200 hover:shadow-md"
          >
            <div class="flex items-center justify-between mb-2">
              <span class="px-3 py-1 text-xs font-bold text-white bg-gradient-to-r from-orangePrimary to-amber-600 rounded-full uppercase tracking-wide">
                {{ formatEventType(event.type) }}
              </span>
              <span class="text-xs text-gray-500 dark:text-gray-400 font-medium">
                {{ formatTimestamp(event.timestamp) }}
              </span>
            </div>

            <p class="text-sm text-gray-700 dark:text-gray-300 truncate mb-1">
              <span class="font-semibold">{{ t('preference.urlLabel') }}:</span> {{ event.url || event.tabUrl || 'N/A' }}
            </p>

            <div v-if="event.scrollDepth" class="flex items-center gap-2 mt-2">
              <span class="text-xs text-gray-600 dark:text-gray-400">{{ t('preference.scrollDepth') }}:</span>
              <div class="flex-1 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                <div
                    class="h-full bg-gradient-to-r from-orangePrimary to-amber-600 transition-all duration-300"
                    :style="{ width: `${event.scrollDepth}%` }"
                ></div>
              </div>
              <span class="text-xs font-bold text-orangePrimary">{{ event.scrollDepth }}%</span>
            </div>

            <div v-if="event.element" class="text-xs text-gray-600 dark:text-gray-400 mt-2">
              <span class="font-semibold">{{ t('preference.elementLabel') }}:</span>
              <code> class="px-2 py-1 bg-gray-20000 dark:bg-gray-600 rounded">{{ event.element }}</code>
            </div>
          </div>

          <div v-if="analytics.length === 0" class="text-center py-12">
            <svg class="w-20 h-20 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
            </svg>
            <p class="text-gray-500 dark:text-gray-400 font-medium">{{ t('preference.noAnalytics') }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
