import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api.js'
import { useAuth } from '../auth.jsx'
import { newRequestId } from '../constants.js'
import { RiskBadge } from '../components/StatusBadge.jsx'

export default function NewRequest() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [systems, setSystems] = useState([])
  const [form, setForm] = useState({
    systemId: '',
    accessLevel: '',
    durationDays: 180,
    reason: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    api
      .listSystems()
      .then((list) => setSystems(list.filter((s) => s.active)))
      .catch((e) => setError(e.message))
  }, [])

  const selected = useMemo(
    () => systems.find((s) => s.id === form.systemId) || null,
    [systems, form.systemId],
  )

  const update = (patch) => setForm((f) => ({ ...f, ...patch }))

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    if (!form.systemId) return setError('请选择目标系统')
    if (!form.accessLevel) return setError('请选择权限级别')
    if (!form.reason.trim()) return setError('请填写申请事由')
    if (!form.durationDays || form.durationDays < 1) return setError('请填写有效的使用期限')

    setSubmitting(true)
    try {
      const payload = {
        id: newRequestId(),
        applicantId: user.id,
        applicantName: user.name,
        department: user.department,
        systemId: selected.id,
        systemName: selected.name,
        accessLevel: form.accessLevel,
        reason: form.reason.trim(),
        durationDays: Number(form.durationDays),
        status: 'pending',
        createdAt: new Date().toISOString(),
        decidedAt: null,
        approverId: null,
        approverName: null,
        decisionComment: null,
      }
      const created = await api.createRequest(payload)
      navigate(`/requests/${created.id}`)
    } catch (e) {
      setError(e.message)
      setSubmitting(false)
    }
  }

  return (
    <div className="stack">
      <div className="page-head">
        <h1>发起权限申请</h1>
        <p>申请提交后进入部门主管审批环节。</p>
      </div>

      <form className="panel form" onSubmit={submit}>
        <div className="form-row">
          <label>申请人</label>
          <div className="form-static">
            {user.name}（{user.department} · {user.title}）
          </div>
        </div>

        <div className="form-row">
          <label htmlFor="systemId">目标系统 *</label>
          <select
            id="systemId"
            value={form.systemId}
            onChange={(e) => update({ systemId: e.target.value, accessLevel: '' })}
          >
            <option value="">请选择</option>
            {systems.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}（{s.code}）
              </option>
            ))}
          </select>
          {selected && (
            <div className="form-hint">
              <RiskBadge level={selected.riskLevel} /> {selected.description}，系统责任部门：
              {selected.owner}
            </div>
          )}
        </div>

        <div className="form-row">
          <label htmlFor="accessLevel">权限级别 *</label>
          <select
            id="accessLevel"
            value={form.accessLevel}
            onChange={(e) => update({ accessLevel: e.target.value })}
            disabled={!selected}
          >
            <option value="">{selected ? '请选择' : '请先选择系统'}</option>
            {selected?.accessLevels.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>

        <div className="form-row">
          <label htmlFor="durationDays">使用期限（天）*</label>
          <input
            id="durationDays"
            type="number"
            min="1"
            max="1095"
            value={form.durationDays}
            onChange={(e) => update({ durationDays: e.target.value })}
          />
          <div className="form-hint">到期后权限自动回收，如需继续使用请重新申请。</div>
        </div>

        <div className="form-row">
          <label htmlFor="reason">申请事由 *</label>
          <textarea
            id="reason"
            rows="4"
            placeholder="请说明岗位职责与业务场景，便于审批人判断权限必要性。"
            value={form.reason}
            onChange={(e) => update({ reason: e.target.value })}
          />
        </div>

        {error && <div className="form-error">{error}</div>}

        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>
            取消
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? '提交中…' : '提交申请'}
          </button>
        </div>
      </form>
    </div>
  )
}
