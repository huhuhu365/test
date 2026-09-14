# CLAUDE.md

本文件为 Claude Code（claude.ai/code）在此仓库中工作时提供指导。

## 项目简介

一个仅在客户端运行的 React + TypeScript 待办事项应用，基于 Vite 构建。没有后端、没有数据库、没有服务端代码——所有状态（任务、语言偏好）都持久化到浏览器的 `localStorage` 中。不要为这个应用的功能引入服务器、API 或数据库；持久化应始终保持在客户端。

## 常用命令

包管理器：本仓库同时存在 `package-lock.json` 和 `pnpm-lock.yaml`/`pnpm-workspace.yaml`——在添加依赖前请先确认实际在用的是哪一个（优先保持与被要求同步的那个锁文件一致）。

```powershell
npm install       # 或 pnpm install
npm run dev       # 启动 Vite 开发服务器，默认 http://localhost:5173（端口被占用时自动切换到 5174+）
npm run build     # tsc -b（基于项目引用的类型检查）后执行 vite build
npm run preview   # 在本地预览生产构建产物
```

本仓库未配置 lint 脚本，也没有配置测试框架/运行器。类型检查（`tsc -b`，作为 `build` 的一部分自动运行）是唯一可用的自动化验证手段。对于 UI 改动，需实际启动开发服务器并在浏览器中操作验证（参见仓库的 `run` 技能说明）——`tsc -b` 通过并不代表功能渲染或行为正确。

## 架构说明

- **入口文件**：`src/main.tsx` 将 `<App />` 包裹在 `I18nProvider`（来自 `src/i18n.tsx`）中，挂载到 `#root`（定义于 `index.html`）。
- **国际化（i18n）**：`src/i18n.tsx` 从零实现了一套基于 React Context 的 i18n 系统——未使用任何外部 i18n 库。`Dict` 定义了所有 UI 字符串的结构（包括一个 `count(remaining, total)` 格式化函数，不仅仅是静态字符串）；`DICTS.ja` / `DICTS.en` 分别保存日语和英语两个语言包。当前语言会持久化到 `localStorage` 的 `todo-app-lang` 键下（默认值为 `'ja'`），并同步镜像到 `document.documentElement.lang`。任何新增的 UI 字符串都必须同时添加到 `Dict` 接口和**两个**语言字典中，否则 TypeScript 编译会失败。
- **任务状态**：`src/hooks/useTasks.ts` 是任务增删改查（`addTask`、`toggleTask`、`deleteTask`、`clearDone`）的唯一数据源，并将任务数组持久化到 `localStorage` 的 `todo-app-tasks` 键下。`load()` 具有防御性：它能容忍缺失或损坏的存储数据（回退为 `[]`），并会为旧版本应用保存的任务补全可能缺失的字段（例如 `priority`）——这是唯一的迁移路径，本项目没有版本化的 schema 或迁移系统。
- **类型定义**：`src/types.ts` 定义了 `Task`、`Priority`（`'high' | 'med' | 'low'`）和 `Filter`（`'all' | 'active' | 'done'`）——这是跨 hooks 与组件共用的统一词汇表。
- **组件树**：`App.tsx`（布局 + 过滤状态）→ `LanguageSwitch`、`TaskInput`（含优先级选择器的添加表单）、`Filters`（全部/进行中/已完成切换）、`TaskList` → `TaskItem`（单行任务，含优先级徽标、复选框、删除按钮）。可见任务列表的过滤逻辑在 `App.tsx` 中通过 `useMemo` 完成，而非在 `useTasks` 内部。
- **样式**：使用 `src/index.css` 中的原生 CSS（未使用 Tailwind / CSS-in-JS / 组件库）。主题通过 `:root` 上的 CSS 自定义属性实现，并配有 `@media (prefers-color-scheme: dark)` 覆盖块，覆盖其中部分变量（文本/卡片/边框颜色——背景渐变和优先级颜色目前尚未针对深色模式做覆盖）。布局为居中的白色"卡片"（`.card`），置于渐变页面背景（`#root`）之上。
