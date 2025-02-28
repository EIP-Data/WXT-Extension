<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import Login from '@/components/Login.vue'
import Register from '@/components/Register.vue'
import { ref } from 'vue'
const { t } = useI18n()
const { locale } = useI18n()
const currentForm = ref<'login' | 'register'>('login')

const switchLanguage = (lang: 'en' | 'fr') => {
  locale.value = lang
  localStorage.setItem('user-lang', lang)
}

const switchForm = (formType: 'login' | 'register') => {
  currentForm.value = formType
}
</script>

<template>
  <div class="w-[300px] min-h-[400px] p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
    <nav class="flex justify-between items-center p-4">
      <!-- Form Switcher -->
      <div class="inline-flex space-x-1 bg-white rounded-full shadow-sm p-1">
        <button
            @click="switchForm('login')"
            class="px-4 py-2 text-sm font-medium rounded-full transition-colors"
            :class="currentForm === 'login'
            ? 'bg-blue-500 text-white shadow-inner'
            : 'text-gray-600 hover:bg-gray-100'"
        >
          {{ t('login.title') }}
        </button>
        <button
            @click="switchForm('register')"
            class="px-4 py-2 text-sm font-medium rounded-full transition-colors"
            :class="currentForm === 'register'
            ? 'bg-blue-500 text-white shadow-inner'
            : 'text-gray-600 hover:bg-gray-100'"
        >
          {{ t('register.title') }}
        </button>
      </div>

      <!-- Language Switcher -->
      <div class="inline-flex space-x-1 bg-white rounded-full shadow-sm p-1">
        <button
            @click="switchLanguage('en')"
            class="px-4 py-2 text-sm font-medium rounded-full transition-colors"
            :class="locale === 'en'
            ? 'bg-blue-500 text-white shadow-inner'
            : 'text-gray-600 hover:bg-gray-100'"
        >
          EN
        </button>
        <button
            @click="switchLanguage('fr')"
            class="px-4 py-2 text-sm font-medium rounded-full transition-colors"
            :class="locale === 'fr'
            ? 'bg-blue-500 text-white shadow-inner'
            : 'text-gray-600 hover:bg-gray-100'"
        >
          FR
        </button>
      </div>
    </nav>

    <component :is="currentForm === 'login' ? Login : Register" />
  </div>
</template>
