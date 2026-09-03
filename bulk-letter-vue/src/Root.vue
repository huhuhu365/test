<script setup>
import { onMounted, ref } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route = useRoute()

// sessionStorage 只在当前浏览器标签页会话中有效；关闭标签页后不会长期保存令牌。
// 注意：前端保存的 role 只用于控制显示，真正权限仍由后端验证。
const token = ref(sessionStorage.getItem('mail-token') || '')
const configured = ref(sessionStorage.getItem('smtp-configured') === 'true')
const role = ref(sessionStorage.getItem('mail-role') || '')
const username = ref('wangyonghuang')
const password = ref('')
const loginError = ref('')
const saving = ref(false)
const smtpMessage = ref('')
const smtpError = ref('')
const smtp = ref({ host: '', port: 465, username: '', password: '', fromEmail: '', fromName: '信达工作台' })

function clearLocalSession() {
  // 只删除本项目使用的键，避免误删同域名下其他页面的 sessionStorage。
  sessionStorage.removeItem('mail-token')
  sessionStorage.removeItem('smtp-configured')
  sessionStorage.removeItem('mail-role')
  token.value = ''
  configured.value = false
  role.value = ''
}

onMounted(async () => {
  // 页面刷新后，不能只相信浏览器残留的登录状态，必须向后端再次确认令牌是否有效。
  if (!token.value) return
  try {
    const response = await fetch('/api/session', {
      headers: { Authorization: `Bearer ${token.value}` },
    })
    if (!response.ok) return clearLocalSession()
    const status = await response.json()
    configured.value = status.configured
    role.value = status.role
    sessionStorage.setItem('smtp-configured', String(status.configured))
    sessionStorage.setItem('mail-role', status.role)
  } catch {
    clearLocalSession()
  }
})

async function login() {
  // 登录成功后，后端返回随机会话令牌和用户角色；前端不保存用户密码。
  loginError.value = ''
  try {
    const response = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: username.value, password: password.value }) })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message)
    token.value = data.token
    configured.value = data.configured
    role.value = data.role
    sessionStorage.setItem('mail-token', data.token)
    sessionStorage.setItem('smtp-configured', String(data.configured))
    sessionStorage.setItem('mail-role', data.role)
    router.replace('/home')
  } catch (error) { loginError.value = error.message || '无法连接后端服务' }
}

async function testSmtp() {
  // SMTP 密码通过 HTTPS/本地请求交给后端测试，只保存在后端当前会话的内存中。
  saving.value = true; smtpError.value = ''; smtpMessage.value = ''
  try {
    const response = await fetch('/api/smtp/test', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token.value}` }, body: JSON.stringify(smtp.value) })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message)
    configured.value = true
    sessionStorage.setItem('smtp-configured', 'true')
    smtpMessage.value = data.message
  } catch (error) { smtpError.value = `连接失败：${error.message}` } finally { saving.value = false }
}

async function logout() {
  // 先通知后端销毁会话（包括 SMTP 密码），再清理浏览器状态。
  await fetch('/api/logout', { method: 'POST', headers: { Authorization: `Bearer ${token.value}` } }).catch(() => {})
  clearLocalSession()
}
</script>

<template>
  <main v-if="!token" class="auth-page"><form class="auth-card" @submit.prevent="login">
    <div class="auth-mark">信</div><p class="auth-kicker">XINDA MAIL</p><h1>管理员登录</h1><p class="auth-sub">登录后配置发件邮箱并管理批量信件</p>
    <label>账号<input v-model="username" autocomplete="username" /></label><label>密码<input v-model="password" type="password" autocomplete="current-password" placeholder="请输入密码" /></label>
    <p v-if="loginError" class="error">{{ loginError }}</p><button class="primary auth-submit">登录工作台</button><small>管理者账号：wangyonghuang / password</small>
  </form></main>

  <main v-else-if="!configured && route.name !== 'users'" class="auth-page"><form class="auth-card smtp-card" @submit.prevent="testSmtp">
    <div class="settings-head"><div><p class="auth-kicker">SENDER SETTINGS</p><h1>连接发件邮箱</h1></div><div><button v-if="role === 'admin'" type="button" @click="router.push('/users')">账号管理</button><button type="button" @click="logout">退出</button></div></div>
    <p class="auth-sub">填写服务商的 SMTP 信息。密码应使用应用密码或授权码，不要使用网页登录密码。</p>
    <div class="form-grid"><label>SMTP 主机<input v-model="smtp.host" placeholder="smtp.example.com" /></label><label>端口<input v-model.number="smtp.port" type="number" placeholder="465" /></label></div>
    <label>SMTP 用户名<input v-model="smtp.username" placeholder="通常是完整邮箱地址" /></label><label>SMTP 应用密码 / 授权码<input v-model="smtp.password" type="password" autocomplete="new-password" /></label>
    <div class="form-grid"><label>发件邮箱<input v-model="smtp.fromEmail" type="email" /></label><label>发件人名称<input v-model="smtp.fromName" /></label></div>
    <p v-if="smtpError" class="error">{{ smtpError }}</p><p v-if="smtpMessage" class="ok">{{ smtpMessage }}</p><button class="primary auth-submit" :disabled="saving">{{ saving ? '正在测试连接…' : '测试并保存连接' }}</button><small>设置只保存在后端内存中，重启后需要重新填写。</small>
  </form></main>

  <div v-else><button class="floating-logout" @click="logout">退出登录</button><RouterView /></div>
</template>
