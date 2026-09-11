import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api.js'
import { useAuth } from '../auth.jsx'
import RequestsTable from '../components/RequestsTable.jsx'

const FILTERS = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待审批' },
  { key: 'approved', label: '已通过' },
  { key: 'rejected', label: '已驳回' },
  { key: 'revoked', label: '已撤回' },
]

export default function MyRequests() {
  const { user } = useAuth()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    api
      .listRequests()
      .then((list) => setRows(list.filter((r) => r.applicantId === user.id)))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [user.id])

  const view = useMemo(() => {
    const sorted = [...rows].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    return filter === 'all' ? sorted : sorted.filter((r) => r.status === filter)
  }, [rows, filter])

  if (loading) return <div className="page-loading">加载中…</div>
  if (error) return <div className="empty">加载失败：{error}</div>

  return (
    <div className="stack">
      <div className="page-head">
        <h1>我的申请</h1>
        <p>共 {rows.length} 条申请记录。</p>
        <Link to="/new" className="btn btn-primary">
          发起申请
        </Link>
      </div>

      <div className="filter-bar">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            className={`chip ${filter === f.key ? 'chip-active' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="panel">
        <RequestsTable rows={view} showApplicant={false} emptyText="没有符合条件的申请" />
      </div>
    </div>
  )
}
