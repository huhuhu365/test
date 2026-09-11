import { useEffect, useMemo, useState } from 'react'
import { api } from '../api.js'
import RequestsTable from '../components/RequestsTable.jsx'

export default function AllRequests() {
  const [rows, setRows] = useState([])
  const [systems, setSystems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [status, setStatus] = useState('all')
  const [systemId, setSystemId] = useState('all')
  const [keyword, setKeyword] = useState('')

  useEffect(() => {
    Promise.all([api.listRequests(), api.listSystems()])
      .then(([r, s]) => {
        setRows(r)
        setSystems(s)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const view = useMemo(() => {
    const kw = keyword.trim().toLowerCase()
    return [...rows]
      .filter((r) => (status === 'all' ? true : r.status === status))
      .filter((r) => (systemId === 'all' ? true : r.systemId === systemId))
      .filter((r) =>
        kw
          ? r.applicantName.toLowerCase().includes(kw) ||
            r.id.toLowerCase().includes(kw) ||
            r.department.toLowerCase().includes(kw)
          : true,
      )
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }, [rows, status, systemId, keyword])

  if (loading) return <div className="page-loading">加载中…</div>
  if (error) return <div className="empty">加载失败：{error}</div>

  return (
    <div className="stack">
      <div className="page-head">
        <h1>全部申请</h1>
        <p>共 {rows.length} 条记录，当前筛选出 {view.length} 条。</p>
      </div>

      <div className="panel filter-panel">
        <div className="field">
          <label>状态</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">全部</option>
            <option value="pending">待审批</option>
            <option value="approved">已通过</option>
            <option value="rejected">已驳回</option>
            <option value="revoked">已撤回</option>
          </select>
        </div>
        <div className="field">
          <label>系统</label>
          <select value={systemId} onChange={(e) => setSystemId(e.target.value)}>
            <option value="all">全部</option>
            {systems.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field field-grow">
          <label>关键字</label>
          <input
            placeholder="申请单号 / 申请人 / 部门"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>
      </div>

      <div className="panel">
        <RequestsTable rows={view} emptyText="没有符合条件的申请" />
      </div>
    </div>
  )
}
