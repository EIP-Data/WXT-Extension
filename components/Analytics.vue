<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToast } from 'vue-toast-notification';
import { ChartBarIcon, GlobeAltIcon, ClockIcon } from '@heroicons/vue/24/outline';

const { t } = useI18n();
const toast = useToast();

const adsData = ref<any[]>([]);
const stats = ref<any>({});
const isLoading = ref(true);
const isTrackingEnabled = ref(true);

const topNetworks = computed(() => {
  if (!stats.value.byNetwork) return [];
  return Object.entries(stats.value.byNetwork)
      .sort((a: any, b: any) => b[1] - a[1])
      .slice(0, 10)
      .map(([network, count]) => ({ network, count }));
});

const topAdTypes = computed(() => {
  if (!stats.value.byType) return [];
  return Object.entries(stats.value.byType)
      .sort((a: any, b: any) => b[1] - a[1])
      .slice(0, 10)
      .map(([type, count]) => ({ type, count }));
});

const topPublishers = computed(() => {
  if (!stats.value.byPublisher) return [];
  return Object.entries(stats.value.byPublisher)
      .sort((a: any, b: any) => b[1] - a[1])
      .slice(0, 10)
      .map(([publisher, count]) => ({ publisher, count }));
});

onMounted(async () => {
  // Check tracking state
  const stateResponse = await browser.runtime.sendMessage({ action: 'GET_TRACKING_STATE' });
  isTrackingEnabled.value = stateResponse.enabled;

  // Load ads data
  await loadAdsData();

  // Listen for real-time ad detections
  browser.runtime.onMessage.addListener((message) => {
    if (message.action === 'AD_DETECTED') {
      adsData.value.unshift(message.data);
      if (adsData.value.length > 100) {
        adsData.value.pop();
      }
      // Recalculate stats
      loadAdsData();
    }
  });
});

const loadAdsData = async () => {
  isLoading.value = true;
  try {
    const response = await browser.runtime.sendMessage({ action: 'GET_ADS_ANALYTICS' });
    if (response && response.data) {
      adsData.value = response.data;
      stats.value = response.stats || {};
    }
  } catch (error) {
    console.error('Failed to load ads analytics:', error);
    toast.error(t('analytics.loadError'));
  } finally {
    isLoading.value = false;
  }
};

const clearAdsData = async () => {
  try {
    await browser.runtime.sendMessage({ action: 'CLEAR_ADS_ANALYTICS' });
    adsData.value = [];
    stats.value = {};
    toast.success(t('analytics.cleared'));
  } catch (error) {
    toast.error(t('analytics.clearError'));
  }
};

const formatTimestamp = (timestamp: number) => {
  return new Date(timestamp).toLocaleString();
};

const getNetworkColor = (index: number) => {
  const colors = [
    'from-orange-500 to-red-500',
    'from-blue-500 to-cyan-500',
    'from-green-500 to-emerald-500',
    'from-purple-500 to-pink-500',
    'from-yellow-500 to-amber-500'
  ];
  return colors[index % colors.length];
};
</script>

