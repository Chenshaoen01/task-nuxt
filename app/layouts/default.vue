<script setup lang="ts">
const auth = useAuthStore()

function onLogout() {
  auth.logout()
  navigateTo('/login')
}
</script>

<template>
  <v-app>
    <v-app-bar color="primary" density="comfortable" flat>
      <v-app-bar-title>
        <NuxtLink to="/projects" class="text-white text-decoration-none">
          TaskNuxt
        </NuxtLink>
      </v-app-bar-title>

      <template v-if="auth.isAuthenticated">
        <v-btn
          v-if="auth.isAdmin"
          variant="text"
          prepend-icon="mdi-office-building-cog"
          to="/tenants"
          class="mr-2"
        >
          公司管理
        </v-btn>

        <v-menu location="bottom end" :close-on-content-click="false">
          <template #activator="{ props }">
            <v-btn variant="text" append-icon="mdi-chevron-down" v-bind="props">
              你好！{{ auth.displayName ?? auth.email }}
            </v-btn>
          </template>

          <v-card min-width="260">
            <v-list density="compact">
              <v-list-item prepend-icon="mdi-account" title="使用者名稱">
                <template #subtitle>{{ auth.displayName ?? '—' }}</template>
              </v-list-item>
              <v-list-item prepend-icon="mdi-email" title="Email">
                <template #subtitle>{{ auth.email ?? '—' }}</template>
              </v-list-item>
              <v-list-item prepend-icon="mdi-domain" title="公司名稱">
                <template #subtitle>{{ auth.tenantName ?? '—' }}</template>
              </v-list-item>
            </v-list>
          </v-card>
        </v-menu>

        <v-btn variant="text" prepend-icon="mdi-logout" class="ml-2" @click="onLogout">
          登出
        </v-btn>
      </template>
    </v-app-bar>

    <v-main>
      <v-container>
        <slot />
      </v-container>
    </v-main>
  </v-app>
</template>
