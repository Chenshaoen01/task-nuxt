<script setup lang="ts">
const auth = useAuthStore()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

const testAccounts = [
  { label: 'Admin User', email: 'adminuser@admin.com', password: '123456' },
]

function fillAccount(account: { email: string; password: string }) {
  email.value = account.email
  password.value = account.password
}

async function onSubmit() {
  error.value = ''
  loading.value = true
  try {
    await auth.login(email.value, password.value)
    await navigateTo('/projects')
  } catch (e: unknown) {
    // 後端帳密錯誤回 400/401（有 HTTP 狀態碼）；無狀態碼代表連不上後端
    const status = (e as { response?: { status?: number } })?.response?.status
    error.value = status ? '帳號或密碼錯誤' : '登入失敗，請確認後端是否啟動'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <v-row justify="center" class="mt-8">
    <v-col cols="12" sm="8" md="5" lg="4">
      <v-card>
        <v-card-title class="text-h6">登入 TaskNuxt</v-card-title>
        <v-card-text>
          <v-alert
            v-if="error"
            type="error"
            variant="tonal"
            class="mb-4"
            density="compact"
          >
            {{ error }}
          </v-alert>

          <v-form @submit.prevent="onSubmit">
            <v-text-field
              v-model="email"
              label="Email"
              type="email"
              prepend-inner-icon="mdi-email"
              required
            />
            <v-text-field
              v-model="password"
              label="密碼"
              type="password"
              prepend-inner-icon="mdi-lock"
              required
            />
            <v-btn
              type="submit"
              color="primary"
              block
              :loading="loading"
              class="mt-2"
            >
              登入
            </v-btn>
          </v-form>

          <div class="mt-4">
            <div class="text-caption text-medium-emphasis mb-1">快速填入測試帳號：</div>
            <v-btn
              v-for="acc in testAccounts"
              :key="acc.email"
              size="small"
              variant="outlined"
              class="mr-2 mb-2"
              @click="fillAccount(acc)"
            >
              {{ acc.label }}
            </v-btn>
          </div>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>
