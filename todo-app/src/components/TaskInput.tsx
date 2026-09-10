import { useState, type FormEvent } from 'react'
import { useI18n } from '../i18n'

interface TaskInputProps {
  onAdd: (text: string) => void
}

export default function TaskInput({ onAdd }: TaskInputProps) {
  const { t } = useI18n()
  const [value, setValue] = useState('')

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    onAdd(value)
    setValue('')
  }

  return (
    <form className="input-row" onSubmit={handleSubmit}>
      <input
        type="text"
        id="new-task"
        placeholder={t.placeholder}
        autoComplete="off"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <button type="submit" className="add-btn">
        {t.add}
      </button>
    </form>
  )
}
