<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { ChevronDownIcon } from '@heroicons/vue/24/outline'

const props = defineProps({
  options: {
    type: Array as () => Array<{ label: string; value: string }>,
    required: true
  },
  selected: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['select'])

const isOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

const toggleDropdown = () => {
  isOpen.value = !isOpen.value
}

const selectOption = (option: { label: string; value: string }) => {
  emit('select', option.value)
  isOpen.value = false
}

const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div ref="dropdownRef" class="relative w-full">
    <button
        @click="toggleDropdown"
        class="w-full flex items-center justify-between px-4 py-3 text-sm font-medium
             bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600
             rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300
             transition-colors duration-200"
        :class="{ 'ring-2 ring-blue-500': isOpen }"
    >
      <span class="flex items-center gap-2">
        <span v-if="selected === 'en'">🇺🇸</span>
        <span v-else>🇫🇷</span>
        {{ options.find(opt => opt.value === selected)?.label }}
      </span>
      <ChevronDownIcon
          class="w-5 h-5 ml-2 text-gray-400 dark:text-gray-300 transition-transform"
          :class="{ 'rotate-180': isOpen }"
      />
    </button>

    <transition
        enter-active-class="transition ease-out duration-100"
        enter-from-class="transform opacity-0 scale-95"
        enter-to-class="transform opacity-100 scale-100"
        leave-active-class="transition ease-in duration-75"
        leave-from-class="transform opacity-100 scale-100"
        leave-to-class="transform opacity-0 scale-95"
    >
      <ul
          v-show="isOpen"
          class="absolute z-10 mt-1 w-full max-h-60 overflow-auto rounded-md
              bg-white dark:bg-gray-800 text-base shadow-lg ring-1 ring-black
              ring-opacity-5 focus:outline-none sm:text-sm"
      >
        <li
            v-for="option in options"
            :key="option.value"
            @click="selectOption(option)"
            class="cursor-pointer px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700
                transition-colors duration-200"
            :class="{
            'bg-blue-50 dark:bg-gray-600': selected === option.value,
            'text-gray-900 dark:text-white': selected === option.value,
            'text-gray-700 dark:text-gray-200': selected !== option.value
          }"
        >
          <div class="flex items-center gap-2">
            <span>{{ option.value === 'en' ? '🇺🇸' : '🇫🇷' }}</span>
            {{ option.label }}
          </div>
        </li>
      </ul>
    </transition>
  </div>
</template>
