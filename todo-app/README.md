# ToDo アプリ

React + TypeScript + Vite で構築した ToDo アプリです。単一ファイルの HTML 版を
同じ UI・同じ機能のままコンポーネント構成へリファクタリングしたものです。

## セットアップ

```bash
npm install
npm run dev
```

`http://localhost:5173` で確認できます。

## ビルド

```bash
npm run build
npm run preview
```

## 構成

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
