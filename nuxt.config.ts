export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: [
    '@pinia/nuxt',
    '@nuxtjs/i18n',
    '@vite-pwa/nuxt'
  ],

  // PWA settings (safe to keep)
  pwa: {
    registerType: 'autoUpdate',
    client: { installPrompt: true },
    manifest: {
      name: 'Climate Writer',
      short_name: 'ClimateWriter',
      theme_color: '#0ea5e9'
    }
  },

  // <<< Fix for Vercel runtime “vue default export” error >>>
  experimental: {
    externalVue: false
  },
  nitro: {
    externals: { inline: ['vue', '@vue/*'] }
  },

  // (optional) public env you can show on the page to verify Preview/Prod
  runtimeConfig: {
    public: { appEnv: '' }
  }
})
