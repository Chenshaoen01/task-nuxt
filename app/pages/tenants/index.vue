<script setup lang="ts">
import type { TenantResponse } from '~/types/api'

definePageMeta({ middleware: 'admin' })

const tenantsApi = useTenantsApi()

const tenants = ref<TenantResponse[]>([])
const loading = ref(false)
const error = ref('')

// 新增 / 編輯對話框
const dialog = ref(false)
const editing = ref<TenantResponse | null>(null)
const form = reactive({ name: '' })
const saving = ref(false)

const headers = [
  { title: '公司名稱', key: 'name' },
  { title: '操作', key: 'actions', sortable: false, align: 'end' as const },
]

async function load() {
  loading.value = true
  error.value = ''
  try {
    tenants.value = await tenantsApi.list()
  } catch {
    error.value = '載入公司列表失敗'
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editing.value = null
  form.name = ''
  dialog.value = true
}

function openEdit(tenant: TenantResponse) {
  editing.value = tenant
  form.name = tenant.name
  dialog.value = true
}

async function save() {
  saving.value = true
  try {
    const body = { name: form.name }
    if (editing.value) {
      await tenantsApi.update(editing.value.id, body)
    } else {
      await tenantsApi.create(body)
    }
    dialog.value = false
    await load()
  } catch {
    error.value = '儲存失敗'
  } finally {
    saving.value = false
  }
}

async function remove(tenant: TenantResponse) {
  if (!confirm(`確定刪除公司「${tenant.name}」？`)) return
  try {
    await tenantsApi.remove(tenant.id)
    await load()
  } catch {
    error.value = '無法刪除此專案'
  }
}

onMounted(load)
</script>

<template>
  <div>
    <div class="d-flex align-center mb-4">
      <h1 class="text-h5">公司管理</h1>
      <v-spacer />
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreate">
        新增公司
      </v-btn>
    </div>

    <v-alert v-if="error" type="error" variant="tonal" class="mb-4" density="compact">
      {{ error }}
    </v-alert>

    <v-card>
      <v-data-table
        :headers="headers"
        :items="tenants"
        :loading="loading"
        no-data-text="尚無公司，點右上角新增"
      >
        <template #item.name="{ item }">
          <NuxtLink
            :to="`/tenants/${item.id}/users`"
            class="text-primary text-decoration-none"
          >
            {{ item.name }}
          </NuxtLink>
        </template>
        <template #item.actions="{ item }">
          <v-btn
            icon="mdi-account-group"
            variant="text"
            size="small"
            :to="`/tenants/${item.id}/users`"
            title="查看員工"
          />
          <v-btn icon="mdi-pencil" variant="text" size="small" @click="openEdit(item)" />
          <v-btn icon="mdi-delete" variant="text" size="small" color="error" @click="remove(item)" />
        </template>
      </v-data-table>
    </v-card>

    <v-dialog v-model="dialog" max-width="500">
      <v-card>
        <v-card-title>{{ editing ? '編輯公司' : '新增公司' }}</v-card-title>
        <v-card-text>
          <v-text-field v-model="form.name" label="公司名稱" required />
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
