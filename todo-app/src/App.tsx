import { useMemo, useState } from 'react'
import Filters from './components/Filters'
import LanguageSwitch from './components/LanguageSwitch'
import TaskInput from './components/TaskInput'
import TaskList from './components/TaskList'
import { useI18n } from './i18n'
import { useTasks } from './hooks/useTasks'
import type { Filter } from './types'

export default function App() {
  const { t } = useI18n()
  const { tasks, addTask, toggleTask, deleteTask, clearDone } = useTasks()
  const [filter, setFilter] = useState<Filter>('all')

  const visibleTasks = useMemo(() => {
    if (filter === 'active') return tasks.filter((task) => !task.done)
    if (filter === 'done') return tasks.filter((task) => task.done)
    return tasks
  }, [tasks, filter])

  const remaining = tasks.filter((task) => !task.done).length

  return (
    <div className="app">
      <LanguageSwitch />

      <h1>{t.appTitle}</h1>

      <TaskInput onAdd={addTask} />

      <Filters value={filter} onChange={setFilter} />

      <TaskList tasks={visibleTasks} onToggle={toggleTask} onDelete={deleteTask} />

      <div className="footer">
        <span id="count">{t.count(remaining, tasks.length)}</span>
        <button type="button" className="clear-btn" onClick={clearDone}>
          {t.clearDone}
        </button>
      </div>
    </div>
  )
}
