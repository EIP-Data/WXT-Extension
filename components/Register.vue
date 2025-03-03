<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ref, computed } from 'vue'
import api from "@/utils/api";

const { t } = useI18n()

const username = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const agreeToTerms = ref(false)
const errorMessage = ref('')

const handleSubmit = async () => {
  try {
    if (password.value !== confirmPassword.value) {
      errorMessage.value = t('register.passwordMismatch')
      return
    }

    if (!agreeToTerms.value) {
      errorMessage.value = t('register.termsRequired')
      return
    }

    const response = await api.post('/register', {
      username: username.value,
      email: email.value,
      password: password.value
    });

    localStorage.setItem('authToken', response.data.jwt);
    errorMessage.value = '';
  } catch (err) {
    errorMessage.value = t('register.error')
    console.error(err)
  }
}

const passwordStrength = computed(() => {
  if (password.value.length === 0) return 0
  if (password.value.length < 8) return 1
  if (/[A-Z]/.test(password.value) && /[0-9]/.test(password.value)) return 3
  return 2
})
</script>

<template>
  <div class="flex items-center justify-center min-h-[calc(100vh-96px)] p-4">
    <div class="w-full max-w-md space-y-8">
      <div class="text-center">
        <img
            src="@/assets/logo.svg"
            class="h-16 mx-auto mb-4"
            :alt="t('register.logoAlt')"
        >
        <h1 class="text-3xl font-bold text-gray-900">
          {{ t('register.title') }}
        </h1>
        <p class="mt-2 text-gray-600">
          {{ t('register.subtitle') }}
        </p>
      </div>

      <form @submit.prevent="handleSubmit" class="mt-8 space-y-6 bg-white p-8 rounded-2xl shadow-xl">
        <div v-if="errorMessage" class="p-4 text-sm text-red-700 bg-red-100 rounded-lg">
          {{ errorMessage }}
        </div>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              {{ t('register.username') }}
            </label>
            <input
                v-model="username"
                type="text"
                required
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                :placeholder="t('register.usernamePlaceholder')"
            >
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              {{ t('register.email') }}
            </label>
            <div class="relative">
              <input
                  v-model="email"
                  type="email"
                  required
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  :placeholder="t('register.emailPlaceholder')"
              >
              <span class="absolute right-3 top-3.5 text-gray-400">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                </svg>
              </span>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              {{ t('register.password') }}
            </label>
            <div class="relative">
              <input
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  required
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  :placeholder="t('register.passwordPlaceholder')"
              >
              <button
                  type="button"
                  @click="showPassword = !showPassword"
                  class="absolute right-3 top-3.5 text-gray-400 hover:text-blue-500"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path v-if="showPassword" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  <path v-if="showPassword" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                  <path v-if="!showPassword" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M6.58 6.58L4 4m3.582 3.582L11 11m2 2l1.586 1.586M19 4l-2.586 2.586M4 19l3.582-3.582"/>
                </svg>
              </button>
            </div>
            <div class="mt-2 flex gap-1">
              <div
                  v-for="n in 3"
                  :key="n"
                  class="h-1 flex-1 rounded-full transition-colors"
                  :class="passwordStrength >= n ? 'bg-blue-500' : 'bg-gray-200'"
              ></div>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              {{ t('register.confirmPassword') }}
            </label>
            <input
                v-model="confirmPassword"
                type="password"
                required
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                :placeholder="t('register.confirmPasswordPlaceholder')"
            >
          </div>

          <div class="flex items-center">
            <label class="flex items-center text-sm text-gray-600">
              <input
                  v-model="agreeToTerms"
                  type="checkbox"
                  class="w-4 h-4 text-blue-500 border-gray-300 rounded focus:ring-blue-500"
              >
              <span class="ml-2">
                {{ t('register.agreeToTerms') }}
                <a href="#" class="text-blue-600 hover:text-blue-500">
                  {{ t('register.termsOfService') }}
                </a>
              </span>
            </label>
          </div>
        </div>

        <button
            type="submit"
            class="w-full py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          {{ t('register.submit') }}
        </button>

        <p class="text-center text-sm text-gray-600">
          {{ t('register.existingAccount') }}
          <a href="#" class="text-blue-600 hover:text-blue-500">
            {{ t('register.loginInstead') }}
          </a>
        </p>
      </form>
    </div>
  </div>
</template>
