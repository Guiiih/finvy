<script setup lang="ts">
import { computed } from 'vue';
import { useUserPresenceStore } from '@/stores/userPresenceStore';


interface UserPresence {
  user_id: string;
  username: string;
  last_seen: string;
  avatar_url?: string;
}

const props = defineProps<{
  user: UserPresence;
  currentUserId: string | undefined;
}>();

const userPresenceStore = useUserPresenceStore();

const isOnline = computed(() => {
  return userPresenceStore.onlineUsers.some(
    (onlineUser) => onlineUser.user_id === props.user.user_id
  );
});
</script>

<template>
  <div
    v-if="props.user.user_id !== props.currentUserId"
    v-tooltip.bottom="props.user.username"
    class="relative inline-block"
  >
    <img
      :src="props.user.avatar_url ?? undefined"
      :alt="`Avatar de ${props.user.username}`"
      class="w-9 rounded-full"
    />
    <span
      v-if="isOnline"
      class="absolute bottom-0 right-0 block h-2 w-2 rounded-full ring-2 ring-white bg-green-500"
      aria-label="Online"
    ></span>
  </div>
</template>

<style scoped>
/* Adicione estilos específicos se necessário */
</style>
