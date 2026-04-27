<script setup lang="ts">
defineProps<{
  suggestions: string[];
  activeIndex: number;
}>();

const emit = defineEmits<{
  (e: 'select', term: string): void;
  (e: 'hover', index: number): void;
}>();
</script>

<template>
  <div class="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-2xl shadow-xl z-50 overflow-hidden animate-fade-in">
    <ul>
      <li
        v-for="(term, index) in suggestions"
        :key="index"
        class="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors duration-150"
        :class="index === activeIndex ? 'bg-gray-700 text-green-400' : 'text-gray-300 hover:bg-gray-700 hover:text-green-400'"
        :style="index < suggestions.length - 1 ? 'border-bottom: 1px solid rgba(75,85,99,0.4)' : ''"
        @mouseenter="emit('hover', index)"
        @mousedown.prevent="emit('select', term)"
      >
        <i class="pi pi-search text-xs flex-shrink-0 opacity-60"></i>
        <span class="text-sm truncate">{{ term }}</span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.15s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-4px); }
  to   { opacity: 1; transform: translateY(0); }
}

li + li {
  border-top: 1px solid rgba(75, 85, 99, 0.4);
}
</style>
