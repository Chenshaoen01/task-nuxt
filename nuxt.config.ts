// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  // 後台型介面，採 SPA（client-only）模式：localStorage 持久化與路由守衛皆於瀏覽器執行
  ssr: false,

  modules: ['vuetify-nuxt-module', '@pinia/nuxt'],

  css: ['@mdi/font/css/materialdesignicons.css'],

  vuetify: {
    moduleOptions: {},
    vuetifyOptions: {
      icons: {
        defaultSet: 'mdi',
      },
      theme: {
        defaultTheme: 'light',
      },
    },
  },

  runtimeConfig: {
    public: {
      // 後端 API base URL（對應 swagger server），預設值可由環境變數 NUXT_PUBLIC_API_BASE 覆寫（見 .env）
      apiBase: '',
    },
  },
})
