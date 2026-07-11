<script setup lang="ts">
import type { ProjectResponse } from '~/types/api'

const projectsApi = useProjectsApi()

const projects = ref<ProjectResponse[]>([])
const loading = ref(false)
const error = ref('')

// 新增 / 編輯對話框
const dialog = ref(false)
const editing = ref<ProjectResponse | null>(null)
const form = reactive({ name: '' })
const saving = ref(false)

const headers = [
  { title: '名稱', key: 'name' },
  { title: '操作', key: 'actions', sortable: false, align: 'end' as const },
]

async function load() {
  loading.value = true
  error.value = ''
  try {
    projects.value = await projectsApi.list()
  } catch {
    error.value = '載入專案失敗'
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editing.value = null
  form.name = ''
  dialog.value = true
}

function openEdit(project: ProjectResponse) {
  editing.value = project
  form.name = project.name
  dialog.value = true
}

async function save() {
  saving.value = true
  try {
    const body = { name: form.name }
    if (editing.value) {
      await projectsApi.update(editing.value.id, body)
    } else {
      await projectsApi.create(body)
    }
    dialog.value = false
    await load()
  } catch {
    error.value = '儲存失敗'
  } finally {
    saving.value = false
  }
}

async function remove(project: ProjectResponse) {
  if (!confirm(`確定刪除專案「${project.name}」？`)) return
  try {
    await projectsApi.remove(project.id)
    await load()
  } catch {
    error.value = '刪除失敗'
  }
}

onMounted(load)
</script>

<template>
  <div>
    <div class="d-flex align-center mb-4">
      <h1 class="text-h5">專案</h1>
      <v-spacer />
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreate">
        新增專案
      </v-btn>
    </div>

    <v-alert v-if="error" type="error" variant="tonal" class="mb-4" density="compact">
      {{ error }}
    </v-alert>

    <v-card>
      <v-data-table
        :headers="headers"
        :items="projects"
        :loading="loading"
        no-data-text="尚無專案，點右上角新增"
      >
        <template #item.name="{ item }">
          <NuxtLink :to="`/projects/${item.id}`" class="text-primary text-decoration-none">
            {{ item.name }}
          </NuxtLink>
        </template>
        <template #item.actions="{ item }">
          <v-btn icon="mdi-open-in-new" variant="text" size="small" :to="`/projects/${item.id}`" />
          <v-btn icon="mdi-pencil" variant="text" size="small" @click="openEdit(item)" />
          <v-btn icon="mdi-delete" variant="text" size="small" color="error" @click="remove(item)" />
        </template>
      </v-data-table>
    </v-card>

    <v-dialog v-model="dialog" max-width="500">
      <v-card>
        <v-card-title>{{ editing ? '編輯專案' : '新增專案' }}</v-card-title>
        <v-card-text>
          <v-text-field v-model="form.name" label="名稱" required />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dialog = false">取消</v-btn>
          <v-btn color="primary" :loading="saving" :disabled="!form.name" @click="save">
            儲存
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
