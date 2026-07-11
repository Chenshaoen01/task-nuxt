import type { $Fetch } from 'nitropack'
import type {
  CreateProjectRequest,
  CreateTaskRequest,
  CreateTenantRequest,
  CreateUserRequest,
  ProjectResponse,
  TaskQueryOptions,
  TaskResponse,
  TenantResponse,
  UpdateProjectRequest,
  UpdateTaskRequest,
  UpdateTenantRequest,
  UserResponse,
} from '~/types/api'
import { statusODataLiteral } from '~/types/api'

/**
 * 建立已注入 baseURL 與 Bearer token 的 $fetch 實例。
 * 遇到 401 時清除登入狀態並導回 /login。
 */
function createApiClient(): $Fetch {
  const config = useRuntimeConfig()
  const auth = useAuthStore()

  return $fetch.create({
    baseURL: config.public.apiBase,
    onRequest({ options }) {
      if (auth.token) {
        options.headers.set('Authorization', `Bearer ${auth.token}`)
      }
    },
    onResponseError({ response }) {
      if (response.status === 401) {
        auth.logout()
        navigateTo('/login')
      }
    },
  })
}

export function useApi() {
  return createApiClient()
}

/**
 * 組出 GET /api/Task/odata/Tasks 的 OData query 參數。
 * - $filter：以 ProjectId 限定專案，並可加上 State 狀態篩選
 * - $orderby：依 DueDate 排序
 * 欄位名採 EDM 的 PascalCase；Guid 直接作為字面值（不加引號）。
 */
function buildTaskQuery(
  projectId: string,
  options?: TaskQueryOptions,
): Record<string, string> {
  const filters = [`ProjectId eq ${projectId}`]
  if (options?.status !== null && options?.status !== undefined) {
    filters.push(`State eq ${statusODataLiteral(options.status)}`)
  }
  return {
    $filter: filters.join(' and '),
    $orderby: `DueDate ${options?.orderDir ?? 'asc'}`,
  }
}

export function useProjectsApi() {
  const api = useApi()

  return {
    list: () => api<ProjectResponse[]>('/api/Project'),
    get: (id: string) => api<ProjectResponse>(`/api/Project/${id}`),
    create: (body: CreateProjectRequest) =>
      api<ProjectResponse>('/api/Project', { method: 'POST', body }),
    update: (id: string, body: UpdateProjectRequest) =>
      api<ProjectResponse>(`/api/Project/${id}`, { method: 'PUT', body }),
    remove: (id: string) =>
      api(`/api/Project/${id}`, { method: 'DELETE' }),
  }
}

export function useTasksApi() {
  const api = useApi()

  return {
    // OData 端點：以 $filter/$orderby 於後端完成篩選與排序
    listByProject: (projectId: string, options?: TaskQueryOptions) =>
      api<TaskResponse[]>('/api/Task/odata/Tasks', {
        query: buildTaskQuery(projectId, options),
      }),
    get: (id: string) => api<TaskResponse>(`/api/Task/${id}`),
    create: (body: CreateTaskRequest) =>
      api<TaskResponse>('/api/Task', { method: 'POST', body }),
    update: (id: string, body: UpdateTaskRequest) =>
      api<TaskResponse>(`/api/Task/${id}`, { method: 'PUT', body }),
    remove: (id: string) =>
      api(`/api/Task/${id}`, { method: 'DELETE' }),
  }
}

/** 公司（租戶）管理 API，需 AdminUser 角色 */
export function useTenantsApi() {
  const api = useApi()

  return {
    list: () => api<TenantResponse[]>('/api/Tenant'),
    get: (id: string) => api<TenantResponse>(`/api/Tenant/${id}`),
    create: (body: CreateTenantRequest) =>
      api<TenantResponse>('/api/Tenant', { method: 'POST', body }),
    update: (id: string, body: UpdateTenantRequest) =>
      api<TenantResponse>(`/api/Tenant/${id}`, { method: 'PUT', body }),
    remove: (id: string) =>
      api(`/api/Tenant/${id}`, { method: 'DELETE' }),
  }
}

/** 員工（使用者）管理 API，需 AdminUser 角色 */
export function useUsersApi() {
  const api = useApi()

  return {
    // 依公司取得員工清單
    listByTenant: (tenantId: string) =>
      api<UserResponse[]>(`/api/User/GetTenantUser/${tenantId}`),
    create: (body: CreateUserRequest) =>
      api<UserResponse>('/api/User', { method: 'POST', body }),
    remove: (id: string) =>
      api(`/api/User/${id}`, { method: 'DELETE' }),
  }
}
