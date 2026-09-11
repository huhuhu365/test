import { useEffect, useMemo, useState } from 'react'
import { api } from '../api.js'
import RequestsTable from '../components/RequestsTable.jsx'

export default function ApprovalQueue() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    api
      .listRequests()
      .then((list) => setRows(list.filter((r) => r.status === 'pending')))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const view = useMemo(
    () => [...rows].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
    [rows],
  )

  if (loading) return <div className="page-loading">加载中…</div>
  if (error) return <div className="empty">加载失败：{error}</div>

  return (
    <div className="stack">
      <div className="page-head">
        <h1>待我审批</h1>
        <p>共 {rows.length} 条待处理申请，按提交时间先后排列。点击单号进入详情审批。</p>
      </div>
      <div className="panel">
        <RequestsTable rows={view} emptyText="太好了，没有待审批的申请。" />
      </div>
    </div>
  )
}
