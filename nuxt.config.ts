import Aura from '@primevue/themes/aura';

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  modules: [
    '@nuxtjs/tailwindcss',
    '@primevue/nuxt-module'
  ],
  runtimeConfig: {
    public: {
      apiBase: '', // Overridden by NUXT_PUBLIC_API_BASE in .env
      imageBase: '' // Overridden by NUXT_PUBLIC_IMAGE_BASE in .env
    }
  },
  primevue: {
    options: {
      ripple: true,
      theme: {
        preset: Aura
      }
    },
    components: {
      include: ['Card', 'Button', 'InputText', 'IconField', 'InputIcon', 'InputSwitch', 'Dialog', 'Toast']
    }
  },
  vite: {
    server: {
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '')
        }
      }
    }
  }
})
