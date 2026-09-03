import { useState } from 'react'
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from 'react-router-dom'
import App from './App.jsx'

const AUTH_KEY = 'react-learning-logged-in'

function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      if (!response.ok) {
        const result = await response.json()
        setError(result.message || '登录失败')
        return
      }

      sessionStorage.setItem(AUTH_KEY, 'true')
      onLogin()
      navigate('/home', { replace: true })
    } catch {
      setError('无法连接后端，请先启动后端服务。')
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-logo">R</div>
        <p className="eyebrow">REACT LEARNING</p>
        <h1>欢迎回来</h1>
        <p className="login-intro">登录后进入 React 学习教程</p>

        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            <span>账号</span>
            <input value={username} onChange={(event) => { setUsername(event.target.value); setError('') }} placeholder="请输入账号" autoComplete="username" autoFocus />
          </label>
          <label>
            <span>密码</span>
            <input type="password" value={password} onChange={(event) => { setPassword(event.target.value); setError('') }} placeholder="请输入密码" autoComplete="current-password" />
          </label>
          {error && <p className="login-error" role="alert">{error}</p>}
          <button type="submit">登录并开始学习</button>
        </form>
        <p className="login-tip">学习账号：admin&nbsp;&nbsp;密码：password</p>
      </section>
    </main>
  )
}

function HomePage({ onLogout }) {
  const navigate = useNavigate()

  function logout() {
    sessionStorage.removeItem(AUTH_KEY)
    onLogout()
    navigate('/', { replace: true })
  }

  return (
    <>
      <header className="home-header">
        <strong>React 学习教程</strong>
        <button onClick={logout}>退出登录</button>
      </header>
      <App />
    </>
  )
}

// 页面和画面迁移统一配置在 Routes 中。
export default function Login() {
  const [loggedIn, setLoggedIn] = useState(
    () => sessionStorage.getItem(AUTH_KEY) === 'true',
  )

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={loggedIn
            ? <Navigate to="/home" replace />
            : <LoginPage onLogin={() => setLoggedIn(true)} />}
        />
        <Route
          path="/home"
          element={loggedIn
            ? <HomePage onLogout={() => setLoggedIn(false)} />
            : <Navigate to="/" replace />}
        />
        <Route
          path="*"
          element={<Navigate to={loggedIn ? '/home' : '/'} replace />}
        />
      </Routes>
    </BrowserRouter>
  )
}
