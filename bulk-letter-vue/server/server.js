import express from 'express'
import nodemailer from 'nodemailer'
import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const app = express()
// Map 的键是随机登录令牌，值是该用户当前会话的信息。
// SMTP 密码只存在这里，不会写进 data.json；后端重启或退出登录后立即消失。
const sessions = new Map()
const dataFile = fileURLToPath(new URL('./data.json', import.meta.url))

app.use(express.json({ limit: '2mb' }))

// 这个学习项目用 JSON 文件代替数据库。正式环境可将这两个函数替换为数据库访问层。
async function readData() {
  return JSON.parse(await readFile(dataFile, 'utf8'))
}

async function writeData(data) {
  await writeFile(dataFile, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
}

async function ensureDataFile() {
  try {
    await readFile(dataFile, 'utf8')
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
    await writeData({ users: [], recipientLists: {} })
  }
}

function hashPassword(password, salt = randomBytes(16).toString('hex')) {
  // scrypt 是专门用于密码的慢哈希算法；随机盐可以防止相同密码产生相同结果。
  return { salt, hash: scryptSync(password, salt, 64).toString('hex') }
}

function passwordMatches(password, user) {
  // timingSafeEqual 降低通过比较耗时推测密码哈希的风险。
  const candidate = scryptSync(password, user.salt, 64)
  const stored = Buffer.from(user.passwordHash, 'hex')
  return candidate.length === stored.length && timingSafeEqual(candidate, stored)
}

async function ensureDefaultAdmin() {
  // 首次启动时创建唯一的初始管理者。已经存在时不会覆盖或重置密码。
  const data = await readData()
  data.users ||= []
  if (!data.users.some((user) => user.username === 'wangyonghuang')) {
    const password = hashPassword('password')
    data.users.push({
      id: randomUUID(),
      username: 'wangyonghuang',
      role: 'admin',
      salt: password.salt,
      passwordHash: password.hash,
      createdAt: new Date().toISOString(),
    })
  }

  // 收件人按用户 ID 分区。首次升级时，把旧的全局列表迁移给初始管理者。
  data.recipientLists ||= {}
  const defaultAdmin = data.users.find((user) => user.username === 'wangyonghuang')
  if (defaultAdmin && !Object.hasOwn(data.recipientLists, defaultAdmin.id)) {
    data.recipientLists[defaultAdmin.id] = Array.isArray(data.recipients) ? data.recipients : []
  }
  delete data.recipients
  await writeData(data)
}

function requireLogin(req, res, next) {
  // Express 中间件：先验证 Authorization，再把会话挂到 req 供后续接口使用。
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token || !sessions.has(token)) return res.status(401).json({ message: '请先登录' })
  req.sessionToken = token
  req.session = sessions.get(token)
  next()
}

function requireAdmin(req, res, next) {
  // 角色校验必须在后端进行；前端隐藏“账号管理”按钮并不构成安全保护。
  if (req.session.role !== 'admin') return res.status(403).json({ message: '只有管理者可以执行此操作' })
  next()
}

function createTransport(config) {
  // 465 使用连接即加密的 SMTPS；587 通常先连接再升级为 STARTTLS。
  return nodemailer.createTransport({
    host: config.host,
    port: Number(config.port),
    secure: Number(config.port) === 465,
    auth: { user: config.username, pass: config.password },
  })
}

function escapeHtml(value) {
  // 用户可编辑邮件正文，因此生成 HTML 前需要转义，避免插入任意 HTML/脚本。
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;')
}

function renderMessage(template, recipient, unsubscribeUrl) {
  // 同时生成纯文本和 HTML 两个版本，让不同邮件客户端都能正常显示。
  const text = template.replaceAll('{{companyName}}', recipient.companyName)
    .replaceAll('{{unsubscribeUrl}}', unsubscribeUrl)
  const html = escapeHtml(template)
    .replaceAll('{{companyName}}', escapeHtml(recipient.companyName))
    .replaceAll('{{unsubscribeUrl}}', `<a href="${escapeHtml(unsubscribeUrl)}" style="color:#176b52;text-decoration:underline">点击退订</a>`)
    .replaceAll('\n', '<br>')
  return { text, html }
}

app.post('/api/login', async (req, res, next) => {
  // 登录成功只返回随机令牌，不把密码哈希、盐或 SMTP 配置发送给浏览器。
  try {
    const data = await readData()
    const user = (data.users || []).find((item) => item.username === req.body.username)
    if (!user || !passwordMatches(String(req.body.password || ''), user)) {
      return res.status(401).json({ message: '账号或密码错误' })
    }
    const token = randomUUID()
    sessions.set(token, { userId: user.id, username: user.username, role: user.role, smtpConfig: null })
    res.json({ token, username: user.username, role: user.role, configured: false })
  } catch (error) { next(error) }
})

app.post('/api/logout', requireLogin, (req, res) => {
  sessions.delete(req.sessionToken)
  res.status(204).end()
})

app.get('/api/session', requireLogin, (req, res) => {
  res.json({ username: req.session.username, role: req.session.role, configured: Boolean(req.session.smtpConfig) })
})

app.get('/api/users', requireLogin, requireAdmin, async (_req, res, next) => {
  // 解构排除敏感字段，管理员列表也不应拿到密码哈希和盐。
  try {
    const data = await readData()
    res.json((data.users || []).map(({ passwordHash, salt, ...user }) => user))
  } catch (error) { next(error) }
})

