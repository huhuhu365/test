import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api.js'
import { useAuth } from '../auth.jsx'
import { formatDateTime } from '../constants.js'
import { RiskBadge, StatusBadge } from '../components/StatusBadge.jsx'

export default function RequestDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [req, setReq] = useState(null)
  const [system, setSystem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)

  const load = () => {
    setLoading(true)
    api
      .getRequest(id)
      .then(async (r) => {
        setReq(r)
        try {
          setSystem(await api.getSystem(r.systemId))
        } catch {
          setSystem(null)
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [id])

  if (loading) return <div className="page-loading">加载中…</div>
  if (error) return <div className="empty">加载失败：{error}</div>
  if (!req) return <div className="empty">未找到申请单 {id}</div>

  const isApprover = user.role === 'approver' || user.role === 'admin'
  const isOwner = req.applicantId === user.id
  const canDecide = isApprover && req.status === 'pending'
  const canWithdraw = isOwner && req.status === 'pending'
  const canRevoke = isApprover && req.status === 'approved'

  const decide = async (status) => {
    if ((status === 'rejected' || status === 'revoked') && !comment.trim()) {
      setError('驳回或撤销权限时必须填写意见')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const updated = await api.updateRequest(req.id, {
        status,
        approverId: user.id,
        approverName: user.name,
        decidedAt: new Date().toISOString(),
        decisionComment: comment.trim() || (status === 'approved' ? '同意' : ''),
      })
      setReq(updated)
      setComment('')
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  const withdraw = async () => {
    setBusy(true)
    setError(null)
    try {
      const updated = await api.updateRequest(req.id, {
        status: 'revoked',
        decidedAt: new Date().toISOString(),
        decisionComment: '申请人主动撤回',
      })
      setReq(updated)
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="stack">
      <div className="page-head">
        <button className="link" onClick={() => navigate(-1)}>
          ← 返回
        </button>
        <h1>
          申请单 {req.id} <StatusBadge status={req.status} />
        </h1>
      </div>

      <div className="detail-grid">
        <section className="panel">
          <h2>申请信息</h2>
          <dl className="desc">
            <div>
              <dt>申请人</dt>
              <dd>
                {req.applicantName}（{req.department}）
              </dd>
            </div>
            <div>
              <dt>目标系统</dt>
              <dd>
                {req.systemName}
                {system && (
                  <>
                    {' '}
                    <RiskBadge level={system.riskLevel} />
                    <div className="muted">
                      {system.description} · 责任部门：{system.owner}
                    </div>
                  </>
                )}
              </dd>
            </div>
            <div>
              <dt>权限级别</dt>
              <dd>{req.accessLevel}</dd>
            </div>
            <div>
              <dt>使用期限</dt>
              <dd>{req.durationDays} 天</dd>
            </div>
            <div>
              <dt>申请事由</dt>
              <dd className="prewrap">{req.reason}</dd>
            </div>
          </dl>
        </section>

        <section className="panel">
          <h2>审批流程</h2>
          <ol className="timeline">
            <li className="done">
              <div className="tl-title">提交申请</div>
              <div className="tl-meta">
                {req.applicantName} · {formatDateTime(req.createdAt)}
              </div>
            </li>
            <li className={req.status === 'pending' ? 'current' : 'done'}>
              <div className="tl-title">
                部门主管审批
                {req.status === 'pending' && <span className="muted"> · 处理中</span>}
              </div>
              {req.status !== 'pending' && req.decidedAt && (
                <div className="tl-meta">
                  {req.approverName || req.applicantName} · {formatDateTime(req.decidedAt)}
                </div>
              )}
              {req.decisionComment && (
                <div className="tl-comment prewrap">意见：{req.decisionComment}</div>
              )}
            </li>
            <li className={['approved', 'rejected', 'revoked'].includes(req.status) ? 'done' : ''}>
              <div className="tl-title">
                {req.status === 'approved' && '已开通权限'}
                {req.status === 'rejected' && '已驳回'}
                {req.status === 'revoked' && '已撤回 / 已回收'}
                {req.status === 'pending' && '结果'}
              </div>
            </li>
          </ol>

          {(canDecide || canRevoke) && (
            <div className="decision-box">
              <label htmlFor="comment">
                {canDecide ? '审批意见' : '撤销原因'}
                {canDecide ? '（驳回时必填）' : '（必填）'}
              </label>
              <textarea
                id="comment"
                rows="3"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="请填写意见…"
              />
              {error && <div className="form-error">{error}</div>}
              <div className="form-actions">
                {canDecide && (
                  <>
                    <button
                      className="btn btn-danger"
                      disabled={busy}
                      onClick={() => decide('rejected')}
                    >
                      驳回
                    </button>
                    <button
                      className="btn btn-primary"
                      disabled={busy}
                      onClick={() => decide('approved')}
                    >
                      通过
                    </button>
                  </>
                )}
                {canRevoke && (
                  <button
                    className="btn btn-danger"
                    disabled={busy}
                    onClick={() => decide('revoked')}
                  >
                    撤销已开通权限
                  </button>
                )}
              </div>
            </div>
          )}

          {canWithdraw && (
            <div className="decision-box">
              <p className="muted">该申请尚在审批中，你可以撤回。</p>
              <button className="btn btn-ghost" disabled={busy} onClick={withdraw}>
                撤回申请
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
