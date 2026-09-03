# React 学习清单

这是一个适合初学者阅读和修改的 React 小项目，包含：

- JSX 与函数组件
- Props 和父子组件通信
- `useState` 状态管理
- 受控表单与事件处理
- 列表渲染、条件渲染
- `useEffect` 与 localStorage

## 启动项目

打开两个终端分别启动后端和前端：

```bash
cd react-learning
npm run server
```

```bash
cd react-learning
npm run dev
```

后端地址为 `http://localhost:3001`，前端通过 `/api` 代理访问后端。

打开终端显示的本地地址即可。

## 推荐练习

1. 给任务增加“学习难度”字段。
2. 增加“清除已完成”按钮。
3. 把 `TaskItem` 移到单独的组件文件。
4. 增加任务数量上限和错误提示。
