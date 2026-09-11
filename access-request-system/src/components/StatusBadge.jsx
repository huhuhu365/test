import { RISK, STATUS } from '../constants.js'

export function StatusBadge({ status }) {
  const s = STATUS[status] || { label: status, className: 'badge' }
  return <span className={s.className}>{s.label}</span>
}

export function RiskBadge({ level }) {
  const r = RISK[level] || { label: level, className: 'badge' }
  return <span className={r.className}>{r.label}</span>
}
