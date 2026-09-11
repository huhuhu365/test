export const STATUS = {
  pending: { label: '待审批', className: 'badge badge-pending' },
  approved: { label: '已通过', className: 'badge badge-approved' },
  rejected: { label: '已驳回', className: 'badge badge-rejected' },
  revoked: { label: '已撤回', className: 'badge badge-revoked' },
}

export const RISK = {
  high: { label: '高风险', className: 'badge badge-risk-high' },
  medium: { label: '中风险', className: 'badge badge-risk-medium' },
  low: { label: '低风险', className: 'badge badge-risk-low' },
}

export function formatDateTime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(
    d.getMinutes(),
  )}`
}

export function newRequestId() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`
  const rand = Math.floor(Math.random() * 900 + 100)
  return `req-${stamp}-${rand}`
}