app.post('/api/users', requireLogin, requireAdmin, async (req, res, next) => {
  // 创建账号需要同时通过 requireLogin 和 requireAdmin 两层中间件。
  try {
    const username = String(req.body.username || '').trim()
    const passwordText = String(req.body.password || '')
    const role = req.body.role === 'admin' ? 'admin' : 'user'
    if (!/^[A-Za-z0-9_.-]{3,40}$/.test(username)) {
      return res.status(400).json({ message: '账号需为 3–40 位字母、数字、点、横线或下划线' })
    }
    if (passwordText.length < 6) return res.status(400).json({ message: '密码至少需要 6 位' })
    const data = await readData()
    data.users ||= []
    if (data.users.some((user) => user.username.toLowerCase() === username.toLowerCase())) {
      return res.status(409).json({ message: '该账号已经存在' })
    }
    const password = hashPassword(passwordText)
    const user = { id: randomUUID(), username, role, salt: password.salt, passwordHash: password.hash, createdAt: new Date().toISOString() }
    data.users.push(user)
    await writeData(data)
    res.status(201).json({ id: user.id, username, role, createdAt: user.createdAt })
  } catch (error) { next(error) }
})

app.get('/api/smtp/status', requireLogin, (req, res) => {
  res.json({ configured: Boolean(req.session.smtpConfig), fromEmail: req.session.smtpConfig?.fromEmail || '' })
})

app.post('/api/smtp/test', requireLogin, async (req, res, next) => {
  // verify() 只测试服务器连接和认证，不发送邮件；成功后才把配置放进当前会话。
  try {
    const config = req.body
    if (!config.host || !config.port || !config.username || !config.password || !config.fromEmail) {
      return res.status(400).json({ message: '请填写完整的 SMTP 设置' })
    }
    await createTransport(config).verify()
    req.session.smtpConfig = { ...config }
    res.json({ success: true, message: 'SMTP 连接成功，设置已在当前登录会话中保存' })
  } catch (error) { error.statusCode = 400; next(error) }
})

app.get('/api/recipients', requireLogin, async (req, res, next) => {
  try {
    const data = await readData()
    res.json(data.recipientLists?.[req.session.userId] || [])
  } catch (error) { next(error) }
})

app.put('/api/recipients', requireLogin, async (req, res, next) => {
  // 即使前端已经限制数量，后端仍重新校验，避免直接调用 API 绕过限制。
  try {
    const recipients = req.body.recipients
    if (!Array.isArray(recipients) || recipients.length > 500) return res.status(400).json({ message: '收件人不能超过 500 条' })
    const data = await readData()
    data.recipientLists ||= {}
    data.recipientLists[req.session.userId] = recipients.map((item) => ({ companyName: String(item.companyName || '').slice(0, 200), email: String(item.email || '').slice(0, 320) }))
    await writeData(data)
    res.json({ saved: data.recipientLists[req.session.userId].length })
  } catch (error) { next(error) }
})

app.post('/api/campaigns/send', requireLogin, async (req, res, next) => {
  // 必须使用当前登录会话自己的 SMTP 配置，其他登录者无法共享发件密码。
  try {
    const smtpConfig = req.session.smtpConfig
    if (!smtpConfig) return res.status(400).json({ message: '请先配置并测试 SMTP' })
    const { subject, content, recipients, confirmed } = req.body
    if (!confirmed) return res.status(400).json({ message: '请确认收件人已同意接收信件' })
    if (!subject?.trim() || !content?.trim()) return res.status(400).json({ message: '主题和正文不能为空' })
    if (!Array.isArray(recipients) || !recipients.length || recipients.length > 500) return res.status(400).json({ message: '收件人数量必须在 1 到 500 之间' })
    const transporter = createTransport(smtpConfig)
    const results = []
    // 顺序发送可以避免瞬间创建 500 个 SMTP 请求；实际服务仍受提供商额度限制。
    for (const recipient of recipients) {
      try {
        const unsubscribeUrl = `mailto:${smtpConfig.fromEmail}?subject=${encodeURIComponent('退订')}`
        const message = renderMessage(content, recipient, unsubscribeUrl)
        await transporter.sendMail({
          from: { name: smtpConfig.fromName || '信达工作台', address: smtpConfig.fromEmail },
          to: recipient.email,
          subject: subject.replaceAll('{{companyName}}', recipient.companyName),
          text: message.text,
          html: message.html,
          headers: { 'List-Unsubscribe': `<${unsubscribeUrl}>` },
        })
        results.push({ ...recipient, status: 'sent' })
      } catch (error) { results.push({ ...recipient, status: 'failed', message: error.message }) }
    }
    res.json({ campaignId: `CMP-${Date.now()}`, sent: results.filter((item) => item.status === 'sent').length, failed: results.filter((item) => item.status === 'failed').length, results })
  } catch (error) { next(error) }
})

app.use((error, _req, res, _next) => {
  // 统一错误出口保证前端始终收到 JSON，不会再次出现把 HTML 当 JSON 解析的问题。
  console.error(error)
  res.status(error.statusCode || 500).json({ message: error.message || '服务器发生错误' })
})

// 首次从 GitHub 下载项目时 data.json 不存在，先自动创建，再初始化管理员。
await ensureDataFile()
// 顶层 await 确保管理员初始化完成以后才开始监听端口，避免启动瞬间登录失败。
await ensureDefaultAdmin()
app.listen(3002, () => console.log('批量信件 API：http://localhost:3002'))
