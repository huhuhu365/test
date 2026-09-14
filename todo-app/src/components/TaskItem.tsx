import { useI18n } from '../i18n'
import type { Task } from '../types'

interface TaskItemProps {
  task: Task
  onToggle: (id: number) => void
  onDelete: (id: number) => void
}

export default function TaskItem({ task, onToggle, onDelete }: TaskItemProps) {
  const { t } = useI18n()

  const priorityLabel = {
    high: t.priorityHigh,
    med: t.priorityMed,
    low: t.priorityLow,
  }[task.priority]

  return (
    <li className={task.done ? 'done' : ''}>
      <input
        type="checkbox"
        checked={task.done}
        onChange={() => onToggle(task.id)}
      />
      <span className={`priority-tag priority-${task.priority}`}>{priorityLabel}</span>
      <span className="task-text">{task.text}</span>
      <button
        type="button"
        className="delete-btn"
        title={t.deleteLabel}
        aria-label={t.deleteLabel}
        onClick={() => onDelete(task.id)}
      >
        ✕
      </button>
    </li>
  )
}
