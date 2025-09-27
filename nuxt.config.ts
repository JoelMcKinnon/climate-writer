// nuxt.config.ts
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: [
    '@pinia/nuxt',
    '@nuxtjs/i18n',
    '@vite-pwa/nuxt'
  ],

  // PWA (ok to keep)
  pwa: {
    registerType: 'autoUpdate',
    client: { installPrompt: true },
    manifest: {
      name: 'Climate Writer',
      short_name: 'ClimateWriter',
      theme_color: '#0ea5e9'
    }
  },

  // --- key fixes for Vercel SSR bundling ---
  experimental: {
    externalVue: false     // don’t externalize vue on the server
  },
  nitro: {
    externals: {
      inline: ['vue', '@vue/*', 'vue-i18n', '@intlify/*']
    }
  },
  vite: {
    ssr: {
      // ensure these are bundled (no external/commonjs interop)
      noExternal: ['vue', 'vue-i18n', '@intlify/*', '@nuxtjs/i18n']
    }
  },
  build: {
    // keep them transpiled just in case
    transpile: ['vue-i18n', '@nuxtjs/i18n']
  },

  runtimeConfig: {
    public: { appEnv: '' }
  }
})
