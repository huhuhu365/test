# React 基础练习

路径：`C:\wang\react-basic`。React 18 + Create React App，包含组件、Hook、列表和评论练习。

## 启动

本项目使用 **start**，与其他 Vite 项目的 dev 不同。依赖不存在时先在项目目录执行 `npm install`。

终端 1：启动 JSON 模拟后端。

```powershell
cd C:\wang\react-basic
pnpm run serve
```

终端 2：启动 React 页面。

```powershell
cd C:\wang\react-basic
pnpm start
```

npm 对应命令是 `npm run serve` 和 `npm start`。前端通常为 `http://localhost:3000`，以终端为准。
模拟接口为 `http://localhost:3004/list`，当前 App.js 从此地址读取列表。

## 后端与数据

`serve` 执行 `json-server db.json --port 3004`，用 `db.json` 模拟接口，并不是 Spring Boot 业务服务。对模拟 API 的写入可能修改该 JSON 文件。
无需启动学生或二手车后端。

## 检查

```powershell
cd C:\wang\react-basic
pnpm run build
pnpm test
```

`test` 使用 react-scripts 的测试运行器，默认可能进入监视模式，按 `Ctrl + C` 结束。脚本存在不代表当前测试均已通过；本次没有运行本项目构建或测试。
若启动提示模块缺失，应核对 package.json 与实际 import（当前 App.js 直接引用 lodash，但未在 package.json 声明）；不要通过启动另一个项目后端解决模块依赖错误。

返回 [全部项目启动指南](../启动指南.md)。
