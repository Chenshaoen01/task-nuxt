/**
 * 僅允許 AdminUser 進入的頁面守衛。
 * 於管理頁面以 definePageMeta({ middleware: 'admin' }) 套用。
 * （未登入的情形已由 auth.global.ts 處理）
 */
export default defineNuxtRouteMiddleware(() => {
  const auth = useAuthStore()
  if (!auth.isAdmin) {
    return navigateTo('/projects')
  }
})
