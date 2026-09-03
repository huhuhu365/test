<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const users = ref([])
const form = ref({ username: '', password: '', role: 'user' })
const error = ref('')
const message = ref('')
const saving = ref(false)

// 所有需要身份验证的接口都携带 Bearer Token。
function headers(json = false) {
  return {
    ...(json ? { 'Content-Type': 'application/json' } : {}),
    Authorization: `Bearer ${sessionStorage.getItem('mail-token')}`,
  }
}

async function loadUsers() {
  // 后端返回 403 说明当前账号不是管理者，不能仅靠隐藏按钮保护页面。
  const response = await fetch('/api/users', { headers: headers() })
  if (response.status === 403) return router.replace('/home')
  if (!response.ok) throw new Error('读取账号失败')
  users.value = await response.json()
}

async function createUser() {
  // 密码只在本次请求中发送；后端会使用 scrypt 加盐哈希后再写入数据文件。
  error.value = ''
  message.value = ''
  saving.value = true
  try {
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: headers(true),
      body: JSON.stringify(form.value),
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message)
    users.value.push(data)
    message.value = `账号 ${data.username} 已创建`
    form.value = { username: '', password: '', role: 'user' }
  } catch (createError) {
    error.value = createError.message || '创建失败'
  } finally {
    saving.value = false
  }
}

onMounted(() => loadUsers().catch((loadError) => { error.value = loadError.message }))
</script>

<template>
  <main class="users-page">
    <header class="users-header">
      <div><p>ACCOUNT MANAGEMENT</p><h1>账号管理</h1><span>新增普通登录者或管理者</span></div>
      <button @click="router.push('/home')">← 返回工作台</button>
    </header>

    <div class="users-grid">
      <section class="panel user-form-panel">
        <div class="section-title"><div><span>NEW</span><h2>追加账号</h2></div></div>
        <form class="user-form" @submit.prevent="createUser">
          <label>登录账号<input v-model="form.username" required minlength="3" maxlength="40" placeholder="输入登录账号" /></label>
          <label>初始密码<input v-model="form.password" required minlength="6" type="password" autocomplete="new-password" placeholder="至少 6 位" /></label>
          <label>账号角色<select v-model="form.role"><option value="user">普通登录者</option><option value="admin">管理者</option></select></label>
          <p v-if="error" class="error">{{ error }}</p><p v-if="message" class="ok">{{ message }}</p>
          <button class="primary" :disabled="saving">{{ saving ? '正在创建…' : '创建账号' }}</button>
        </form>
      </section>

      <section class="panel user-list-panel">
        <div class="section-title"><div><span>ALL</span><h2>现有账号</h2></div><p>{{ users.length }} 个</p></div>
        <div class="user-row" v-for="user in users" :key="user.id">
          <div class="user-avatar">{{ user.username.slice(0, 1).toUpperCase() }}</div>
          <div><strong>{{ user.username }}</strong><small>创建于 {{ new Date(user.createdAt).toLocaleString() }}</small></div>
          <span :class="['role-badge', user.role]">{{ user.role === 'admin' ? '管理者' : '普通登录者' }}</span>
        </div>
      </section>
    </div>
  </main>
</template>
