<template>
  <div class="flex flex-col h-full p-5 gap-4">

    <!-- Icon + heading + language switcher -->
    <div class="text-center">
      <!-- Language pill toggle -->
      <div class="flex justify-end mb-1">
        <div class="flex items-center gap-0.5 bg-gray-100 dark:bg-gray-700/60 rounded-lg p-0.5">
          <button
            v-for="lang in (['en', 'fr'] as const)"
            :key="lang"
            @click="switchLanguage(lang)"
            class="px-2.5 py-0.5 rounded-md text-xs font-semibold transition-all duration-150"
            :class="currentLocale === lang
              ? 'bg-white dark:bg-gray-600 text-orange-500 shadow-sm'
              : 'text-gray-400 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'"
          >{{ lang.toUpperCase() }}</button>
        </div>
      </div>

      <div class="flex justify-center mb-3">
        <div class="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
          <svg class="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02
                 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622
                 0-1.042-.133-2.052-.382-3.016z"/>
          </svg>
        </div>
      </div>
      <h2 class="text-lg font-bold text-gray-900 dark:text-gray-100">{{ t('consent.title') }}</h2>
      <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{ t('consent.subtitle') }}</p>
    </div>

    <!-- Purpose -->
    <div class="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
      <p class="font-semibold text-blue-700 dark:text-blue-400 mb-1">{{ t('consent.purposeTitle') }}</p>
      <p>
        {{ t('consent.purposeBody') }}
        <strong>{{ t('consent.purposeBodyBold') }}</strong>
        {{ t('consent.purposeBodySuffix') }}
      </p>
    </div>

    <!-- What is collected -->
    <div class="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
      <p class="font-semibold text-gray-700 dark:text-gray-300 mb-2">{{ t('consent.collectTitle') }}</p>
      <ul class="space-y-1.5">
        <li class="flex items-start gap-2">
          <span class="text-orange-500 shrink-0 mt-px">✓</span>
          <span>{{ t('consent.collectAds') }}</span>
        </li>
        <li class="flex items-start gap-2">
          <span class="text-orange-500 shrink-0 mt-px">✓</span>
          <span>{{ t('consent.collectPage') }}</span>
        </li>
        <li class="flex items-start gap-2">
          <span class="text-orange-500 shrink-0 mt-px">✓</span>
          <span>{{ t('consent.collectSession') }}</span>
        </li>
        <li class="flex items-start gap-2">
          <span class="text-red-400 shrink-0 mt-px">✗</span>
          <span>
            {{ t('consent.collectNotPrefix') }}
            <strong class="text-gray-700 dark:text-gray-300">{{ t('consent.collectNotBold') }}</strong>
            {{ t('consent.collectNotSuffix') }}
          </span>
        </li>
      </ul>
    </div>

    <!-- Privacy policy -->
    <p class="text-center text-xs text-gray-500 dark:text-gray-400">
      {{ t('consent.withdraw') }}
      <strong class="text-gray-600 dark:text-gray-300">{{ t('consent.withdrawBold') }}</strong>.
      {{ t('consent.privacyIntro') }}
      <a
        href="https://datalyz.com/privacy"
        target="_blank"
        rel="noopener noreferrer"
        class="text-orange-500 hover:underline"
      >{{ t('consent.privacyLinkText') }}</a>.
    </p>

    <!-- Action buttons (equal visual weight — GDPR requirement) -->
    <div class="flex gap-3 mt-auto">
      <button
        @click="handleDecline"
        :disabled="loading"
        class="flex-1 py-2.5 px-4 rounded-xl border border-gray-300 dark:border-gray-600
               text-gray-700 dark:text-gray-300 text-sm font-medium
               hover:bg-gray-100 dark:hover:bg-gray-700/50
               transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {{ t('consent.decline') }}
      </button>

      <button
        @click="handleAccept"
        :disabled="loading"
        class="flex-1 py-2.5 px-4 rounded-xl bg-orange-500 hover:bg-orange-600
               text-white text-sm font-medium
               transition-all duration-200 shadow-sm
               disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span v-if="loading" class="flex items-center justify-center gap-2">
          <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          {{ t('consent.saving') }}
        </span>
        <span v-else>{{ t('consent.accept') }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useConsentStore } from '@/stores/consent';
import useI18n from '@/composables/useI18n';
import i18n, { type I18nLocales } from '@/utils/i18n';
import { storage } from '#imports';

const consentStore = useConsentStore();
const { t } = useI18n();
const loading = ref(false);

// Own ref that mirrors the global locale — avoids the pre-existing TS quirk
// with vue-i18n's typed locale while keeping reactivity for the toggle buttons.
const currentLocale = ref<I18nLocales>(
  ((i18n.global.locale as unknown as { value: string }).value as I18nLocales) || 'en'
);

async function switchLanguage(lang: I18nLocales): Promise<void> {
  (i18n.global.locale as unknown as { value: string }).value = lang;
  currentLocale.value = lang;
  await storage.setItem('local:user-lang', lang);
}

async function handleAccept(): Promise<void> {
  loading.value = true;
  try {
    await consentStore.grantConsent();
  } finally {
    loading.value = false;
  }
}

async function handleDecline(): Promise<void> {
  loading.value = true;
  try {
    await consentStore.revokeConsent();
  } finally {
    loading.value = false;
  }
}
</script>

