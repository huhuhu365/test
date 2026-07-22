# Codex Pulse 桌面版

一个原生 Windows 桌面用量监视器，不需要浏览器。它读取 `~/.codex/sessions` 中的 `token_count` 统计字段，不读取或展示对话正文。

## 启动

双击 `启动 Codex Pulse.bat` 即可打开。

窗口每 30 秒自动刷新，也可点击右上角刷新按钮。

也可以在 PowerShell 中运行：

```powershell
cd C:\wang\wang1
python codex_pulse.py
```
