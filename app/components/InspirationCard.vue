<script setup lang="ts">
const props = defineProps<{
  inspiration: {
    document: {
      image: string;
      title: string;
    }
  }
}>();

const config = useRuntimeConfig();

const imageUrl = computed(() => {
  return `${config.public.imageBase}${props.inspiration.document.image}`;
});

const handleImageError = (e: Event) => {
    (e.target as HTMLImageElement).src = 'https://placehold.co/150x200/333/FFF?text=Inspiration';
};

const router = useRouter();

const handleClick = () => {
    // Generate a simple slug from title
    const slug = props.inspiration.document.title.replace(/\s+/g, '-');
    useState('selectedInspiration', () => props.inspiration).value = props.inspiration;
    router.push(`/inspiration/${slug}`);
};
</script>

<template>
  <div class="min-w-[150px] max-w-[150px] mr-4 cursor-pointer hover:opacity-90 transition-opacity" @click="handleClick">
    <div class="rounded-lg overflow-hidden relative aspect-[3/4] shadow-sm bg-gray-800 border border-gray-700">
      <img :src="imageUrl" :alt="inspiration.document.title" class="w-full h-full object-cover" @error="handleImageError">
      <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-2">
        <h3 class="text-white text-xs font-semibold line-clamp-2">{{ inspiration.document.title }}</h3>
      </div>
    </div>
  </div>
</template>
