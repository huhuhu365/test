import { createContext, useContext, useEffect, useState } from 'react'

// 简易“登录”：选择一个内部用户身份，保存在 localStorage。
// 生产环境应对接行内统一身份认证（如 4A / AD），此处仅为演示。
const AuthContext = createContext(null)

const STORAGE_KEY = 'ars.currentUserId'

export function AuthProvider({ children }) {
  const [userId, setUserId] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || null
    } catch {
      return null
    }
  })
  const [user, setUser] = useState(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/users')
      .then((r) => r.json())
      .then((list) => {
        setUsers(list)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    setUser(users.find((u) => u.id === userId) || null)
  }, [users, userId])

  const login = (id) => {
    try {
      localStorage.setItem(STORAGE_KEY, id)
    } catch {
      /* ignore */
    }
    setUserId(id)
  }

  const logout = () => {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* ignore */
    }
    setUserId(null)
  }

  return (
    <AuthContext.Provider value={{ user, users, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth 必须在 AuthProvider 内使用')
  return ctx
}

export const ROLE_LABELS = {
  applicant: '申请人',
  approver: '审批人',
  admin: '系统管理员',
}
