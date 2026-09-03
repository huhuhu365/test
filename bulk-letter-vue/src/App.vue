<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
// 浏览器 API 应在 script 中访问；模板只使用计算结果，避免被 Vue 当成组件属性解析。
const isAdmin = computed(() => sessionStorage.getItem('mail-role') === 'admin')
// 步骤与路由名称双向映射：修改 step 会更新 URL，浏览器后退也会更新 step。
const routeByStep = { 1: 'home', 2: 'recipients', 3: 'preview', 4: 'result' }
const stepByRoute = { home: 1, recipients: 2, preview: 3, result: 4 }
const step = computed({
  get: () => stepByRoute[route.name] || 1,
  set: (value) => router.push({ name: routeByStep[value] || 'home' }),
})
const subject = ref('关于与 {{companyName}} 的合作提案')
const content = ref(`尊敬的 {{companyName}} 团队：

您好！我们希望与贵公司探讨进一步合作的可能性。

如果您愿意了解详情，欢迎回复此邮件与我们联系。

此致
项目团队

如不希望继续收到此类信件，请点击退订：{{unsubscribeUrl}}`)
const recipients = ref([
  { companyName: '星海科技', email: 'contact@xinghai.example.com' },
  { companyName: '青云设计', email: 'hello@qingyun.example.com' },
  { companyName: '远山贸易', email: 'office@yuanshan.example.com' },
])
const selectedIndex = ref(0)
const confirmed = ref(false)
const sending = ref(false)
const result = ref(null)
const error = ref('')
const saveStatus = ref('正在读取…')
let saveTimer
let recipientsReady = false

// 根据请求类型生成认证请求头。GET 不需要 Content-Type，JSON 写入请求才需要。
function authHeaders(json = false) {
  return {
    ...(json ? { 'Content-Type': 'application/json' } : {}),
    Authorization: `Bearer ${sessionStorage.getItem('mail-token')}`,
  }
}

onMounted(async () => {
  // 组件挂载后从后端读取持久化的收件人，替换页面中的示例数据。
  try {
    const response = await fetch('/api/recipients', { headers: authHeaders() })
    if (!response.ok) throw new Error('读取收件人失败')
    recipients.value = await response.json()
    saveStatus.value = '已从后端读取'
  } catch (loadError) {
    error.value = loadError.message
    saveStatus.value = '读取失败'
  } finally {
    window.setTimeout(() => { recipientsReady = true }, 0)
  }
})

watch(recipients, () => {
  // deep: true 会监听数组内部每个输入框的变化。
  // 600ms 防抖避免用户每输入一个字符就写一次后端文件。
  if (!recipientsReady) return
  saveStatus.value = '等待保存…'
  window.clearTimeout(saveTimer)
  saveTimer = window.setTimeout(async () => {
    saveStatus.value = '正在保存…'
    try {
      const response = await fetch('/api/recipients', {
        method: 'PUT',
        headers: authHeaders(true),
        body: JSON.stringify({ recipients: recipients.value }),
      })
      if (!response.ok) throw new Error('保存失败')
      saveStatus.value = '已自动保存'
    } catch {
      saveStatus.value = '自动保存失败'
    }
  }, 600)
}, { deep: true })

const validCount = computed(() => recipients.value.filter((r) => r.companyName && /^\S+@\S+\.\S+$/.test(r.email)).length)
// selected 和 rendered* 都是派生状态，不需要再手动同步一份数据。
const selected = computed(() => recipients.value[selectedIndex.value] || { companyName: '示例公司', email: '' })
const renderedSubject = computed(() => renderVariables(subject.value, selected.value))
const renderedContent = computed(() => renderVariables(content.value, selected.value))

function renderVariables(text, recipient) {
  // 前端替换只用于发送前预览；真正发送时后端会再次替换，不能信任前端结果。
  return text
    .replaceAll('{{companyName}}', recipient.companyName || '示例公司')
    .replaceAll('{{unsubscribeUrl}}', 'https://example.com/unsubscribe/preview')
}

function addRecipient() {
  // 前后端都限制最多 500 条，前端限制改善体验，后端限制保证安全。
  if (recipients.value.length >= 500) return
  recipients.value.push({ companyName: '', email: '' })
}

function removeRecipient(index) {
  recipients.value.splice(index, 1)
  selectedIndex.value = Math.max(0, Math.min(selectedIndex.value, recipients.value.length - 1))
}

function parseCsvLine(line) {
  // 逐字符解析 CSV，确保 "公司,株式会社" 这类带逗号的引号字段不会被错误拆分。
  const values = []
  let value = ''
  let quoted = false
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    if (char === '"' && quoted && line[index + 1] === '"') {
      value += '"'
      index += 1
    } else if (char === '"') {
      quoted = !quoted
    } else if (char === ',' && !quoted) {
      values.push(value.trim())
      value = ''
    } else {
      value += char
    }
  }
  values.push(value.trim())
  return values
}

function csvCell(value) {
  // CSV 中的双引号用两个双引号转义，并统一给字段加引号。
  return `"${String(value ?? '').replaceAll('"', '""')}"`
}

function downloadCsv(rows, filename) {
  // UTF-8 BOM 让 Windows Excel 能够正确识别中文编码。
  const csv = ['companyName,email', ...rows.map((row) => `${csvCell(row.companyName)},${csvCell(row.email)}`)].join('\r\n')
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function exportRecipients() {
  downloadCsv(recipients.value, `recipients-${new Date().toISOString().slice(0, 10)}.csv`)
}

function downloadTemplate() {
  downloadCsv([{ companyName: '示例公司', email: 'contact@example.com' }], 'recipients-template.csv')
}

function importCsv(event) {
  // FileReader 在浏览器本地读取文件，不会先把原始 CSV 上传到服务器。
  const file = event.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    const lines = String(reader.result).replace(/^\uFEFF/, '').split(/\r?\n/).filter(Boolean)
    const start = lines[0]?.toLowerCase().includes('email') ? 1 : 0
    recipients.value = lines.slice(start, start + 500).map((line) => {
      const [companyName = '', email = ''] = parseCsvLine(line)
      return { companyName, email }
    })
    selectedIndex.value = 0
  }
  reader.readAsText(file)
  event.target.value = ''
}

