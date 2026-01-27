<script setup lang="ts">
import type { PopularSearch } from '~/types';

defineProps<{
  searches: PopularSearch[];
  loading?: boolean;
}>();

const emit = defineEmits<{
  (e: 'select', term: string): void;
}>();
</script>

<template>
  <div class="mb-8 animate-fade-in-up">
    <h2 class="text-xl font-bold mb-4 text-white flex items-center gap-2">
      <i class="pi pi-chart-line text-green-400"></i>
      <span class="bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent">
        Popular Searches
      </span>
    </h2>

    <div v-if="loading" class="flex flex-wrap gap-3">
        <div v-for="i in 5" :key="i" class="h-10 w-24 bg-gray-800 rounded-full animate-pulse"></div>
    </div>

    <div v-else class="flex flex-wrap gap-3">
      <template v-if="searches.length > 0">
        <button
          v-for="(search, index) in searches"
          :key="index"
          @click="emit('select', search.term)"
          class="group relative overflow-hidden rounded-full bg-gray-800 px-6 py-2.5 text-sm font-medium text-gray-300 transition-all duration-300 hover:text-white hover:shadow-[0_0_20px_rgba(74,222,128,0.3)] hover:scale-105 active:scale-95 border border-gray-700 hover:border-green-500/50"
        >
          <span class="relative z-10 flex items-center gap-2">
            <span>{{ search.term }}</span>
            <span v-if="index < 3" class="flex h-2 w-2">
                  <span class="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-red-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
          </span>
          <div class="absolute inset-0 -z-10 translate-y-full bg-gradient-to-t from-green-900/20 to-transparent transition-transform duration-300 group-hover:translate-y-0"></div>
        </button>
      </template>
      <div v-else class="text-sm text-gray-500 italic">
          No popular searches available.
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in-up {
  animation: fadeInUp 0.5s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
