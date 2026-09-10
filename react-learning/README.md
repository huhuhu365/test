# React 学习清单

路径：`C:\wang\react-learning`。用学习任务清单练习 JSX、组件、Props、状态、表单和前后端通信。

## 启动前后端

首次缺少依赖时运行 `npm install`。已安装后开两个 PowerShell 终端：

```powershell
# 终端 1：Express 后端
cd C:\wang\react-learning
pnpm run server
```

```powershell
# 终端 2：Vite 前端
cd C:\wang\react-learning
pnpm dev
```

npm 对应为 `npm run server`、`npm run dev`。前端通常为 `http://localhost:5173`，以终端为准。后端为 `http://localhost:3001`。

## API 和数据

前端通过 Vite 将 `/api` 代理到 3001，不需要 Java 或 MySQL。

| 方法 | 路径 | 用途 |
| --- | --- | --- |
| POST | `/api/login` | 演示登录 |
| GET | `/api/tasks` | 查询任务 |
| POST | `/api/tasks` | 添加任务 |
| PATCH | `/api/tasks/:id` | 修改任务 |
| DELETE | `/api/tasks/:id` | 删除任务 |

只读检查：在浏览器打开 `http://localhost:3001/api/tasks`。
示例登录为 `admin / password`；这是学习演示，登录成功不等于所有任务接口已有认证保护。
任务保存于 `server/data.json`，操作会修改这个文件。

## 构建与常见问题

`pnpm run build` 构建前端，`pnpm run preview` 预览构建结果。preview 不会自动启动 Express，也不要假定开发代理在预览环境自动生效。
没有 `start` 脚本。页面可打开但任务报错时，先检查 3001 后端终端。
两个终端都用 `Ctrl + C` 停止。本次仅核对文档，未重跑该项目。

返回 [全部项目启动指南](../启动指南.md)。
