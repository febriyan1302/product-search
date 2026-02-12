<script setup lang="ts">
import { ref, reactive, watch, onMounted, onUnmounted } from 'vue';
import { useWindowScroll } from '@vueuse/core';
import { useToast } from 'primevue/usetoast';
import type { SearchResponse, PopularSearch, PopularSearchResponse, CacheClearResponse, RecommendationProduct, RecommendationResponse } from '~/types';

const config = useRuntimeConfig();
const route = useRoute();
const router = useRouter();

// User ID (cookie-based)
const userIdCookie = useCookie('user_id', { maxAge: 60 * 60 * 24 * 365 }); // 1 year
const showUserModal = ref(false);
const userNameInput = ref('');
const userId = ref(userIdCookie.value || '');

const searchQuery = ref(route.query.query?.toString() || '');
const products = ref<any[]>([]);
const inspirations = ref<any[]>([]);
const page = ref(1);
const loading = ref(false);
const popularSearchesLoading = ref(false);
const popularSearches = ref<PopularSearch[]>([]);
const hasNext = ref(true);
const searchDuration = ref<number | null>(null);
const searchProvider = ref('pinecone'); // 'pinecone' | 'elasticsearch'
const autoCorrect = ref(true);
const rerank = ref(true);
const correctionMessage = ref('');
const showCacheDialog = ref(false);
const clearingCache = ref(false);
const toast = useToast();

// Recommendations state
const recommendations = ref<RecommendationProduct[]>([]);
const recommendationsLoading = ref(false);
const recommendationSource = ref('');
const recommendationHistory = ref<string[]>([]);

// Save user name to cookie
const saveUserName = () => {
    const name = userNameInput.value.trim();
    if (!name) return;
    userIdCookie.value = name;
    userId.value = name;
    showUserModal.value = false;
    userNameInput.value = '';
    toast.add({ severity: 'success', summary: 'Welcome!', detail: `Halo, ${name}! Rekomendasi produk akan disesuaikan untukmu.`, life: 3000 });
};

