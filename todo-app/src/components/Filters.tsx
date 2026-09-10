import { useI18n } from '../i18n'
import type { Filter } from '../types'

interface FiltersProps {
  value: Filter
  onChange: (filter: Filter) => void
}

export default function Filters({ value, onChange }: FiltersProps) {
  const { t } = useI18n()

  const options: { key: Filter; label: string }[] = [
    { key: 'all', label: t.filterAll },
    { key: 'active', label: t.filterActive },
    { key: 'done', label: t.filterDone },
  ]

  return (
    <div className="filters">
      {options.map((option) => (
        <button
          key={option.key}
          type="button"
          className={value === option.key ? 'active' : ''}
          onClick={() => onChange(option.key)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
