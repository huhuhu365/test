import express from 'express'
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const app = express()
const port = 3001
const dataFile = fileURLToPath(new URL('./data.json', import.meta.url))

app.use(express.json())

async function readData() {
  return JSON.parse(await readFile(dataFile, 'utf8'))
}

async function writeData(data) {
  await writeFile(dataFile, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
}

app.post('/api/login', (request, response) => {
  const { username, password } = request.body
  if (username === 'admin' && password === 'password') {
    return response.json({ success: true, user: { username } })
  }
  response.status(401).json({ success: false, message: '账号或密码错误' })
})

app.get('/api/tasks', async (_request, response) => {
  const data = await readData()
  response.json(data.tasks)
})

app.post('/api/tasks', async (request, response) => {
  const title = String(request.body.title ?? '').trim()
  if (!title) return response.status(400).json({ message: '任务名称不能为空' })
  const data = await readData()
  const task = { id: Date.now(), title, done: false }
  data.tasks.push(task)
  await writeData(data)
  response.status(201).json(task)
})

app.patch('/api/tasks/:id', async (request, response) => {
  const data = await readData()
  const task = data.tasks.find((item) => String(item.id) === request.params.id)
  if (!task) return response.status(404).json({ message: '任务不存在' })
  task.done = Boolean(request.body.done)
  await writeData(data)
  response.json(task)
})

app.delete('/api/tasks/:id', async (request, response) => {
  const data = await readData()
  const nextTasks = data.tasks.filter((item) => String(item.id) !== request.params.id)
  if (nextTasks.length === data.tasks.length) return response.status(404).json({ message: '任务不存在' })
  data.tasks = nextTasks
  await writeData(data)
  response.status(204).end()
})

app.use((error, _request, response, _next) => {
  console.error(error)
  response.status(500).json({ message: '服务器发生错误' })
})

app.listen(port, () => {
  console.log(`后端 API 已启动：http://localhost:${port}`)
})
