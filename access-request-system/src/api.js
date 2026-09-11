// 统一的接口封装，所有请求走 Vite 代理 /api -> json-server(3005)
const BASE = '/api'

async function http(path, options = {}) {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`请求失败 ${res.status} ${res.statusText} ${text}`)
  }
  if (res.status === 204) return null
  return res.json()
}

export const api = {
  // 用户
  listUsers: () => http('/users'),

  // 系统目录
  listSystems: () => http('/systems'),
  getSystem: (id) => http(`/systems/${id}`),
  createSystem: (data) => http('/systems', { method: 'POST', body: JSON.stringify(data) }),
  updateSystem: (id, patch) =>
    http(`/systems/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),

  // 申请单
  listRequests: () => http('/requests'),
  getRequest: (id) => http(`/requests/${id}`),
  createRequest: (data) => http('/requests', { method: 'POST', body: JSON.stringify(data) }),
  updateRequest: (id, patch) =>
    http(`/requests/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
}
