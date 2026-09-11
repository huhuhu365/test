import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { ROLE_LABELS, useAuth } from '../auth.jsx'

const NAV = [
  { to: '/', label: '工作台', end: true, roles: ['applicant', 'approver', 'admin'] },
  { to: '/new', label: '发起申请', roles: ['applicant', 'approver', 'admin'] },
  { to: '/my', label: '我的申请', roles: ['applicant', 'approver', 'admin'] },
  { to: '/approvals', label: '待我审批', roles: ['approver', 'admin'] },
  { to: '/requests', label: '全部申请', roles: ['approver', 'admin'] },
  { to: '/systems', label: '系统目录', roles: ['admin'] },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">权</span>
          <div>
            <div className="brand-title">权限申请管理</div>
            <div className="brand-sub">内部系统访问审批</div>
          </div>
        </div>
        <nav>
          {NAV.filter((item) => item.roles.includes(user.role)).map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className="nav-link">
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="main">
        <header className="topbar">
          <div />
          <div className="user-box">
            <div className="user-meta">
              <div className="user-name">{user.name}</div>
              <div className="user-role">
                {user.department} · {ROLE_LABELS[user.role]}
              </div>
            </div>
            <button className="btn btn-ghost" onClick={handleLogout}>
              切换身份
            </button>
          </div>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
