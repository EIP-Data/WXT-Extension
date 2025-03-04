<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'vue-toast-notification';
import api from '@/utils/api';

const router = useRouter();
const toast = useToast();
const user = ref(null);
const { t } = useI18n();

const getUserData = async () => {
  try {
    const response = await api.get('/user');
    user.value = response.data;
  } catch (error) {
    toast.error('Failed to load user data');
  }
};

onMounted(() => {
  getUserData();
});
</script>

<template>
  <div>
    {{t("home.welcome") + " " + user}}
  </div>
</template>
