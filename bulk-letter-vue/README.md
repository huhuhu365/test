# Vue 批量信件工作台

用于管理最多 500 位已授权收件人的个性化信件。支持 `{{companyName}}` 公司名变量、CSV 导入、逐条预览和模拟投递。

## 启动

打开两个终端：

```powershell
cd C:\wang\bulk-letter-vue
npm run server
```

```powershell
cd C:\wang\bulk-letter-vue
npm run dev
```

CSV 格式：

```csv
companyName,email
示例科技,contact@example.com
```

当前后端使用 Nodemailer 连接用户在页面中配置的 SMTP 服务，会真实发送邮件。正式投入使用前，还应配置域名验证、可靠的退订页面、退信处理、速率限制和审计日志。

## 项目结构

```text
bulk-letter-vue/
├─ src/
│  ├─ main.js       # Vue 初始化和 /home、/recipients 等路由配置
│  ├─ Root.vue      # 登录、会话检查、SMTP 设置和统一权限外壳
│  ├─ App.vue       # 信件编辑、收件人、CSV、预览和发送流程
│  ├─ Users.vue     # 管理者专用的账号管理页面
│  └─ style.css     # 全局页面样式
├─ server/
│  ├─ server.js     # 登录、权限、SMTP、用户、收件人和发送 API
│  └─ data.json     # 用户哈希与收件人持久化数据
└─ vite.config.js   # Vite 配置及 /api 到 3002 端口的代理
```

## 登录与权限流程

1. 浏览器向 `POST /api/login` 提交账号和密码。
2. 后端用 `scrypt` 计算密码哈希并进行安全比较。
3. 成功后，后端创建随机 Token，并在内存中建立独立会话。
4. 前端把 Token 放在后续请求的 `Authorization: Bearer ...` 中。
5. `requireLogin` 验证是否登录，`requireAdmin` 继续验证是否为管理者。
6. SMTP 应用密码只存在当前会话内存，退出或重启后端后销毁。

默认管理者为 `wangyonghuang / password`，首次登录后建议在正式实现中增加修改密码功能。

## 数据与安全边界

- `data.json` 保存收件人和不可逆的密码哈希，不保存 SMTP 密码。
- 前端角色只决定按钮是否显示，后端角色才决定接口是否允许访问。
- 每个登录会话使用自己的 SMTP 配置，不能使用其他人的发件账号。
- CSV 和页面输入都需要在后端重新验证，不能只依赖前端校验。
- 当前 JSON 文件适合学习和单机使用；多人正式使用时应改为数据库，并增加 HTTPS、CSRF 防护、登录限流、密码修改和审计日志。
