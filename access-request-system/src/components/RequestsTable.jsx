import { Link } from 'react-router-dom'
import { formatDateTime } from '../constants.js'
import { StatusBadge } from './StatusBadge.jsx'

export default function RequestsTable({ rows, showApplicant = true, emptyText = '暂无数据' }) {
  if (!rows.length) return <div className="empty">{emptyText}</div>
  return (
    <table className="table">
      <thead>
        <tr>
          <th>申请单号</th>
          {showApplicant && <th>申请人</th>}
          <th>系统</th>
          <th>权限</th>
          <th>期限</th>
          <th>提交时间</th>
          <th>状态</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.id}>
            <td>
              <Link className="link" to={`/requests/${r.id}`}>
                {r.id}
              </Link>
            </td>
            {showApplicant && (
              <td>
                {r.applicantName}
                <div className="muted">{r.department}</div>
              </td>
            )}
            <td>{r.systemName}</td>
            <td>{r.accessLevel}</td>
            <td>{r.durationDays} 天</td>
            <td>{formatDateTime(r.createdAt)}</td>
            <td>
              <StatusBadge status={r.status} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
