import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api.js'
import { useAuth } from '../auth.jsx'
import { formatDateTime } from '../constants.js'
import { StatusBadge } from '../components/StatusBadge.jsx'

export default function Dashboard() {
  const { user } = useAuth()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    api
      .listRequests()
      .then(setRequests)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const stats = useMemo(() => {
    const mine = requests.filter((r) => r.applicantId === user.id)
    const pendingForMe = requests.filter((r) => r.status === 'pending')
    return {
      total: requests.length,
      pending: requests.filter((r) => r.status === 'pending').length,
      approved: requests.filter((r) => r.status === 'approved').length,
      rejected: requests.filter((r) => r.status === 'rejected').length,
      mineTotal: mine.length,
      minePending: mine.filter((r) => r.status === 'pending').length,
      pendingForMe: pendingForMe.length,
    }
  }, [requests, user.id])

  const recent = useMemo(
    () =>
      [...requests]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 6),
    [requests],
  )

  if (loading) return <div className="page-loading">加载中…</div>
  if (error) return <div className="empty">加载失败：{error}</div>

  const canApprove = user.role === 'approver' || user.role === 'admin'

  return (
    <div className="stack">
      <div className="page-head">
        <h1>工作台</h1>
        <p>你好，{user.name}。以下是当前权限申请概况。</p>
      </div>

      <div className="cards">
        <Link to="/my" className="stat-card">
          <div className="stat-value">{stats.mineTotal}</div>
          <div className="stat-label">我发起的申请</div>
          <div className="stat-foot">{stats.minePending} 项待审批</div>
        </Link>

        {canApprove && (
          <Link to="/approvals" className="stat-card stat-card-accent">
            <div className="stat-value">{stats.pendingForMe}</div>
            <div className="stat-label">待我审批</div>
            <div className="stat-foot">及时处理，避免超时</div>
          </Link>
        )}

        <div className="stat-card">
          <div className="stat-value">{stats.approved}</div>
          <div className="stat-label">累计已通过</div>
          <div className="stat-foot">全行范围</div>
        </div>

        <div className="stat-card">
          <div className="stat-value">{stats.rejected}</div>
          <div className="stat-label">累计已驳回</div>
          <div className="stat-foot">全行范围</div>
        </div>
      </div>

      <section className="panel">
        <div className="panel-head">
          <h2>最近申请</h2>
          {canApprove && <Link to="/requests" className="link">查看全部</Link>}
        </div>
        {recent.length === 0 ? (
          <div className="empty">暂无申请记录</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>申请单号</th>
                <th>申请人</th>
                <th>系统</th>
                <th>权限</th>
                <th>提交时间</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((r) => (
                <tr key={r.id}>
                  <td>
                    <Link className="link" to={`/requests/${r.id}`}>
                      {r.id}
                    </Link>
                  </td>
                  <td>{r.applicantName}</td>
                  <td>{r.systemName}</td>
                  <td>{r.accessLevel}</td>
                  <td>{formatDateTime(r.createdAt)}</td>
                  <td>
                    <StatusBadge status={r.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
