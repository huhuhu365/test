import { useState, type FormEvent } from 'react'
import { useI18n } from '../i18n'
import type { Priority } from '../types'

interface TaskInputProps {
  onAdd: (text: string, priority: Priority) => void
}

const PRIORITIES: Priority[] = ['high', 'med', 'low']

export default function TaskInput({ onAdd }: TaskInputProps) {
  const { t } = useI18n()
  const [value, setValue] = useState('')
  const [priority, setPriority] = useState<Priority>('med')

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    onAdd(value, priority)
    setValue('')
  }

  const priorityLabel: Record<Priority, string> = {
    high: t.priorityHigh,
    med: t.priorityMed,
    low: t.priorityLow,
  }

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <input
        type="text"
        id="new-task"
        placeholder={t.placeholder}
        autoComplete="off"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />

      <div className="priority-row" role="group" aria-label="priority">
        {PRIORITIES.map((option) => (
          <button
            key={option}
            type="button"
            className={`priority-btn priority-${option} ${priority === option ? 'active' : ''}`}
            aria-pressed={priority === option}
            onClick={() => setPriority(option)}
          >
            {priorityLabel[option]}
          </button>
        ))}
      </div>

      <button type="submit" className="add-btn">
        {t.add}
      </button>
    </form>
  )
}
