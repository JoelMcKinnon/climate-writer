export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: [
    '@pinia/nuxt',
    '@vite-pwa/nuxt',
    '@nuxtjs/tailwindcss',
    '@nuxtjs/i18n'
  ],

  // i18n module options at root (supported by Nuxt modules)
  i18n: {
    locales: [
      { code: 'en', name: 'English' },
      { code: 'es', name: 'Español' }
    ],
    defaultLocale: 'en',
    // NOTE: plain string path relative to project root
    vueI18n: 'i18n.config.ts'
  },

  css: ['~/assets/css/tailwind.css'],

  experimental: { externalVue: false },
  nitro: { externals: { inline: ['vue','@vue/*','vue-i18n','@intlify/*'] } },
  vite: { ssr: { noExternal: ['vue','vue-i18n','@intlify/*','@nuxtjs/i18n'] } },
  build: { transpile: ['vue-i18n','@nuxtjs/i18n'] },

  runtimeConfig: { public: { appEnv: '' } }
})
