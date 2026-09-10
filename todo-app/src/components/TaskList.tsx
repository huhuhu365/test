import { useI18n } from '../i18n'
import type { Task } from '../types'
import TaskItem from './TaskItem'

interface TaskListProps {
  tasks: Task[]
  onToggle: (id: number) => void
  onDelete: (id: number) => void
}

export default function TaskList({ tasks, onToggle, onDelete }: TaskListProps) {
  const { t } = useI18n()

  if (tasks.length === 0) {
    return (
      <ul id="task-list">
        <li className="empty">{t.empty}</li>
      </ul>
    )
  }

  return (
    <ul id="task-list">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onToggle={onToggle}
          onDelete={onDelete}
        />
      ))}
    </ul>
  )
}
