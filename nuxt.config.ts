// nuxt.config.ts
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: [
    '@pinia/nuxt',
    '@nuxtjs/i18n',
    '@vite-pwa/nuxt'         // <-- add this
  ],
  pwa: {
    registerType: 'autoUpdate',
    client: { installPrompt: true },
    manifest: {
      name: 'Climate Writer',
      short_name: 'ClimateWriter',
      theme_color: '#0ea5e9'
    }
  }
})
