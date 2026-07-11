<script setup lang="ts">
import type { TenantResponse, UserResponse } from '~/types/api'

definePageMeta({ middleware: 'admin' })

const route = useRoute()
const tenantId = route.params.id as string

const tenantsApi = useTenantsApi()
const usersApi = useUsersApi()

const tenant = ref<TenantResponse | null>(null)
const users = ref<UserResponse[]>([])
const loading = ref(false)
const error = ref('')

// 新增員工對話框
const dialog = ref(false)
const saving = ref(false)
const form = reactive({ name: '', email: '', password: '' })

const headers = [
  { title: '姓名', key: 'name' },
  { title: 'Email', key: 'email' },
  { title: '操作', key: 'actions', sortable: false, align: 'end' as const },
]

async function loadTenant() {
  try {
    tenant.value = await tenantsApi.get(tenantId)
  } catch {
    error.value = '載入公司資訊失敗'
  }
}

async function loadUsers() {
  loading.value = true
  try {
    users.value = await usersApi.listByTenant(tenantId)
  } catch {
    error.value = '載入員工列表失敗'
  } finally {
    loading.value = false
  }
}

function openCreate() {
  form.name = ''
  form.email = ''
  form.password = ''
  error.value = ''
  dialog.value = true
}

async function save() {
  saving.value = true
  try {
    await usersApi.create({
      tenantId,
      name: form.name,
      email: form.email,
      password: form.password,
    })
    dialog.value = false
    await loadUsers()
  } catch (e: unknown) {
    // 後端 Email 重複回 400，body 為錯誤訊息字串
    const data = (e as { data?: unknown })?.data
    error.value = typeof data === 'string' && data ? data : '新增員工失敗'
  } finally {
    saving.value = false
  }
}

async function remove(user: UserResponse) {
  if (!confirm(`確定刪除員工「${user.name}」？`)) return
  try {
    await usersApi.remove(user.id)
    await loadUsers()
  } catch {
    error.value = '刪除員工失敗'
  }
}

onMounted(async () => {
  await loadTenant()
  await loadUsers()
})
</script>

<template>
  <div>
    <v-btn variant="text" prepend-icon="mdi-arrow-left" to="/tenants" class="mb-2">
      返回公司列表
    </v-btn>

    <div class="d-flex align-center mb-4">
      <h1 class="text-h5">{{ tenant?.name ?? '公司' }} — 員工</h1>
      <v-spacer />
      <v-btn color="primary" prepend-icon="mdi-account-plus" @click="openCreate">
        新增員工
      </v-btn>
    </div>

    <v-alert v-if="error" type="error" variant="tonal" class="mb-4" density="compact">
      {{ error }}
    </v-alert>

    <v-card>
      <v-data-table
        :headers="headers"
        :items="users"
        :loading="loading"
        no-data-text="此公司尚無員工"
      >
        <template #item.actions="{ item }">
          <v-btn icon="mdi-delete" variant="text" size="small" color="error" @click="remove(item)" />
        </template>
      </v-data-table>
    </v-card>

    <v-dialog v-model="dialog" max-width="500">
      <v-card>
        <v-card-title>新增員工</v-card-title>
        <v-card-text>
          <v-text-field v-model="form.name" label="姓名" required />
          <v-text-field v-model="form.email" label="Email" type="email" required />
          <v-text-field v-model="form.password" label="密碼" type="password" required />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dialog = false">取消</v-btn>
          <v-btn
            color="primary"
            :loading="saving"
            :disabled="!form.name || !form.email || !form.password"
            @click="save"
          >
            儲存
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
