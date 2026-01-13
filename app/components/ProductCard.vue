<script setup lang="ts">
const props = defineProps<{
  product: {
    id: string;
    boosted: boolean;
    document: {
      product_name: string;
      selling_price: number;
      images: string[];
    }
  }
}>();

const config = useRuntimeConfig();

const imageUrl = computed(() => {
  if (props.product.document.images && props.product.document.images.length > 0) {
    return `${config.public.imageBase}${props.product.document.images[0]}`;
  }
  return 'https://placehold.co/300x300?text=No+Image'; // Fallback
});

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);
};

const router = useRouter();

const viewDetail = () => {
    useState('selectedProduct', () => props.product).value = props.product;
    router.push(`/product/${props.product.id}`);
};

const handleImageError = (e: Event) => {
    (e.target as HTMLImageElement).src = 'https://placehold.co/300x300/333/FFF?text=No+Image';
};
</script>

<template>
  <Card class="h-full hover:bg-gray-800 transition-colors border border-gray-700 overflow-hidden bg-gray-800 cursor-pointer" @click="viewDetail">
    <template #header>
        <div class="aspect-square overflow-hidden relative group bg-gray-900">
            <span v-if="product.boosted" class="absolute top-2 left-2 z-10 bg-yellow-500 text-black text-[10px] font-bold px-2 py-0.5 rounded shadow-sm flex items-center gap-1">
                <i class="pi pi-bolt text-[10px]"></i> AD
            </span>
            <img :src="imageUrl" :alt="product.document.product_name" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" @error="handleImageError">
        </div>
    </template>
    <template #title>
        <div class="text-xs font-bold line-clamp-2 h-10 mb-2 leading-tight text-white">
            {{ product.document.product_name }}
        </div>
    </template>
    <template #content>
        <div class="text-green-400 font-bold text-lg">
            {{ formatPrice(product.document.selling_price) }}
        </div>
    </template>
    <template #footer>
        <div class="flex justify-end mt-2">
             <Button icon="pi pi-search" label="View" severity="secondary" size="small" outlined class="w-full border-gray-600 text-gray-300 hover:bg-gray-700" @click="viewDetail" />
        </div>
    </template>
  </Card>
</template>
