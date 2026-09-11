# 内部权限申请管理系统

银行内部 **IT 权限 / 系统访问申请** 的提交与审批系统。技术栈：React 18 + Vite + React Router + json-server（模拟后端）。

面向 Windows PowerShell，命令中不要把 `PS C:\wang\access-request-system>` 前缀复制进去。

## 功能

| 角色 | 能做什么 |
| --- | --- |
| 申请人（张三 / 李四） | 发起权限申请、查看/撤回自己的申请 |
| 审批人（王五，部门主管） | 处理「待我审批」队列，单级通过 / 驳回，可撤销已开通权限 |
| 系统管理员（赵六） | 查看全部申请、维护「系统目录」（可申请的系统及权限级别） |

审批流程为 **单级审批**：申请人提交 → 部门主管审批（通过 / 驳回）→ 结束。已通过的权限可由审批人后续撤销回收。

## 启动（两个终端）

终端 1 —— 模拟后端（REST API，端口 3005，数据存 `db.json`）：

```powershell
cd C:\wang\access-request-system
pnpm install   # 首次
pnpm serve
```

终端 2 —— 前端（Vite，端口 5173，`/api` 已代理到 3005）：

```powershell
cd C:\wang\access-request-system
pnpm dev
```

浏览器打开 http://localhost:5173 ，在登录页选择一个身份即可（演示环境，未接行内统一认证）。

### 一条命令同时启动

```powershell
pnpm start
```

底层用 `concurrently` 同时拉起 `pnpm serve` 和 `pnpm dev`。

## 目录结构

```
src/
  api.js              统一接口封装（fetch，走 /api 代理）
  auth.jsx            身份上下文，登录状态存 localStorage
  constants.js        状态 / 风险等级文案、时间格式化、单号生成
  App.jsx             路由与角色访问控制
  components/
    Layout.jsx        侧边导航 + 顶栏
    RequestsTable.jsx  申请列表表格
    StatusBadge.jsx   状态 / 风险徽标
  pages/
    Login.jsx         选择登录身份
    Dashboard.jsx     工作台与统计
    NewRequest.jsx    发起申请表单
    MyRequests.jsx    我的申请（按状态筛选）
    ApprovalQueue.jsx 待我审批
    AllRequests.jsx   全部申请（多条件筛选）
    RequestDetail.jsx 申请详情 + 审批流程时间线 + 审批操作
    Systems.jsx       系统目录维护
db.json               模拟数据库（users / systems / requests）
```

## 数据模型（`db.json`）

- `users`：内部用户，含 `role`（applicant / approver / admin）
- `systems`：可申请的内部系统，含 `riskLevel`、`accessLevels`、`active`
- `requests`：申请单，`status` 取值 `pending` / `approved` / `rejected` / `revoked`

修改 `db.json` 后 json-server 会自动重载。删除的数据无法恢复，注意备份。

## 生产化提示

- 登录改为对接行内统一身份认证（4A / AD 域），移除 `Login.jsx` 的选人逻辑。
- json-server 仅用于本地演示，正式环境替换为真实后端并加接口鉴权。
- 审批流可扩展为多级（在 `requests` 增加 `approvals` 数组，`RequestDetail.jsx` 的时间线已按节点渲染，便于扩展）。
