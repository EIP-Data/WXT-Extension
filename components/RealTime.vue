<script setup>
import { ref, onMounted } from 'vue';

const interactionData = ref(null);

const formatValue = (value, key) => {
  if (key === 'timestamp' && typeof value === 'number') {
    return new Date(value).toLocaleString();
  }
  if (typeof value === 'object' && value !== null) {
    return JSON.stringify(value);
  }
  return value;
};

const fetchInteractionData = async () => {
  try {
    const response = await browser.runtime.sendMessage({ action: 'getInteractionData' });
    if (response && response.data) {
      interactionData.value = response.data;
      return;
    }
    const storedData = await browser.storage.local.get('interactionData');
    if (storedData && storedData.interactionData) {
      interactionData.value = storedData.interactionData;
    }
  } catch (error) {
    console.error('Error fetching interaction data:', error);
  }
};

const refreshData = () => {
  fetchInteractionData();
};

onMounted(() => {
  fetchInteractionData();

  const port = browser.runtime.connect({ name: 'popup' });
  port.onMessage.addListener((message) => {
    if (message.type === 'interactionDataUpdated') {
      interactionData.value = message.data;
    }
  });
});
</script>

<template>
  <div class="p-4 bg-white dark:bg-gray-700 rounded-lg shadow-md">
    <h2 class="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Interaction Data</h2>

    <div v-if="interactionData" class="space-y-3">
      <div v-for="(value, key) in interactionData" :key="key" class="border-b border-gray-200 pb-2">
        <strong class="text-orangePrimary dark:text-orangePrimary-dark font-medium block">{{ key }}:</strong>
        <span v-if="key === 'clickedElements' && Array.isArray(value)" class="text-gray-600 dark:text-gray-100">
          <div v-for="(element, index) in value" :key="index" class="ml-4">
            <strong>Element {{ index + 1 }}:</strong>
            <div v-for="(val, prop) in element" :key="prop" class="ml-4">
              <strong>{{ prop }}:</strong> {{ val }}
            </div>
          </div>
        </span>
        <span v-else-if="key === 'metadata'" class="text-gray-600 dark:text-gray-100">
          <div v-for="(metaValue, metaKey) in value" :key="metaKey" class="ml-4">
            <strong>{{ metaKey }}:</strong> {{ Array.isArray(metaValue) ? metaValue.length + ' items' : metaValue }}
          </div>
        </span>
        <span v-else class="text-gray-600 dark:text-gray-100">{{ formatValue(value, key) }}</span>
      </div>
    </div>

    <div v-else class="py-6 text-center dark:text-gray-200 text-gray-500 italic">
      No interaction data available
    </div>

    <button
        @click="refreshData"
        class="mt-6 bg-orangePrimary hover:bg-orangePrimary/80 text-white font-medium py-2 px-4 rounded-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
    >
      Refresh Data
    </button>
  </div>
</template>
