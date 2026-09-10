# 待办事项应用（ToDo）

路径：`C:\wang\todo-app`。这是纯前端 React + TypeScript 应用，**不需要独立后端、Java 或数据库服务**。

## 快速启动

```powershell
cd C:\wang\todo-app
pnpm dev
```

npm 对应命令为 `npm run dev`。首次依赖缺失时先执行 `npm install`，或沿用项目已选定的包管理器安装。
打开终端实际显示的地址，通常为 `http://localhost:5173`。本项目没有 `start`、`server` 脚本。

## 保存方式

任务与语言偏好存在浏览器 localStorage，不是服务器数据库。清除浏览器网站数据会丢失记录；不同浏览器、端口和电脑之间不会自动同步。

## 构建

`pnpm run build` 执行 TypeScript 检查和 Vite 构建；`pnpm run preview` 预览构建结果，保持纯前端运行。

## 文件结构与功能（原项目说明）

- `index.html` — Vite のエントリ（`#root` にマウント）
- `src/main.tsx` — React のエントリポイント
- `src/App.tsx` — 画面全体の組み立てとフィルター状態
- `src/i18n.tsx` — 日本語 / 英語の辞書と言語切り替えコンテキスト（`localStorage` に保存、デフォルトは日本語）
- `src/hooks/useTasks.ts` — タスクの状態管理と `localStorage` への永続化
- `src/components/LanguageSwitch.tsx` — 画面右上の言語切り替え（日本語 / EN）
- `src/components/TaskInput.tsx` — タスク追加フォーム
- `src/components/Filters.tsx` — すべて / 未完了 / 完了 の切り替え
- `src/components/TaskList.tsx` — 一覧と空状態の表示
- `src/components/TaskItem.tsx` — 1 タスク分の表示
- `src/types.ts` — `Task` 型と `Filter` 型
- `src/index.css` — HTML 版と同一のスタイル

## 機能

- タスクの追加（「追加」ボタン または Enter キー）
- チェックボックスで完了 / 未完了の切り替え（取り消し線表示）
- タスクの個別削除（✕）
- 完了済みタスクの一括削除
- フィルター（すべて / 未完了 / 完了）
- `localStorage` による自動保存（リロードしても保持）
- ライト / ダークモード対応（OS 設定に追従）
- 残り件数 / 全件数の表示
- 画面右上の言語切り替え（日本語 / 英語、デフォルトは日本語、選択内容も保存）

返回 [全部项目启动指南](../启动指南.md)。
