<script setup lang="ts">
import type { ProjectResponse, TaskResponse } from '~/types/api'
import {
  TaskStatus,
  nextStatus,
  statusColor,
  statusLabel,
  statusOptions,
} from '~/types/api'

const route = useRoute()
const projectId = route.params.id as string

const projectsApi = useProjectsApi()
const tasksApi = useTasksApi()

const project = ref<ProjectResponse | null>(null)
const tasks = ref<TaskResponse[]>([])
const loading = ref(false)
const error = ref('')

// 狀態篩選 / 依截止日排序（由後端 OData $filter/$orderby 處理）
const filterStatus = ref<TaskStatus | null>(null)
const orderDir = ref<'asc' | 'desc'>('asc')
const statusFilterOptions = [
  { title: '全部狀態', value: null },
  ...statusOptions,
]

// 任務新增 / 編輯對話框
const dialog = ref(false)
const editing = ref<TaskResponse | null>(null)
const saving = ref(false)
const form = reactive({
  taskTitle: '',
  description: '',
  dueDate: '' as string,
})

// 狀態切換中的任務 Id（用於按鈕 loading 狀態）
const switchingId = ref<string | null>(null)

const headers = [
  { title: '標題', key: 'taskTitle' },
  { title: '敘述', key: 'description' },
  { title: '狀態', key: 'state' },
  { title: '截止日', key: 'dueDate' },
  { title: '建立時間', key: 'createdAt' },
  { title: '操作', key: 'actions', sortable: false, align: 'end' as const },
]

async function loadProject() {
  try {
    project.value = await projectsApi.get(projectId)
  } catch {
    error.value = '載入專案失敗（可能不存在或非目前租戶）'
  }
}

async function loadTasks() {
  loading.value = true
  try {
    tasks.value = await tasksApi.listByProject(projectId, {
      status: filterStatus.value,
      orderDir: orderDir.value,
    })
  } catch {
    error.value = '載入任務失敗'
  } finally {
    loading.value = false
  }
}

// 切換篩選狀態或排序方向時，重新向後端取得資料
watch([filterStatus, orderDir], loadTasks)

function openCreate() {
  editing.value = null
  form.taskTitle = ''
  form.description = ''
  form.dueDate = ''
  dialog.value = true
}

function openEdit(task: TaskResponse) {
  editing.value = task
  form.taskTitle = task.taskTitle
  form.description = task.description ?? ''
  form.dueDate = task.dueDate ? task.dueDate.slice(0, 10) : ''
  dialog.value = true
}

async function save() {
  // dueDate 對應後端非 nullable DateTime，必填
  if (!form.dueDate) {
    error.value = '請選擇截止日'
    return
  }
  saving.value = true
  try {
    const dueDate = new Date(form.dueDate).toISOString()
    if (editing.value) {
      // TaskItemUpdate：taskTitle / dueDate / state（無 projectId）。
      // 狀態不在此編輯，維持原狀態送出；狀態切換改由列表的「切換狀態」按鈕處理。
      await tasksApi.update(editing.value.id, {
        taskTitle: form.taskTitle,
        description: form.description || null,
        dueDate,
        state: editing.value.state,
      })
    } else {
      // TaskItemCreate：projectId / taskTitle / dueDate（狀態由後端指派）
      await tasksApi.create({
        projectId,
        taskTitle: form.taskTitle,
        description: form.description || null,
        dueDate,
      })
    }
    dialog.value = false
    await loadTasks()
  } catch {
    error.value = '儲存任務失敗'
  } finally {
    saving.value = false
  }
}

// 依後端流轉規則（Todo→Inprogress→Done）將任務切換到下一狀態
async function advanceStatus(task: TaskResponse) {
  const next = nextStatus(task.state)
  if (next === null) return
  switchingId.value = task.id
  try {
    // dueDate / description 已是後端回傳值，原樣送回；僅變更 state
    await tasksApi.update(task.id, {
      taskTitle: task.taskTitle,
      description: task.description,
      dueDate: task.dueDate,
      state: next,
    })
    await loadTasks()
  } catch {
    error.value = '切換狀態失敗'
  } finally {
    switchingId.value = null
  }
}

