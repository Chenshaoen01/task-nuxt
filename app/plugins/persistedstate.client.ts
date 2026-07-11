import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

// 將 pinia-plugin-persistedstate 註冊到 Nuxt 的 Pinia 實例（僅在 client 執行）
export default defineNuxtPlugin((nuxtApp) => {
  const pinia = nuxtApp.$pinia as { use: (p: unknown) => void }
  pinia.use(piniaPluginPersistedstate)
})
