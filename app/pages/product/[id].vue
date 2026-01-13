<script setup lang="ts">
const route = useRoute();
const router = useRouter();
const config = useRuntimeConfig();

const productId = route.params.id as string;
const product = ref<any>(null);
const loading = ref(true);

// Since we don't have a direct detail endpoint yet that differs from search, 
// and the user asked to "use data from search", normally next to client-side state 
// we would fetch search API filtered by ID if possible, OR just fetch the specific item.
// Given strict instructions "endpoint ... is /search... for data detail product please use data in search first",
// I will attempt to fetch from search with a query that might return it, 
// OR just rely on the assumption that for this research prototype, fetching the full search list 
// and finding the item is acceptable if state isn't passed.
// HOWEVER, a better approach for a "detail" page simulation is to try to find it in the "previous" state 
// or just fetch it again if the API supported ID lookup. 
// Since API is just /search, I'll fetch /search and find the item client side for now as a fallback, 
// assuming the ID is unique and stable.
// A more robust way if the API allowed `id` param would be that.
// Let's try to filter by ID if we can, or just fetch the page it might be on? 
// Actually, user said: "API... /search?query=uht... for data detail product please use data in search".
// I will implement a fetch to search and filter by ID.

const similarProducts = ref<any[]>([]);
const similarLoading = ref(false);

const fetchSimilarProducts = async () => {
    if (!product.value?.id) return;
    
    similarLoading.value = true;
    try {
        const { data } = await useFetch<any>(`${config.public.apiBase}/similar-product`, {
            params: {
                product_id: product.value.id
            }
        });

        if (data.value && data.value.success && data.value.results) {
            similarProducts.value = data.value.results;
        }
    } catch (e) {
        console.error("Error fetching similar products:", e);
    } finally {
        similarLoading.value = false;
    }
}

const fetchProductDetail = async () => {
  loading.value = true;
  try {
    // ideally we would have a store, but for this simple prototype:
    // We can't really "query" by ID in the text search easily without knowing the product name.
    // So if this page is reloaded, it might be hard to find the product if we don't know the query.
    // BUT, often `id` can be searched? Let's assume for now we just show a "Mock" fetch 
    // or try to use `useState` to grab it from the previous page if available.
    // If not available (refresh), we might be stuck.
    
    // Let's look at `window.history.state` or `useState` passed from index. 
    // But Nuxt `useState` is good for SPA nav.
    
    const cachedProduct = useState('selectedProduct').value;
    if (cachedProduct && (cachedProduct as any).id === productId) {
        product.value = cachedProduct;
        loading.value = false;
        fetchSimilarProducts();
        return;
    }

    // Fallback: Fetch "uht" (default sample) or some generic query to try and find it? 
    // This is brittle. I'll just note this limitation or try to fetch a broad search.
    // User verified "use data in search", implying I strictly use the structure.
    
    // For the sake of the demo avoiding broken refresh:
    // I will fetch the default search and try to find it.
    const { data } = await useFetch<any>(`${config.public.apiBase}/search`, {
       params: {
        query: 'uht', // Fallback query to get *some* data
        page: 1,
        page_size: 100
      }
    });

    if (data.value && data.value.success && data.value.results?.product) {
       const found = data.value.results.product.find((p: any) => p.id === productId);
       if (found) {
         product.value = found;
         fetchSimilarProducts();
       }
    }
  } catch (e) {
      console.error(e);
  } finally {
    loading.value = false;
  }
};


onMounted(() => {
    fetchProductDetail();
});

const imageUrl = computed(() => {
  if (product.value?.document?.images?.length) {
    return `${config.public.imageBase}${product.value.document.images[0]}`;
  }
  return 'https://placehold.co/600x600/333/FFF?text=No+Image';
});

const handleImageError = (e: Event) => {
    (e.target as HTMLImageElement).src = 'https://placehold.co/600x600/333/FFF?text=No+Image';
};

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);
};
</script>

