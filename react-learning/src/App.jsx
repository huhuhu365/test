import { useEffect, useState } from 'react'

function TaskItem({ task, onToggle, onDelete }) {
  return (
    <li className={task.done ? 'task task--done' : 'task'}>
      <label>
        <input type="checkbox" checked={task.done} onChange={() => onToggle(task)} />
        <span>{task.title}</span>
      </label>
      <button className="delete-button" onClick={() => onDelete(task.id)}>删除</button>
    </li>
  )
}

export default function App() {
  const [tasks, setTasks] = useState([])
  const [title, setTitle] = useState('')
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadTasks() {
      try {
        const response = await fetch('/api/tasks')
        if (!response.ok) throw new Error('读取失败')
        setTasks(await response.json())
      } catch {
        setError('无法读取后端数据，请确认后端服务已启动。')
      } finally {
        setLoading(false)
      }
    }
    loadTasks()
  }, [])

  async function addTask(event) {
    event.preventDefault()
    const cleanTitle = title.trim()
    if (!cleanTitle) return

    const response = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: cleanTitle }),
    })
    if (!response.ok) return setError('添加任务失败。')
    const newTask = await response.json()
    setTasks((current) => [...current, newTask])
    setTitle('')
    setError('')
  }

  async function toggleTask(task) {
    const response = await fetch(`/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ done: !task.done }),
    })
    if (!response.ok) return setError('更新任务失败。')
    const updated = await response.json()
    setTasks((current) => current.map((item) => item.id === updated.id ? updated : item))
  }

  async function deleteTask(id) {
    const response = await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
    if (!response.ok) return setError('删除任务失败。')
    setTasks((current) => current.filter((task) => task.id !== id))
  }

  const visibleTasks = tasks.filter((task) => {
    if (filter === 'todo') return !task.done
    if (filter === 'done') return task.done
    return true
  })
  const completedCount = tasks.filter((task) => task.done).length

  return (
    <main className="page">
      <section className="card">
        <p className="eyebrow">REACT + EXPRESS API</p>
        <h1>我的学习清单</h1>
        <p className="intro">这里的任务来自后端数据文件，所有操作都会保存。</p>

        <form className="add-form" onSubmit={addTask}>
          <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="输入新的学习任务" aria-label="新任务名称" />
          <button type="submit">添加任务</button>
        </form>

        {error && <p className="login-error" role="alert">{error}</p>}

        <div className="toolbar">
          <span>已完成 {completedCount} / {tasks.length}</span>
          <div className="filters">
            {[['all', '全部'], ['todo', '未完成'], ['done', '已完成']].map(([value, label]) => (
              <button key={value} className={filter === value ? 'active' : ''} onClick={() => setFilter(value)}>{label}</button>
            ))}
          </div>
        </div>

        {loading ? (
          <p className="empty">正在读取后端数据…</p>
        ) : visibleTasks.length > 0 ? (
          <ul className="task-list">
            {visibleTasks.map((task) => <TaskItem key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask} />)}
          </ul>
        ) : (
          <p className="empty">当前分类还没有任务。</p>
        )}
      </section>
    </main>
  )
}
