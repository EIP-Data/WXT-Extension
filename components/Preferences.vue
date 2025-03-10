<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import api from "@/utils/api";
import {useRouter} from "vue-router";
import {useToast} from "vue-toast-notification";
import {onMounted, ref} from "vue";
import Dropdown from "@/components/Dropdown.vue";
import {UserPreferences} from "@/types/types";

const toast = useToast();
const preferences = ref({} as UserPreferences);
const { t, locale } = useI18n();

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

onMounted(() => {
  getPreference();
});
</script>

<template>
  <div class="min-h-screen p-8 transition-colors duration-300 bg-orangePrimary/5 dark:bg-gray-900">
    <div class="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 overflow-hidden">
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
  </div>
</template>

