import { useNavigate } from 'react-router-dom'
import { ROLE_LABELS, useAuth } from '../auth.jsx'

export default function Login() {
  const { users, loading, login } = useAuth()
  const navigate = useNavigate()

  const pick = (id) => {
    login(id)
    navigate('/')
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="brand" style={{ marginBottom: 8 }}>
          <span className="brand-mark">权</span>
          <div>
            <div className="brand-title">内部权限申请管理系统</div>
            <div className="brand-sub">请选择您的登录身份（演示环境）</div>
          </div>
        </div>

        {loading && <div className="empty">正在加载用户…</div>}

        <ul className="login-list">
          {users.map((u) => (
            <li key={u.id}>
              <button className="login-user" onClick={() => pick(u.id)}>
                <div>
                  <div className="user-name">{u.name}</div>
                  <div className="user-role">
                    {u.department} · {u.title}
                  </div>
                </div>
                <span className="badge badge-role">{ROLE_LABELS[u.role]}</span>
              </button>
            </li>
          ))}
        </ul>

        <p className="login-hint">
          生产环境应对接行内统一身份认证（4A / AD 域），此登录页仅用于本地演示。
        </p>
      </div>
    </div>
  )
}
