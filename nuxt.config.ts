// nuxt.config.ts
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: [
    '@pinia/nuxt',
    ['@nuxtjs/i18n', {
      locales: ['en', 'es'],
      defaultLocale: 'en',
      // pass vue-i18n options directly (no separate i18n.config.ts)
      vueI18n: {
        legacy: false,
        locale: 'en',
        fallbackLocale: 'en',
        messages: { en: {}, es: {} }
      }
    }],
    '@vite-pwa/nuxt'
  ],

  pwa: {
    registerType: 'autoUpdate',
    client: { installPrompt: true },
    manifest: {
      name: 'Climate Writer',
      short_name: 'ClimateWriter',
      theme_color: '#0ea5e9'
    }
  },

  // keep the Vercel SSR fixes
  experimental: { externalVue: false },
  nitro: { externals: { inline: ['vue', '@vue/*', 'vue-i18n', '@intlify/*'] } },
  vite: { ssr: { noExternal: ['vue', 'vue-i18n', '@intlify/*', '@nuxtjs/i18n'] } },
  build: { transpile: ['vue-i18n', '@nuxtjs/i18n'] },

  runtimeConfig: { public: { appEnv: '' } }
})
