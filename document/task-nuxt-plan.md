# TaskNuxt 前端專案實作計畫

## 1. 專案目標

後端 `TaskApi`（ASP.NET Core 9 + Clean Architecture + JWT 多租戶 + OData）已完成，
本前端專案 `TaskNuxt`（Nuxt 4 + Vue 3）負責提供瀏覽器介面，讓使用者完成以下情境：

1. 登入取得 JWT。
2. 建立 / 瀏覽租戶底下的專案。
3. 在專案下建立 / 查詢任務。
4. 用 OData 篩選 `Status = Todo` 的任務、依 `DueDate` 排序。
5. 切換 A / B 租戶登入，驗證跨租戶資料隔離（B 租戶看不到 A 租戶的資料）。

## 2. 技術選型

- 框架：Nuxt 4（Vue 3 + Nitro），TypeScript。
- UI 元件庫：Vuetify 3（透過 `vuetify-nuxt-module`）+ `@mdi/font` 圖示。
- 狀態管理：Pinia（`@pinia/nuxt`）+ 持久化（`pinia-plugin-persistedstate`），JWT 重整後維持登入。
- HTTP：Nuxt 內建 `$fetch`（ofetch），封裝成 composable 注入 Bearer token。
- 套件管理：pnpm。

## 3. 後端 API 合約（已從後端原始碼確認）

- Base URL：`http://localhost:5102`（建議後端以 `http` profile 執行，此 profile 下 `UseHttpsRedirection` 不會轉址）。
- 登入：`POST /auth/login`　body `{ email, password }` → `{ token, userId, tenantId, email, displayName }`；失敗回 `401`。
- 其餘端點皆需 header `Authorization: Bearer <token>`。

| 方法 | 路徑 | 說明 |
| --- | --- | --- |
| GET | `/projects` | 取得目前租戶的專案清單 |
| POST | `/projects` | 建立專案 `{ name, description? }` |
| GET | `/projects/{id}` | 取得單一專案 |
| PUT | `/projects/{id}` | 更新專案 `{ name, description? }` |
| DELETE | `/projects/{id}` | 刪除專案 |
| GET | `/projects/{projectId}/tasks` | 任務清單，支援 OData `$filter` / `$orderby` |
| POST | `/projects/{projectId}/tasks` | 建立任務 `{ title, description?, status, assigneeUserId?, dueDate? }` |
| GET | `/tasks/{id}` | 取得單一任務 |
| PUT | `/tasks/{id}` | 更新任務（欄位同建立） |
| DELETE | `/tasks/{id}` | 刪除任務 |

- **任務狀態序列化為整數**：`0 = Todo`、`1 = InProgress`、`2 = Done`（後端未掛 `JsonStringEnumConverter`）。
  - 前端讀寫一律用數字。
  - OData `$filter` 需用字串列舉名稱，例如 `?$filter=status eq 'Todo'`；排序 `?$orderby=dueDate asc`。
  - 因此需要「數字 ↔ 名稱」對照表。
- 資料不存在或不屬於目前租戶時一律回 `404`（避免洩漏其他租戶資料是否存在）。
- 測試帳號（密碼皆 `Password123!`）：
  - `alice@tenant-a.com`（租戶 A）
  - `bob@tenant-b.com`（租戶 B）
  - 種子資料只有租戶與使用者，沒有預設專案 / 任務。

## 4. 專案結構

```text
TaskNuxt/
  nuxt.config.ts            # 模組、Vuetify、runtimeConfig.public.apiBase
  app/
    app.vue                 # <NuxtLayout><NuxtPage/></NuxtLayout>
    types/api.ts            # API 型別與狀態對照
    stores/auth.ts          # Pinia auth store（持久化）
    composables/useApi.ts   # $fetch 封裝 + Bearer + 401 處理
    middleware/auth.global.ts  # 路由守衛
    layouts/default.vue     # App bar + 登出
    pages/
      index.vue             # 轉址至 /projects
      login.vue             # 登入頁
      projects/
        index.vue           # 專案列表 + 新增/編輯/刪除
        [id].vue            # 專案詳情 + 任務（OData 篩選/排序 + CRUD）
  document/task-nuxt-plan.md
  README.md
```

## 5. 實作步驟

### 步驟 0：撰寫本計畫文件
即此檔。

### 步驟 1：安裝相依套件
```bash
pnpm add vuetify vuetify-nuxt-module @mdi/font
pnpm add pinia @pinia/nuxt pinia-plugin-persistedstate
```

