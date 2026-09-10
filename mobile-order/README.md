# 小满食堂点单系统

路径：`C:\wang\mobile-order`。React + TypeScript + vinext，包含顾客点单、桌号与店家管理；数据由 Cloudflare D1 及 Drizzle 管理。

## 前后端怎么启动

**前后端在同一项目中运行，不需要另外启动 Java 或 Express 后端。** API 位于 `app/api/`。Node.js 要求 `>=22.13.0`。

首次没有依赖时在该目录执行 `npm install`；已安装后运行：

```powershell
cd C:\wang\mobile-order
pnpm dev
```

npm 用户执行 `npm run dev`。请打开终端显示的地址，不固定假定是 5173 或 3000。
在同一地址下访问 `/admin` 是店家入口，`/api/menu` 是菜单 API。

## 数据与配置

`vite.config.ts` 通过 Cloudflare 插件提供本地运行环境，数据库绑定名由 `.openai/hosting.json` 指定。
`db/index.ts` 中的初始化逻辑创建应用表；`db/schema.ts` 是实际菜品、订单等结构，不是空模板。
如果提示 D1 binding `DB` unavailable，需检查本地 Cloudflare 运行环境与绑定，而不是启动二手车后端。
本地模拟数据库与线上 D1 数据相互独立。不要为解决页面问题直接清空 `.wrangler/`，其中可能保存本地数据。

## 入口

| 路径 | 用途 |
| --- | --- |
| `/` | 顾客入口 |
| `/table/[tableNumber]` | 桌号页面 |
| `/seat/[token]` | 桌位令牌页面 |
| `/admin` | 店家管理 |
| `/admin/login` | 店家登录 |
| `/api/menu` | 菜单查询 |
| `/api/orders` | 订单接口 |

管理 API 使用管理员会话验证；前台能打开不代表自动拥有后台权限。登录相关逻辑见 `app/chatgpt-auth.ts`。

## 本地与线上区别

目录中的 `启动小满食堂点单系统.bat`、同名 `.ps1`、`打开店家管理后台.bat`、`打开顾客点单页面.bat` 打开的是既有线上地址，不会在本机启动开发服务。
线上入口以这些脚本保存的地址为准；本次只核对本地配置，未验证线上可用性，也没有重新部署。

## 构建和测试

```powershell
cd C:\wang\mobile-order
pnpm run build
pnpm test
pnpm run lint
```

`pnpm start` 对应 `vinext start`，用于已有构建结果的运行；日常修改请使用 `pnpm dev`。
`pnpm run db:generate` 生成 Drizzle 迁移，不等于自动更新线上数据库。
Git 统一由 `C:\wang` 管理，不要在此目录重新 `git init`。

返回 [全部项目启动指南](../启动指南.md)。
