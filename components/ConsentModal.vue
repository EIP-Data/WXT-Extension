<template>
  <div class="flex flex-col h-full p-5 gap-4">

    <!-- Icon + heading -->
    <div class="text-center">
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
      <h2 class="text-lg font-bold text-gray-900 dark:text-gray-100">Research Data Consent</h2>
      <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Required under GDPR before any data is collected</p>
    </div>

    <!-- Purpose -->
    <div class="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
      <p class="font-semibold text-blue-700 dark:text-blue-400 mb-1">Purpose</p>
      <p>
        Datalyz collects data about advertisements you encounter while browsing to support
        <strong>academic research on hyperpersonalization in online advertising</strong> conducted by EIP-Data.
        Your data will only be used for this research.
      </p>
    </div>

    <!-- What is collected -->
    <div class="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
      <p class="font-semibold text-gray-700 dark:text-gray-300 mb-2">What we collect</p>
      <ul class="space-y-1.5">
        <li class="flex items-start gap-2">
          <span class="text-orange-500 shrink-0 mt-px">✓</span>
          <span>Ad network names, ad types, and tracker categories</span>
        </li>
        <li class="flex items-start gap-2">
          <span class="text-orange-500 shrink-0 mt-px">✓</span>
          <span>Page context — site category, page title, content language</span>
        </li>
        <li class="flex items-start gap-2">
          <span class="text-orange-500 shrink-0 mt-px">✓</span>
          <span>Session metadata and timestamps</span>
        </li>
        <li class="flex items-start gap-2">
          <span class="text-red-400 shrink-0 mt-px">✗</span>
          <span>
            We do <strong class="text-gray-700 dark:text-gray-300">not</strong>
            collect passwords, form data, private messages, or browsing history outside of ads.
          </span>
        </li>
      </ul>
    </div>

    <!-- Privacy policy -->
    <p class="text-center text-xs text-gray-500 dark:text-gray-400">
      You may withdraw consent at any time in
      <strong class="text-gray-600 dark:text-gray-300">Settings → Revoke Consent</strong>.
      Read our
      <a
        href="https://datalyz.com/privacy"
        target="_blank"
        rel="noopener noreferrer"
        class="text-orange-500 hover:underline"
      >Privacy Policy</a>.
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
        Decline
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
          Saving…
        </span>
        <span v-else>Accept</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useConsentStore } from '@/stores/consent';

const consentStore = useConsentStore();
const loading = ref(false);

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