### 步驟 2：設定 `nuxt.config.ts`
- `modules: ['vuetify-nuxt-module', '@pinia/nuxt']`
- Vuetify：啟用預設主題、mdi 圖示。
- `css: ['@mdi/font/css/materialdesignicons.css']`
- `runtimeConfig.public.apiBase`（預設 `http://localhost:5102`，可由 `NUXT_PUBLIC_API_BASE` 覆寫）。
- 註冊 `pinia-plugin-persistedstate`（plugin 形式）。

### 步驟 3：型別定義 `app/types/api.ts`
- 介面：`LoginResponse`、`ProjectResponse`、`TaskResponse`、`CreateProjectRequest`、`CreateTaskRequest`/`UpdateTaskRequest`。
- `TaskStatus` 數字列舉（Todo=0, InProgress=1, Done=2）。
- `statusOptions`（下拉用）、`statusLabel(value)`、`statusODataName(value)`（OData 名稱）。

### 步驟 4：Auth store `app/stores/auth.ts`
- state：`token`、`userId`、`tenantId`、`email`、`displayName`。
- getter：`isAuthenticated`。
- action：`login(email, password)`、`logout()`。
- `persist: true` 持久化（localStorage）。

### 步驟 5：API composable `app/composables/useApi.ts`
- 封裝 `$fetch`：注入 `baseURL`、`Authorization`。
- `onResponseError` 401：清除 auth、導向 `/login`。
- 匯出 `useProjectsApi`、`useTasksApi`（含列表、單筆、建立、更新、刪除；任務列表帶 OData query）。

### 步驟 6：路由守衛 `app/middleware/auth.global.ts`
- 未登入存取非 `/login` 頁面 → 轉址 `/login`。
- 已登入存取 `/login` → 轉址 `/projects`。

### 步驟 7：版面
- `app/layouts/default.vue`：`v-app` + `v-app-bar`（目前使用者 / 租戶、登出鈕）+ `v-main`。
- `app/app.vue`：`<NuxtLayout><NuxtPage/></NuxtLayout>`。

### 步驟 8：頁面
- `login.vue`：登入表單、快速填入測試帳號、錯誤提示。
- `index.vue`：轉址 `/projects`。
- `projects/index.vue`：專案列表 + 新增 / 編輯 / 刪除對話框。
- `projects/[id].vue`：專案詳情 + 任務列表（`v-data-table`）、狀態篩選（OData `$filter`）、依 DueDate 排序（`$orderby`）、任務 CRUD 對話框。

### 步驟 9：本機驗證（見第 7 節）。

### 步驟 10：更新 `README.md`（啟動方式、CORS 前置需求、測試帳號、驗收流程）。

## 6. 後端 CORS（前置需求，需在後端設定）

前端開發伺服器預設為 `http://localhost:3000`，跨來源呼叫後端需在 `TaskApi/Program.cs` 加入 CORS：

```csharp
builder.Services.AddCors(o => o.AddPolicy("frontend", p =>
    p.WithOrigins("http://localhost:3000").AllowAnyHeader().AllowAnyMethod()));

// 置於 UseAuthentication 之前
app.UseCors("frontend");
```

> 本前端專案不修改後端原始碼，此節僅作為啟動前置需求記錄。

## 7. 驗證方式（端到端）

前置：MySQL 已啟動；後端以 http profile 執行（`dotnet run --launch-profile http`）並已加上 CORS。

1. `pnpm install` 後 `pnpm dev`，瀏覽 `http://localhost:3000`。
2. 未登入時自動導向 `/login`。
3. 以 `alice@tenant-a.com / Password123!` 登入 → 進入 `/projects`。
4. 建立專案 → 進入專案 → 建立數筆不同狀態的任務。
5. 用狀態篩選只顯示 Todo（驗證 OData `$filter`）、依 DueDate 排序（驗證 `$orderby`）。
6. 編輯 / 刪除任務與專案皆成功。
7. 登出，改以 `bob@tenant-b.com / Password123!` 登入 → 看不到 Alice 的專案（多租戶隔離）。
8. 重新整理頁面仍維持登入（驗證持久化）。

## 8. 風險與注意事項

- 後端 `UseHttpsRedirection`：以 http profile 執行時不會轉址，前端用 `http://localhost:5102` 即可；若改 https profile，前端需改指向 `https://localhost:7277` 並處理自簽憑證。
- 若未在後端設定 CORS，瀏覽器會擋下跨來源請求；README 會標註此前置需求。
- 任務狀態為整數序列化，前端與 OData 名稱間需透過對照表轉換。