// Open modal to change name
const changeUserName = () => {
    userNameInput.value = userId.value;
    showUserModal.value = true;
};

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
    
    const endpoint = searchProvider.value === 'elasticsearch' ? '/search-es-rerank' : '/search';
    
    // Auto-correction logic
    if (reset && autoCorrect.value && searchQuery.value.trim()) {
        try {
            const { data: typoData } = await useFetch<any>(`${config.public.apiBase}/correct-typo`, {
                params: { query: searchQuery.value }
            });

            if (typoData.value && typoData.value.is_corrected) {
                correctionMessage.value = `No results found for "${typoData.value.original}". Showing results for "${typoData.value.final_corrected}".`;
                searchQuery.value = typoData.value.final_corrected;
                // Update URL to match corrected query without triggering another fetch due to watch
                 router.replace({ query: { ...route.query, query: searchQuery.value } });
            } else {
                 correctionMessage.value = '';
            }
        } catch (e) {
            console.error("Typo correction failed", e);
             correctionMessage.value = '';
        }
    } else if (reset) {
         correctionMessage.value = '';
    }

    const fetchParams: Record<string, any> = {
        query: searchQuery.value,
        page: page.value,
        page_size: 10,
        rerank: rerank.value
    };
    if (userId.value) {
        fetchParams.user_id = userId.value;
    }

    const { data } = await useFetch<SearchResponse>(`${config.public.apiBase}${endpoint}`, {
      params: fetchParams
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

const goHome = () => {
    window.location.href = '/';
}

const fetchPopularSearches = async () => {
    popularSearchesLoading.value = true;
    try {
        console.log('Fetching popular searches...');
        const response = await $fetch<PopularSearchResponse>(`${config.public.apiBase}/popular-searches`, {
            params: { limit: 10 }
        });
        console.log('Popular searches response:', response);
        
        if (response && response.success && response.results) {
            popularSearches.value = response.results;
        } else {
             console.warn('Popular searches response format invalid or unsuccessful:', response);
        }
    } catch (error) {
        console.error("Error fetching popular searches:", error);
    } finally {
        popularSearchesLoading.value = false;
    }
}

const fetchRecommendations = async () => {
    if (!userId.value) return;
    recommendationsLoading.value = true;
    try {
        const response = await $fetch<RecommendationResponse>(`${config.public.apiBase}/recommendations`, {
            params: { user_id: userId.value, limit: 100 }
        });
        if (response && response.success && response.results) {
            recommendations.value = response.results;
            recommendationSource.value = response.source || '';
            recommendationHistory.value = response.history_used || [];
        }
    } catch (error) {
        console.error('Error fetching recommendations:', error);
    } finally {
        recommendationsLoading.value = false;
    }
}

const onSelectPopularSearch = (term: string) => {
    searchQuery.value = term;
    onSearch();
}

const clearCache = async () => {
    clearingCache.value = true;
    try {
        const response = await $fetch<CacheClearResponse>(`${config.public.apiBase}/search/cache`, {
            method: 'DELETE'
        });
        
        if (response && response.success) {
             toast.add({ severity: 'success', summary: 'Success', detail: response.message, life: 3000 });
        } else {
             toast.add({ severity: 'error', summary: 'Error', detail: response.message || 'Failed to clear cache', life: 3000 });
        }
    } catch (error) {
         console.error("Error clearing cache:", error);
         toast.add({ severity: 'error', summary: 'Error', detail: 'An error occurred while clearing cache', life: 3000 });
    } finally {
        clearingCache.value = false;
        showCacheDialog.value = false;
    }
}

// Initial fetch
onMounted(() => {
    // Show modal if user_id cookie is not set
    if (!userIdCookie.value) {
        showUserModal.value = true;
    }
    fetchData(true);
    fetchPopularSearches();
    fetchRecommendations();
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

// Watch rerank change
watch(rerank, () => {
    fetchData(true);
});


// Infinite Scroll Logic
// Simple implementation: Check if bottom of page is reached

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
    <!-- User Name Modal -->
    <Dialog v-model:visible="showUserModal" :closable="!!userId" modal header="Selamat Datang! 👋" :style="{ width: '22rem' }" :pt="{ mask: { class: 'backdrop-blur-sm' } }">
        <div class="flex flex-col gap-4">
            <p class="text-gray-300 text-sm leading-relaxed">
                Masukkan nama kamu untuk mendapatkan <strong class="text-green-400">rekomendasi produk</strong> yang dipersonalisasi berdasarkan riwayat pencarianmu.
            </p>
            <div class="flex flex-col gap-2">
                <label for="user-name-input" class="text-sm font-semibold text-gray-200">Nama</label>
                <InputText 
                    id="user-name-input" 
                    v-model="userNameInput" 
                    placeholder="Contoh: Fajar" 
                    class="w-full bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:ring-green-500 focus:border-green-500" 
                    @keydown.enter="saveUserName" 
                />
            </div>
            <Button 
                label="Simpan" 
                icon="pi pi-check" 
                class="w-full" 
                :disabled="!userNameInput.trim()" 
                @click="saveUserName" 
            />
        </div>
    </Dialog>

    <!-- Search Header -->
    <div class="sticky top-0 z-50 bg-gray-900 p-4 shadow-md border-b border-gray-800 flex flex-col gap-3">
        <!-- Greeting -->
        <div v-if="userId" class="flex items-center justify-between px-1">
            <span class="text-sm text-gray-300">
                Hi, <strong class="text-green-400">{{ userId }}</strong> 👋
            </span>
            <button 
                class="text-xs text-gray-500 hover:text-green-400 transition-colors cursor-pointer flex items-center gap-1" 
                @click="changeUserName"
            >
                <i class="pi pi-pencil text-[10px]"></i>
                Ubah
            </button>
        </div>

        <div class="flex items-center gap-2">
            <button 
                v-if="searchQuery" 
                class="flex-shrink-0 w-10 h-10 rounded-full bg-gray-800 border border-gray-700 text-gray-400 hover:text-green-400 hover:border-green-500 transition-all flex items-center justify-center cursor-pointer" 
                @click="goHome"
                title="Back to Home"
            >
                <i class="pi pi-arrow-left text-sm"></i>
            </button>
            <IconField iconPosition="left" class="flex-1">
                <InputIcon class="pi pi-search text-gray-400" />
                <InputText v-model="searchQuery" placeholder="Search products..." class="w-full rounded-full bg-gray-800 border-gray-700 text-white placeholder-gray-500 px-10 py-3 focus:ring-green-500 focus:border-green-500" @keydown.enter="onSearch" />
            </IconField>
            
            <div class="ml-2 flex items-center gap-2">
                <select v-model="searchProvider" class="bg-gray-800 text-white text-sm rounded-lg focus:ring-green-500 focus:border-green-500 block w-full p-2.5 border border-gray-700">
                    <option value="pinecone">Pinecone</option>
                    <option value="elasticsearch">Elasticsearch</option>
                </select>
            </div>
        </div>
        
        <div class="grid grid-cols-2 gap-3 px-1">
             <div class="flex items-center justify-between bg-gray-800 p-2 rounded-lg border border-gray-700/50">
                <label for="auto-correct" class="cursor-pointer select-none text-xs text-gray-300">Auto Correction</label>
                 <InputSwitch id="auto-correct" v-model="autoCorrect" style="transform: scale(0.8);" />
            </div>
            <div class="flex items-center justify-between bg-gray-800 p-2 rounded-lg border border-gray-700/50">
                <label for="enable-rerank" class="cursor-pointer select-none text-xs text-gray-300">Rerank</label>
                 <InputSwitch id="enable-rerank" v-model="rerank" style="transform: scale(0.8);" />
            </div>
        </div>
        
        <div class="px-1">
            <Button label="Clear Cache" icon="pi pi-trash" size="small" severity="danger" outlined class="w-full" @click="showCacheDialog = true" />
        </div>
    </div>

    <Dialog v-model:visible="showCacheDialog" modal header="Confirm Action" :style="{ width: '25rem' }">
        <span class="text-gray-300 block mb-8">Are you sure you want to clear the search cache?</span>
        <div class="flex justify-end gap-2">
            <Button type="button" label="Cancel" severity="secondary" @click="showCacheDialog = false"></Button>
            <Button type="button" label="Clear" severity="danger" @click="clearCache" :loading="clearingCache"></Button>
        </div>
    </Dialog>

    <Toast position="bottom-center" />

    <div class="p-4 flex-1 overflow-y-auto">
        <!-- Search Info Bar -->
        <div v-if="searchDuration !== null && !loading" class="mb-4 text-xs text-gray-500 flex items-center justify-between gap-2">
            <div class="flex items-center gap-2">
                 <i class="pi pi-clock"></i>
                <span>Fetched in <strong class="text-green-400">{{ searchDuration.toFixed(2) }} ms</strong></span>
            </div>
             <div v-if="correctionMessage" class="text-yellow-500 italic">
                {{ correctionMessage }}
            </div>
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

        <!-- Popular Searches Section -->
        <PopularSearches 
            v-if="!searchQuery && products.length === 0" 
            :searches="popularSearches" 
            :loading="popularSearchesLoading" 
            @select="onSelectPopularSearch" 
        />

        <!-- Recommendations Section -->
        <div v-if="!searchQuery && products.length === 0 && recommendations.length > 0" class="mb-8">
            <div class="mb-4">
                <h2 class="text-lg font-bold text-white flex items-center gap-2">
                    <i class="pi pi-thumbs-up text-green-400"></i>
                    Your Product Recommendations
                </h2>
                <p v-if="recommendationHistory.length > 0" class="text-xs text-gray-400 mt-1">
                    Based on your search history: 
                    <span v-for="(term, i) in recommendationHistory" :key="i">
                        <strong class="text-green-400">{{ term }}</strong><span v-if="i < recommendationHistory.length - 1">, </span>
                    </span>
                </p>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <ProductCard v-for="product in recommendations" :key="product.id" :product="product" />
            </div>
        </div>

        <!-- Recommendations Loading -->
        <div v-if="!searchQuery && products.length === 0 && recommendationsLoading" class="py-8 text-center">
            <i class="pi pi-spin pi-spinner text-green-500 text-2xl"></i>
            <p class="text-gray-400 text-sm mt-2">Memuat rekomendasi...</p>
        </div>

        <!-- Product List Section -->
        <div v-if="searchQuery || products.length > 0">
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