<template>
  <div class="min-h-screen p-6 bg-orangePrimary/5 dark:bg-gray-900">
    <div class="max-w-6xl mx-auto space-y-6">

      <!-- Header -->
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold bg-gradient-to-r from-orangePrimary to-amber-600 bg-clip-text text-transparent">
              {{ t('analytics.title') }}
            </h1>
            <p class="text-gray-600 dark:text-gray-400 mt-2">
              {{ t('analytics.subtitle') }}
            </p>
          </div>
          <button
              @click="clearAdsData"
              class="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all font-medium shadow-md"
          >
            {{ t('analytics.clearAll') }}
          </button>
        </div>
      </div>

      <!-- Stats Overview -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-gradient-to-br from-orangePrimary to-amber-600 rounded-2xl shadow-xl p-6 text-white">
          <div class="flex items-center gap-4">
            <ChartBarIcon class="w-12 h-12 opacity-80" />
            <div>
              <p class="text-sm opacity-90">{{ t('analytics.totalAds') }}</p>
              <p class="text-4xl font-bold">{{ stats.totalAds || 0 }}</p>
            </div>
          </div>
        </div>

        <div class="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl shadow-xl p-6 text-white">
          <div class="flex items-center gap-4">
            <GlobeAltIcon class="w-12 h-12 opacity-80" />
            <div>
              <p class="text-sm opacity-90">{{ t('analytics.networks') }}</p>
              <p class="text-4xl font-bold">{{ Object.keys(stats.byNetwork || {}).length }}</p>
            </div>
          </div>
        </div>

        <div class="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-xl p-6 text-white">
          <div class="flex items-center gap-4">
            <ClockIcon class="w-12 h-12 opacity-80" />
            <div>
              <p class="text-sm opacity-90">{{ t('analytics.adTypes') }}</p>
              <p class="text-4xl font-bold">{{ Object.keys(stats.byType || {}).length }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Top Ad Networks -->
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
        <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">
          {{ t('analytics.topNetworks') }}
        </h2>
        <div class="space-y-4">
          <div
              v-for="(item, index) in topNetworks"
              :key="item.network"
              class="flex items-center gap-4"
          >
            <div class="flex-1">
              <div class="flex items-center justify-between mb-2">
                <span class="font-semibold text-gray-700 dark:text-gray-300">{{ item.network }}</span>
                <span class="text-sm text-gray-500 dark:text-gray-400">{{ item.count }} {{ t('analytics.ads') }}</span>
              </div>
              <div class="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                    class="h-full bg-gradient-to-r transition-all duration-500"
                    :class="getNetworkColor(index)"
                    :style="{ width: `${(item.count / stats.totalAds) * 100}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Ad Types Distribution -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
          <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
            {{ t('analytics.byType') }}
          </h2>
          <div class="space-y-3">
            <div v-for="item in topAdTypes" :key="item.type" class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span class="font-medium text-gray-700 dark:text-gray-300">{{ item.type }}</span>
              <span class="px-3 py-1 bg-orangePrimary text-white rounded-full text-sm font-bold">{{ item.count }}</span>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
          <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
            {{ t('analytics.byPublisher') }}
          </h2>
          <div class="space-y-3 max-h-96 overflow-y-auto">
            <div v-for="item in topPublishers" :key="item.publisher" class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span class="font-medium text-gray-700 dark:text-gray-300 truncate">{{ item.publisher }}</span>
              <span class="px-3 py-1 bg-blue-500 text-white rounded-full text-sm font-bold">{{ item.count }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Ads -->
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
        <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
          {{ t('analytics.recentAds') }}
        </h2>
        <div class="space-y-3 max-h-96 overflow-y-auto">
          <div
              v-for="(ad, index) in adsData.slice(0, 20)"
              :key="index"
              class="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl border-2 border-gray-200 dark:border-gray-600 hover:border-orangePrimary transition-all"
          >
            <div class="flex items-start justify-between mb-2">
              <div class="flex-1">
                <span class="px-3 py-1 text-xs font-bold text-white bg-gradient-to-r from-orangePrimary to-amber-600 rounded-full">
                  {{ ad.network }}
                </span>
                <span class="ml-2 px-3 py-1 text-xs font-semibold text-orangePrimary bg-orangePrimary/10 rounded-full">
                  {{ ad.adType }}
                </span>
              </div>
              <span class="text-xs text-gray-500 dark:text-gray-400">
                {{ formatTimestamp(ad.timestamp) }}
              </span>
            </div>
            <p class="text-sm text-gray-700 dark:text-gray-300 truncate">
              <span class="font-semibold">{{ t('analytics.publisher') }}:</span> {{ ad.publisher }}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
              {{ ad.domain }}
            </p>
          </div>

          <div v-if="adsData.length === 0" class="text-center py-12">
            <p class="text-gray-500 dark:text-gray-400">{{ t('analytics.noData') }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
