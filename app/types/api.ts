// 對應後端 TaskApi 的 DTO 與列舉

/** 任務狀態：後端 enum TaskState { Todo, Inprogress, Done } 序列化為整數 (0/1/2) */
export enum TaskStatus {
  Todo = 0,
  Inprogress = 1,
  Done = 2,
}

/** 下拉選單用的狀態選項 */
export const statusOptions: { title: string; value: TaskStatus }[] = [
  { title: 'Todo', value: TaskStatus.Todo },
  { title: 'In Progress', value: TaskStatus.Inprogress },
  { title: 'Done', value: TaskStatus.Done },
]

/** 數字狀態 → 顯示文字 */
export function statusLabel(value: TaskStatus): string {
  return statusOptions.find((o) => o.value === value)?.title ?? String(value)
}

/** 狀態對應的色彩（Vuetify chip color） */
export function statusColor(value: TaskStatus): string {
  switch (value) {
    case TaskStatus.Todo:
      return 'grey'
    case TaskStatus.Inprogress:
      return 'blue'
    case TaskStatus.Done:
      return 'green'
    default:
      return 'grey'
  }
}

/**
 * 產生 OData $filter 用的 TaskState enum 字面值。
 * 後端 OData 未啟用 camelCase，enum 型別為完全限定名稱
 * Task.Domain.Entity.TaskState（成員：Todo / Inprogress / Done）。
 */
export function statusODataLiteral(value: TaskStatus): string {
  const name =
    value === TaskStatus.Todo
      ? 'Todo'
      : value === TaskStatus.Inprogress
        ? 'Inprogress'
        : 'Done'
  return `Task.Domain.Entity.TaskState'${name}'`
}

/**
 * 登入回應。
 * 後端 POST /api/Auth/login 直接回傳「JWT token 字串」本身（Ok(string)），
 * 並非物件。使用者資訊需自 token 解碼（見 JwtPayload）。
 */
export type LoginResponse = string

/**
 * JWT 角色 claim 的 key。
 * 後端以 new Claim(ClaimTypes.Role, ...) 直接寫入 token，未經 outbound mapping，
 * 故 payload 中 role 的 key 為完整 URI。值為 UserRole enum 名稱（AdminUser / GenaralUser）。
 */
export const ROLE_CLAIM =
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'

/** AdminUser 角色字串（對應後端 UserRole.AdminUser） */
export const ADMIN_ROLE = 'AdminUser'

/**
 * JWT payload claims（由 JwtTokenGenerator 產生）。
 * - sub：使用者 Id
 * - email：Email
 * - name：使用者名稱
 * - tenant_id：租戶 Id
 * - tenant_name：租戶名稱
 * - [ROLE_CLAIM]：角色（完整 URI 為 key）
 */
export interface JwtPayload {
  sub: string
  email: string
  name: string
  tenant_id: string
  tenant_name: string
  exp?: number
  [ROLE_CLAIM]?: string
}

/** 對應 ProjectGet */
export interface ProjectResponse {
  id: string
  name: string
}

/** 對應 ProjectCreate */
export interface CreateProjectRequest {
  name: string
}

/** 對應 ProjectUpdate */
export type UpdateProjectRequest = CreateProjectRequest

/** 對應 TaskItemGet（DueDate 後端為非 nullable DateTime） */
export interface TaskResponse {
  id: string
  projectId: string
  taskTitle: string
  dueDate: string
  state: TaskStatus
}

/**
 * 對應 TaskItemCreate（建立時由後端指派狀態，故不含 state）。
 * dueDate 對應後端非 nullable DateTime，為必填。
 */
export interface CreateTaskRequest {
  projectId: string
  taskTitle: string
  dueDate: string
}

/**
 * 對應 TaskItemUpdate（更新可帶狀態，且不含 projectId）。
 * dueDate 對應後端非 nullable DateTime，為必填。
 */
export interface UpdateTaskRequest {
  taskTitle: string
  dueDate: string
  state: TaskStatus
}

/**
 * 任務清單的 OData 查詢選項（對應 GET /api/Task/odata/Tasks）。
 * 篩選與排序由後端 OData 處理，故欄位名用 EDM 的 PascalCase。
 */
export interface TaskQueryOptions {
  /** 依狀態篩選（$filter State） */
  status?: TaskStatus | null
  /** 依截止日排序方向（$orderby DueDate） */
  orderDir?: 'asc' | 'desc'
}

// ── 平台管理（AdminUser）：公司 Tenant / 員工 User ─────────────

/** 對應 Tenant */
export interface TenantResponse {
  id: string
  name: string
}

/** 對應 TenantCreate */
export interface CreateTenantRequest {
  name: string
}

/** 對應 TenantUpdate */
export type UpdateTenantRequest = CreateTenantRequest

/** 對應 UserGet */
export interface UserResponse {
  id: string
  name: string
  email: string
}

/** 對應 UserCreate（新增員工至指定公司；角色由後端預設） */
export interface CreateUserRequest {
  tenantId: string
  name: string
  email: string
  password: string
}
