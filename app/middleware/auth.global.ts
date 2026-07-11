export default defineNuxtRouteMiddleware((to) => {
  const auth = useAuthStore()

  // 未登入：除了 /login 一律導向登入頁
  if (!auth.isAuthenticated && to.path !== '/login') {
    return navigateTo('/login')
  }

  // 已登入卻前往登入頁：導向專案列表
  if (auth.isAuthenticated && to.path === '/login') {
    return navigateTo('/projects')
  }
})