async function remove(task: TaskResponse) {
  if (!confirm(`確定刪除任務「${task.taskTitle}」？`)) return
  try {
    await tasksApi.remove(task.id)
    await loadTasks()
  } catch {
    error.value = '刪除任務失敗'
  }
}

// 切換按鈕圖示：依「目標狀態」— 進行中用播放、已完成用打勾
function advanceIcon(target: TaskStatus): string {
  return target === TaskStatus.Done ? 'mdi-check-bold' : 'mdi-play'
}

onMounted(async () => {
  await loadProject()
  await loadTasks()
})
</script>

<template>
  <div>
    <v-btn variant="text" prepend-icon="mdi-arrow-left" to="/projects" class="mb-2">
      返回專案列表
    </v-btn>

    <div class="d-flex align-center mb-1">
      <h1 class="text-h5">{{ project?.name ?? '專案' }}</h1>
      <v-spacer />
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreate">
        新增任務
      </v-btn>
    </div>
    <v-alert v-if="error" type="error" variant="tonal" class="mb-4" density="compact">
      {{ error }}
    </v-alert>

    <v-card class="mb-4">
      <v-card-text class="d-flex flex-wrap align-center ga-4">
        <v-select
          v-model="filterStatus"
          :items="statusFilterOptions"
          item-title="title"
          item-value="value"
          label="狀態篩選"
          density="compact"
          hide-details
          style="max-width: 240px"
        />
        <v-btn-toggle v-model="orderDir" density="compact" mandatory variant="outlined">
          <v-btn value="asc" prepend-icon="mdi-sort-calendar-ascending">截止日↑</v-btn>
          <v-btn value="desc" prepend-icon="mdi-sort-calendar-descending">截止日↓</v-btn>
        </v-btn-toggle>
      </v-card-text>
    </v-card>

    <v-card>
      <v-data-table
        :headers="headers"
        :items="tasks"
        :loading="loading"
        no-data-text="此條件下尚無任務"
      >
        <template #item.description="{ item }">
          <span :class="{ 'text-medium-emphasis': !item.description }">
            {{ item.description || '—' }}
          </span>
        </template>
        <template #item.state="{ item }">
          <v-chip :color="statusColor(item.state)" size="small" label>
            {{ statusLabel(item.state) }}
          </v-chip>
        </template>
        <template #item.dueDate="{ item }">
          {{ formatDate(item.dueDate) }}
        </template>
        <template #item.createdAt="{ item }">
          {{ formatDateTime(item.createdAt) }}
        </template>
        <template #item.actions="{ item }">
          <v-btn
            v-if="nextStatus(item.state) !== null"
            :color="statusColor(nextStatus(item.state)!)"
            :loading="switchingId === item.id"
            icon
            variant="text"
            size="small"
            class="me-1"
            @click="advanceStatus(item)"
          >
            <v-icon>{{ advanceIcon(nextStatus(item.state)!) }}</v-icon>
            <v-tooltip activator="parent" location="top">
              切換為{{ statusLabel(nextStatus(item.state)!) }}
            </v-tooltip>
          </v-btn>
          <v-btn icon="mdi-pencil" variant="text" size="small" @click="openEdit(item)" />
          <v-btn icon="mdi-delete" variant="text" size="small" color="error" @click="remove(item)" />
        </template>
      </v-data-table>
    </v-card>

    <v-dialog v-model="dialog" max-width="500">
      <v-card>
        <v-card-title>{{ editing ? '編輯任務' : '新增任務' }}</v-card-title>
        <v-card-text>
          <v-text-field v-model="form.taskTitle" label="標題" required />
          <v-textarea v-model="form.description" label="敘述" rows="3" auto-grow />
          <v-text-field v-model="form.dueDate" label="截止日" type="date" required />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dialog = false">取消</v-btn>
          <v-btn
            color="primary"
            :loading="saving"
            :disabled="!form.taskTitle || !form.dueDate"
            @click="save"
          >
            儲存
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