<template>
  <div class="max-w-md mx-auto bg-gray-900 min-h-screen shadow-2xl relative border-x border-gray-800">
    <div v-if="loading" class="flex justify-center items-center h-screen">
        <i class="pi pi-spin pi-spinner text-4xl text-gray-400"></i>
    </div>

    <div v-else-if="product" class="pb-20">
        <!-- Header Image -->
        <div class="relative h-96 bg-gray-800">
            <Button icon="pi pi-arrow-left" rounded severity="secondary" class="absolute top-4 left-4 z-10 !bg-black/50 !text-white !border-none" @click="router.back()" />
            <img :src="imageUrl" class="w-full h-full object-contain" @error="handleImageError" />
        </div>

        <!-- Content -->
        <div class="p-6 -mt-6 rounded-t-3xl bg-gray-900 relative z-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.5)] border-t border-gray-800">
            <div class="mb-4">
                <span class="text-xs font-bold bg-green-900 text-green-300 px-2 py-1 rounded-full uppercase tracking-wider">{{ product.document.product_categories }}</span>
            </div>
            
            <h1 class="text-2xl font-bold text-white mb-2 leading-tight">{{ product.document.product_name }}</h1>
            
            <div class="flex items-end justify-between mb-6 border-b border-gray-800 pb-6">
                <div>
                     <p class="text-gray-400 text-sm mb-1">Price</p>
                     <p class="text-3xl font-bold text-green-400">{{ formatPrice(product.document.selling_price) }}</p>
                </div>
                 <div class="text-right">
                     <p class="text-gray-400 text-sm mb-1">Store</p>
                     <p class="font-semibold text-gray-200">{{ product.document.store }}</p>
                </div>
            </div>

            <div class="space-y-4">
                <h3 class="font-bold text-lg text-white">Product Details</h3>
                
                <div class="bg-gray-800 p-4 rounded-xl space-y-3 text-sm border border-gray-700">
                    <div class="flex justify-between">
                        <span class="text-gray-400">Sugar Level</span>
                        <span class="font-medium text-gray-200">{{ product.document.product_sugar_level }}</span>
                    </div>
                     <div class="flex justify-between">
                        <span class="text-gray-400">Vector Score</span>
                        <span class="font-medium text-gray-200">{{ product.score?.toFixed(4) }}</span>
                    </div>
                </div>

                <div v-if="product.document.chunk_text" class="mt-4">
                     <h3 class="font-bold text-sm text-white mb-2">Deskripsi / Chunk Text</h3>
                     <p class="text-gray-400 text-sm leading-relaxed">{{ product.document.chunk_text }}</p>
                </div>
            </div>
            
            <!-- Similar Products Section -->
            <div class="mt-8 border-t border-gray-800 pt-6">
                <h3 class="font-bold text-lg text-white mb-4">Similar Products</h3>
                
                <div v-if="similarLoading" class="flex justify-center py-4">
                    <i class="pi pi-spin pi-spinner text-green-500 text-2xl"></i>
                </div>
                
                <div v-else-if="similarProducts.length > 0" class="flex overflow-x-auto gap-4 pb-4 -mx-6 px-6 scrollbar-hide">
                    <div v-for="simProduct in similarProducts" :key="simProduct.id" class="min-w-[160px] w-[160px]">
                        <ProductCard :product="simProduct" />
                    </div>
                </div>
                
                <div v-else class="text-gray-500 text-center py-4 text-sm">
                    No similar products found.
                </div>
            </div>
        </div>

        <!-- Bottom Action Bar -->
        <div class="fixed bottom-0 left-0 right-0 p-4 bg-gray-900 border-t border-gray-800 flex justify-center max-w-md mx-auto">
            <Button label="Add to Cart" icon="pi pi-shopping-cart" class="w-full font-bold" size="large" />
        </div>
    </div>

    <div v-else class="flex flex-col justify-center items-center h-screen p-8 text-center">
        <i class="pi pi-exclamation-circle text-4xl text-gray-500 mb-4"></i>
        <p class="text-gray-400">Product not found. Please try searching again.</p>
        <Button label="Back to Search" class="mt-4" @click="router.push('/')" />
    </div>
  </div>
</template>