async function sendCampaign() {
  // 后端会再次验证登录、SMTP、授权确认、数量和内容，防止绕过前端校验。
  error.value = ''
  result.value = null
  if (!confirmed.value) return error.value = '请先确认这些联系人已同意接收信件。'
  if (validCount.value !== recipients.value.length || !recipients.value.length) return error.value = '请补全公司名称并检查邮箱格式。'

  sending.value = true
  try {
    const response = await fetch('/api/campaigns/send', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sessionStorage.getItem('mail-token')}` },
      body: JSON.stringify({ subject: subject.value, content: content.value, recipients: recipients.value, confirmed: confirmed.value }),
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message)
    result.value = data
    step.value = 4
  } catch (err) {
    error.value = err.message || '发送失败，请检查后端服务。'
  } finally { sending.value = false }
}
</script>

<template>
  <div class="shell">
    <aside>
      <div class="brand"><span>信</span><div><strong>信达</strong><small>批量信件工作台</small></div></div>
      <nav>
        <button v-for="(label, index) in ['编辑信件', '收件人', '预览确认', '发送结果']" :key="label" :class="{ active: step === index + 1 }" @click="step = index + 1">
          <b>{{ index + 1 }}</b>{{ label }}
        </button>
      </nav>
      <button v-if="isAdmin" class="admin-link" @click="router.push('/users')">账号管理</button>
      <div class="notice">单次最多 500 封<br />仅向已同意接收的联系人发送</div>
    </aside>

    <main>
      <header><div><p>CAMPAIGN BUILDER</p><h1>创建批量信件</h1></div><span class="draft">● 草稿已保存</span></header>

      <section v-if="step === 1" class="panel">
        <div class="section-title"><div><span>01</span><h2>编辑信件内容</h2></div><p>使用 <code v-text="'{{companyName}}'"></code> 插入公司名称变量</p></div>
        <label class="field"><span>邮件主题</span><input v-model="subject" maxlength="120" /></label>
        <label class="field"><span>正文内容</span><textarea v-model="content" rows="14"></textarea></label>
        <div class="variables"><strong>可用变量</strong><code v-text="'{{companyName}}'"></code><code v-text="'{{unsubscribeUrl}}'"></code></div>
        <div class="actions"><span></span><button class="primary" @click="step = 2">下一步：添加收件人 →</button></div>
      </section>

      <section v-else-if="step === 2" class="panel">
        <div class="section-title"><div><span>02</span><h2>添加收件人</h2></div><p>{{ recipients.length }} / 500 条，{{ validCount }} 条有效 · {{ saveStatus }}</p></div>
        <div class="recipient-tools"><label class="upload">导入 CSV<input type="file" accept=".csv,text/csv" @change="importCsv" /></label><button @click="exportRecipients">导出当前 CSV</button><button @click="downloadTemplate">下载 CSV 模板</button><button @click="addRecipient">＋ 添加一行</button><small>CSV 列顺序：companyName,email</small></div>
        <div class="table-wrap"><table><thead><tr><th>#</th><th>公司名称</th><th>邮箱地址</th><th></th></tr></thead><tbody>
          <tr v-for="(recipient, index) in recipients" :key="index"><td>{{ index + 1 }}</td><td><input v-model="recipient.companyName" placeholder="公司名称" /></td><td><input v-model="recipient.email" type="email" placeholder="name@company.com" /></td><td><button class="trash" @click="removeRecipient(index)">删除</button></td></tr>
        </tbody></table></div>
        <div class="actions"><button @click="step = 1">← 上一步</button><button class="primary" @click="step = 3">下一步：预览确认 →</button></div>
      </section>

      <section v-else-if="step === 3" class="panel">
        <div class="section-title"><div><span>03</span><h2>预览与确认</h2></div><p>切换收件人检查变量替换结果</p></div>
        <div class="preview-grid"><div class="preview-list"><button v-for="(r, i) in recipients" :key="i" :class="{ selected: selectedIndex === i }" @click="selectedIndex = i"><strong>{{ r.companyName || '未填写公司' }}</strong><small>{{ r.email }}</small></button></div>
          <article class="letter"><div class="letter-meta"><small>主题</small><strong>{{ renderedSubject }}</strong><small>收件人：{{ selected.email }}</small></div><pre>{{ renderedContent }}</pre></article></div>
        <label class="consent"><input v-model="confirmed" type="checkbox" />我确认以上联系人已同意接收此类信件，并且正文包含有效退订方式。</label>
        <p v-if="error" class="error">{{ error }}</p>
        <div class="actions"><button @click="step = 2">← 上一步</button><button class="primary send" :disabled="sending" @click="sendCampaign">{{ sending ? '正在提交…' : `确认发送 ${recipients.length} 封` }}</button></div>
      </section>

      <section v-else class="panel result"><div class="success">✓</div><p>CAMPAIGN COMPLETE</p><h2>模拟投递完成</h2><p>任务编号：{{ result?.campaignId }}</p><div class="stats"><div><strong>{{ result?.sent || 0 }}</strong><span>发送成功</span></div><div><strong>{{ result?.failed || 0 }}</strong><span>发送失败</span></div></div><button class="primary" @click="step = 1; result = null">创建下一封信件</button></section>
    </main>
  </div>
</template>
