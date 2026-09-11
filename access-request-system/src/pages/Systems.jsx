import { useEffect, useState } from 'react'
import { api } from '../api.js'
import { RiskBadge } from '../components/StatusBadge.jsx'

const EMPTY = {
  name: '',
  code: '',
  description: '',
  owner: '',
  riskLevel: 'medium',
  accessLevelsText: '只读, 编辑',
  active: true,
}

export default function Systems() {
  const [systems, setSystems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [busy, setBusy] = useState(false)

  const load = () => {
    setLoading(true)
    api
      .listSystems()
      .then(setSystems)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const toggleActive = async (s) => {
    await api.updateSystem(s.id, { active: !s.active })
    load()
  }

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    if (!form.name.trim() || !form.code.trim()) {
      setError('系统名称和编码必填')
      return
    }
    const accessLevels = form.accessLevelsText
      .split(/[,，]/)
      .map((x) => x.trim())
      .filter(Boolean)
    if (!accessLevels.length) {
      setError('至少填写一个权限级别')
      return
    }
    setBusy(true)
    try {
      await api.createSystem({
        id: `sys-${form.code.trim().toLowerCase()}`,
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        description: form.description.trim(),
        owner: form.owner.trim(),
        riskLevel: form.riskLevel,
        accessLevels,
        active: form.active,
      })
      setForm(EMPTY)
      load()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <div className="page-loading">加载中…</div>

  return (
    <div className="stack">
      <div className="page-head">
        <h1>系统目录</h1>
        <p>维护可申请的内部系统清单及其权限级别。</p>
      </div>

      <div className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>系统</th>
              <th>编码</th>
              <th>责任部门</th>
              <th>风险等级</th>
              <th>权限级别</th>
              <th>状态</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {systems.map((s) => (
              <tr key={s.id}>
                <td>
                  {s.name}
                  <div className="muted">{s.description}</div>
                </td>
                <td>{s.code}</td>
                <td>{s.owner}</td>
                <td>
                  <RiskBadge level={s.riskLevel} />
                </td>
                <td>{s.accessLevels.join('、')}</td>
                <td>{s.active ? '启用' : '停用'}</td>
                <td>
                  <button className="link" onClick={() => toggleActive(s)}>
                    {s.active ? '停用' : '启用'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form className="panel form" onSubmit={submit}>
        <h2>新增系统</h2>
        <div className="form-grid">
          <div className="form-row">
            <label>系统名称 *</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="form-row">
            <label>系统编码 *</label>
            <input
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              placeholder="如 CRM"
            />
          </div>
          <div className="form-row">
            <label>责任部门</label>
            <input
              value={form.owner}
              onChange={(e) => setForm({ ...form, owner: e.target.value })}
            />
          </div>
          <div className="form-row">
            <label>风险等级</label>
            <select
              value={form.riskLevel}
              onChange={(e) => setForm({ ...form, riskLevel: e.target.value })}
            >
              <option value="low">低风险</option>
              <option value="medium">中风险</option>
              <option value="high">高风险</option>
            </select>
          </div>
        </div>
        <div className="form-row">
          <label>系统说明</label>
          <input
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <div className="form-row">
          <label>权限级别（逗号分隔）*</label>
          <input
            value={form.accessLevelsText}
            onChange={(e) => setForm({ ...form, accessLevelsText: e.target.value })}
          />
        </div>
        {error && <div className="form-error">{error}</div>}
        <div className="form-actions">
          <button className="btn btn-primary" disabled={busy}>
            {busy ? '保存中…' : '新增系统'}
          </button>
        </div>
      </form>
    </div>
  )
}
