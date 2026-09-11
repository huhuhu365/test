import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './auth.jsx'
import Layout from './components/Layout.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import NewRequest from './pages/NewRequest.jsx'
import MyRequests from './pages/MyRequests.jsx'
import ApprovalQueue from './pages/ApprovalQueue.jsx'
import AllRequests from './pages/AllRequests.jsx'
import RequestDetail from './pages/RequestDetail.jsx'
import Systems from './pages/Systems.jsx'

function Protected({ children, roles }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="page-loading">加载中…</div>
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) {
    return <div className="empty">当前身份（{user.title}）无权访问该页面。</div>
  }
  return children
}

export default function App() {
  const { user, loading } = useAuth()

  return (
    <Routes>
      <Route
        path="/login"
        element={!loading && user ? <Navigate to="/" replace /> : <Login />}
      />
      <Route
        element={
          <Protected>
            <Layout />
          </Protected>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route
          path="/new"
          element={
            <Protected roles={['applicant', 'approver', 'admin']}>
              <NewRequest />
            </Protected>
          }
        />
        <Route path="/my" element={<MyRequests />} />
        <Route
          path="/approvals"
          element={
            <Protected roles={['approver', 'admin']}>
              <ApprovalQueue />
            </Protected>
          }
        />
        <Route
          path="/requests"
          element={
            <Protected roles={['approver', 'admin']}>
              <AllRequests />
            </Protected>
          }
        />
        <Route path="/requests/:id" element={<RequestDetail />} />
        <Route
          path="/systems"
          element={
            <Protected roles={['admin']}>
              <Systems />
            </Protected>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
