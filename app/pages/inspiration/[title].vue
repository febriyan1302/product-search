<script setup lang="ts">
const router = useRouter();
const config = useRuntimeConfig();
const inspiration = useState<any>('selectedInspiration');

// Redirect if no state (since we can't fetch by ID nicely without search context)
if (!inspiration.value) {
    router.push('/');
}

const imageUrl = computed(() => {
    if (!inspiration.value?.document) return '';
    // Prefer banner image if available (from sample response seems to be `banner_share_thumbnail` or `image`?)
    // Sample shows `image` and `banner_share_thumbnail`. Let's use `image`.
    return `${config.public.imageBase}${inspiration.value.document.image}`;
});

const handleImageError = (e: Event) => {
    (e.target as HTMLImageElement).src = 'https://placehold.co/600x400/333/FFF?text=Inspiration';
};
</script>

<template>
  <div class="max-w-md mx-auto bg-gray-900 min-h-screen shadow-2xl relative border-x border-gray-800 text-gray-100" v-if="inspiration">
    <!-- Header Image -->
    <div class="relative h-64 bg-gray-800">
        <Button icon="pi pi-arrow-left" rounded severity="secondary" class="absolute top-4 left-4 z-10 !bg-black/50 !text-white !border-none" @click="router.back()" />
        <img :src="imageUrl" class="w-full h-full object-cover" @error="handleImageError" />
        <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900 to-transparent p-6 pt-20">
             <span class="text-xs font-bold bg-yellow-500 text-black px-2 py-1 rounded mb-2 inline-block uppercase tracking-wider">{{ inspiration.document.category || 'Recipe' }}</span>
             <h1 class="text-2xl font-bold text-white leading-tight shadow-black drop-shadow-md">{{ inspiration.document.title }}</h1>
        </div>
    </div>

    <div class="p-6 space-y-6">
        <!-- Metadata -->
        <div class="flex justify-between text-center bg-gray-800 p-4 rounded-xl border border-gray-700">
            <div>
                <p class="text-xs text-gray-400 uppercase">Difficulty</p>
                <p class="font-bold text-sm">{{ inspiration.document.difficulty }}</p>
            </div>
             <div>
                <p class="text-xs text-gray-400 uppercase">Cook Time</p>
                <p class="font-bold text-sm">{{ inspiration.document.cook_time }}m</p>
            </div>
             <div>
                <p class="text-xs text-gray-400 uppercase">Portion</p>
                <p class="font-bold text-sm">{{ inspiration.document.portion }}</p>
            </div>
        </div>

        <!-- HTML Content -->
        <div class="prose prose-invert prose-sm max-w-none">
            <div v-html="inspiration.document.banner_content"></div>
        </div>
    </div>
  </div>
</template>

<style>
/* Custom prose styling for the injected HTML if needed */
.prose p {
    margin-bottom: 0.8em;
}
</style>
