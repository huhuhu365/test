# Codex Pulse 用量监视器

路径：`C:\wang\wang1`。包含 Python 桌面版和 Vite 浏览器版；两者启动方式不同。

## 桌面版（推荐）

双击 `启动 Codex Pulse.bat`。当前脚本运行 `codex_pulse_v2.py`，Python 可执行文件使用这台电脑已有的绝对路径。
如果换电脑后双击无反应，先安装合适的 Python，并在终端运行：

```powershell
cd C:\wang\wang1
python codex_pulse_v2.py
```

桌面版无需启动 Web 后端，也不需要先运行 `pnpm dev`。如果缺少 Python 模块，以终端错误和脚本 import 为准处理。

## 浏览器版

依赖不存在时先在本目录运行 `npm install`，然后：

```powershell
cd C:\wang\wang1
pnpm dev
```

npm 对应 `npm run dev`。开发地址固定为 `http://127.0.0.1:5180`；配置了 strictPort，端口占用时应先检查已有实例。
`vite.config.js` 的开发中间件提供 `/api/usage`，与 Vite 同时启动，不需要第二个服务器。
`pnpm run build` 构建页面；`pnpm run preview` 不能自动获得仅在 configureServer 中定义的开发 API，不应视为完整部署。

## 数据来源

统计来源是当前用户的 `.codex/sessions`，本地没有对应会话记录时可能无统计数据。
项目用于显示 token_count 用量统计，不需要 MuleSoft、学生或车辆 API。
当前目录没有 start 脚本；关闭终端服务按 `Ctrl + C`，桌面窗口可直接关闭。

返回 [全部项目启动指南](../启动指南.md)。
