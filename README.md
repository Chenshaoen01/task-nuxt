# TaskNuxt

`TaskApi`（ASP.NET Core 多租戶任務管理 API）的前端，使用 **Nuxt 4 + Vue 3 + Vuetify 3 + Pinia**。

提供登入、專案 CRUD、任務 CRUD，以及以 OData 篩選 / 排序任務，並驗證多租戶資料隔離。

## 技術

- Nuxt 4（SPA 模式 `ssr: false`）
- Vuetify（`vuetify-nuxt-module`）+ Material Design Icons
- Pinia + `pinia-plugin-persistedstate`（JWT 持久化於 localStorage）

## 前置需求

1. **後端 API 已啟動**：在 `TaskApi` 以 http profile 執行（MySQL 需先啟動）：
   ```bash
   dotnet run --launch-profile http
   ```
   API 預設位於 `http://localhost:5102`。

2. **後端需設定 CORS**：前端開發伺服器為 `http://localhost:3000`，請在 `TaskApi/Program.cs` 加入：
   ```csharp
   builder.Services.AddCors(o => o.AddPolicy("frontend", p =>
       p.WithOrigins("http://localhost:3000").AllowAnyHeader().AllowAnyMethod()));

   // 置於 app.UseAuthentication(); 之前
   app.UseCors("frontend");
   ```

## 安裝與啟動

```bash
pnpm install
pnpm dev
```

開啟 `http://localhost:3000`。

> API 位址可由環境變數覆寫：`NUXT_PUBLIC_API_BASE=http://localhost:5102`

## 測試帳號

| 帳號 | 租戶 | 密碼 |
| --- | --- | --- |
| `alice@tenant-a.com` | A | `Password123!` |
| `bob@tenant-b.com` | B | `Password123!` |

## 驗收流程

1. 未登入時自動導向 `/login`。
2. 以 Alice 登入 → 進入 `/projects`。
3. 建立專案 → 進入專案 → 建立數筆不同狀態的任務。
4. 用狀態下拉只顯示 `Todo`（OData `$filter`）、用截止日按鈕切換排序（OData `$orderby`）。
5. 編輯 / 刪除任務與專案。
6. 登出，改以 Bob 登入 → 看不到 Alice 的專案（多租戶隔離）。
7. 重新整理頁面仍維持登入（持久化）。

## 專案結構

```text
app/
  app.vue                    # NuxtLayout + NuxtPage
  types/api.ts               # API 型別與任務狀態對照（整數 ↔ 名稱）
  stores/auth.ts             # Pinia auth store（持久化）
  composables/useApi.ts      # $fetch 封裝：注入 Bearer、401 導回登入、OData query
  middleware/auth.global.ts  # 路由守衛
  plugins/persistedstate.client.ts  # 註冊持久化外掛
  layouts/default.vue        # App bar + 登出
  pages/
    index.vue                # 轉址 /projects
    login.vue                # 登入
    projects/index.vue       # 專案列表 + CRUD
    projects/[id].vue        # 專案詳情 + 任務（OData 篩選/排序 + CRUD）
document/task-nuxt-plan.md   # 實作計畫
```
