<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import { useWindowScroll } from '@vueuse/core';
import type { SearchResponse } from '~/types';

const config = useRuntimeConfig();
const route = useRoute();
const router = useRouter();

const searchQuery = ref(route.query.query?.toString() || '');
const products = ref<any[]>([]);
const inspirations = ref<any[]>([]);
const page = ref(1);
const loading = ref(false);
const hasNext = ref(true);
const searchDuration = ref<number | null>(null);
const searchProvider = ref('pinecone'); // 'pinecone' | 'elasticsearch'

const { y } = useWindowScroll();

const fetchData = async (reset = false) => {
  if (loading.value || (!hasNext.value && !reset)) return;

  loading.value = true;
  
  if (reset) {
    page.value = 1;
    products.value = [];
    // inspirations are only fetched on page 1 / first load usually, but let's keep it simple
    inspirations.value = []; 
    hasNext.value = true;
    searchDuration.value = null;
  }

  try {
    const startTime = performance.now();
    
    const endpoint = searchProvider.value === 'elasticsearch' ? '/search-es' : '/search';
    const { data } = await useFetch<SearchResponse>(`${config.public.apiBase}${endpoint}`, {
      params: {
        query: searchQuery.value,
        page: page.value,
        page_size: 10
      }
    });

    const endTime = performance.now();
    searchDuration.value = endTime - startTime;

    if (data.value && data.value.success) {
      // Handle Products
      if (data.value.results?.product) {
        if (reset) {
            products.value = data.value.results.product;
        } else {
            products.value.push(...data.value.results.product);
        }
      }

      // Handle Inspirations (Only on page 1)
      if (page.value === 1 && data.value.results?.super_inspiration) {
        inspirations.value = data.value.results.super_inspiration;
      }

      // Handle Pagination
      if (data.value.pagination) {
        hasNext.value = data.value.pagination.has_next;
        if (hasNext.value) {
            page.value++;
        }
      } else {
          hasNext.value = false;
      }
    }
  } catch (error) {
    console.error("Error fetching data:", error);
  } finally {
    loading.value = false;
  }
};

const onSearch = () => {
    router.push({ query: { ...route.query, query: searchQuery.value } });
    fetchData(true);
}

// Initial fetch
onMounted(() => {
    fetchData(true);
});

// Watch query param change (e.g. browser back button)
watch(() => route.query.query, (newQuery) => {
    if (newQuery !== searchQuery.value) {
        searchQuery.value = newQuery?.toString() || '';
        fetchData(true);
    }
});

// Watch provider change
watch(searchProvider, () => {
    fetchData(true);
});


// Infinite Scroll Logic
// Simple implementation: Check if bottom of page is reached
import { onMounted, onUnmounted } from 'vue';

const handleScroll = () => {
  const bottomOfWindow = Math.ceil(window.innerHeight + window.scrollY) >= document.documentElement.offsetHeight - 500; // Trigger 500px before bottom
  if (bottomOfWindow) {
    fetchData();
  }
};

onMounted(() => {
  window.addEventListener('scroll', handleScroll);
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});

</script>

<template>
  <div class="max-w-md mx-auto bg-gray-900 min-h-screen shadow-2xl overflow-hidden flex flex-col border-x border-gray-800">
    <!-- Search Header -->
    <div class="sticky top-0 z-50 bg-gray-900 p-4 shadow-md border-b border-gray-800 flex items-center gap-2">
        <IconField iconPosition="left" class="flex-1">
            <InputIcon class="pi pi-search text-gray-400" />
            <InputText v-model="searchQuery" placeholder="Search products..." class="w-full rounded-full bg-gray-800 border-gray-700 text-white placeholder-gray-500 px-10 py-3 focus:ring-green-500 focus:border-green-500" @keydown.enter="onSearch" />
        </IconField>
        
        <div class="ml-2">
            <select v-model="searchProvider" class="bg-gray-800 text-white text-sm rounded-lg focus:ring-green-500 focus:border-green-500 block w-full p-2.5 border border-gray-700">
                <option value="pinecone">Pinecone</option>
                <option value="elasticsearch">Elasticsearch</option>
            </select>
        </div>
    </div>

    <div class="p-4 flex-1 overflow-y-auto">
        <!-- Search Info Bar -->
        <div v-if="searchDuration !== null && !loading" class="mb-4 text-xs text-gray-500 flex items-center gap-2">
            <i class="pi pi-clock"></i>
            <span>Fetched in <strong class="text-green-400">{{ searchDuration.toFixed(2) }} ms</strong></span>
        </div>

        <!-- Super Inspiration Section -->
        <div v-if="inspirations.length > 0" class="mb-8">
            <h2 class="text-lg font-bold mb-4 text-white flex items-center">
                <i class="pi pi-bolt text-yellow-500 mr-2"></i> Super Inspiration
            </h2>
            <div class="flex overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
                <InspirationCard v-for="(item, index) in inspirations" :key="index" :inspiration="item" />
            </div>
        </div>

        <!-- Product List Section -->
        <div>
            <h2 class="text-lg font-bold mb-4 text-white">Products</h2>
            <div class="grid grid-cols-2 gap-4">
                <ProductCard v-for="product in products" :key="product.id" :product="product" />
            </div>
            
            <!-- Loading State -->
            <div v-if="loading" class="py-4 text-center">
                <i class="pi pi-spin pi-spinner text-green-500 text-2xl"></i>
            </div>
             <div v-if="!loading && products.length === 0" class="py-10 text-center text-gray-400">
                No products found.
            </div>
             <div v-if="!hasNext && products.length > 0" class="py-8 text-center text-gray-400 text-sm">
                You've reached the end of the list.
            </div>
        </div>
    </div>
  </div>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
    display: none;
}
.scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
}
</style>
