import { defineStore } from 'pinia'
import type { JwtPayload } from '~/types/api'
import { ADMIN_ROLE, ROLE_CLAIM } from '~/types/api'

interface AuthState {
  token: string | null
  userId: string | null
  tenantId: string | null
  tenantName: string | null
  email: string | null
  displayName: string | null
  role: string | null
}

/** 解碼 JWT payload（僅取 claims，不驗簽）。失敗回傳 null。 */
function decodeJwt(token: string): JwtPayload | null {
  try {
    const payload = token.split('.')[1]
    if (!payload) return null
    // base64url → base64
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join(''),
    )
    return JSON.parse(json) as JwtPayload
  } catch {
    return null
  }
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    token: null,
    userId: null,
    tenantId: null,
    tenantName: null,
    email: null,
    displayName: null,
    role: null,
  }),

  getters: {
    isAuthenticated: (state): boolean => !!state.token,
    /** 是否為系統管理員（可存取公司/員工管理） */
    isAdmin: (state): boolean => state.role === ADMIN_ROLE,
  },

  actions: {
    /** 存入 token，並自 JWT 解出使用者資訊 */
    setSession(token: string) {
      this.token = token
      const claims = decodeJwt(token)
      this.userId = claims?.sub ?? null
      this.tenantId = claims?.tenant_id ?? null
      this.tenantName = claims?.tenant_name ?? null
      this.email = claims?.email ?? null
      this.displayName = claims?.name ?? null
      this.role = claims?.[ROLE_CLAIM] ?? null
    },

    /** 呼叫後端登入並儲存 session；失敗時拋出錯誤 */
    async login(email: string, password: string) {
      const config = useRuntimeConfig()
      // 後端回傳的是 JWT token 字串本身，而非物件
      const token = await $fetch<string>('/api/Auth/login', {
        baseURL: config.public.apiBase,
        method: 'POST',
        body: { email, password },
      })
      this.setSession(token)
    },

    logout() {
      this.$reset()
    },
  },

  // 持久化整個 auth state 至 localStorage
  persist: true,
})
