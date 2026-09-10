# 我的项目

每个项目都直接放在 `C:\wang` 下自己的目录中。根目录用于管理项目，不再直接启动应用。
可用 VS Code 打开 [我的项目.code-workspace](./我的项目.code-workspace)，或单独打开某个项目目录。

| 项目 | 文件夹 | 启动方式（在对应目录执行） |
| --- | --- | --- |
| 二手车管理系统 | [used-car-management](./used-car-management/) | `npm run dev`；另一终端进入该项目的 `backend/` 运行 `mvn spring-boot:run` |
| 学生管理系统 | [my-vue](./my-vue/) | `npm run dev` |
| 小满食堂点单系统 | [mobile-order](./mobile-order/) | 本地 `npm run dev`；目录内中文启动脚本打开线上页面 |
| 批量信件工作台 | [bulk-letter-vue](./bulk-letter-vue/) | 两个终端分别运行 `npm run server` 和 `npm run dev` |
| 待办事项应用 | [todo-app](./todo-app/) | `npm run dev` |
| React 基础练习 | [react-basic](./react-basic/) | `npm start`；需要模拟数据时另开终端运行 `npm run serve` |
| React 学习清单 | [react-learning](./react-learning/) | 两个终端分别运行 `npm run server` 和 `npm run dev` |
| MuleSoft Hello World | [mulesoft-hello-world](./mulesoft-hello-world/) | 用 Anypoint Studio 导入运行，详见项目说明 |
| Codex Pulse 用量监视器 | [wang1](./wang1/) | 双击目录内 `启动 Codex Pulse.bat` |

## 文档位置

- 二手车系统说明和数据库练习：`used-car-management/README.md`、`used-car-management/DATABASE_PRACTICE.md`。
- 学生管理产品介绍：`my-vue/PRODUCT_INTRODUCTION.md`。
- COBOL 文档、ServiceNow 笔记和零散 Git 笔记：[学习资料](./学习资料/)。

## 整理说明

2026-09-10：已将根目录二手车前后端、配置、依赖和说明整体归入 `used-car-management/`；点单启动脚本归入 `mobile-order/`，学生管理文档归入 `my-vue/`。
已删除空目录 `my-todo/`、`vue-student-management/`、`services/`、`outputs/`，以及旧分类快捷方式、根目录旧构建产物、Vite 缓存和运行日志。
保留各项目源码、数据库文件、依赖、锁文件、版本管理和协作配置。
`tmp_xls_reader/`、`xls_reader_ready/` 因内容无法读取、删除未获自动审批，暂时保留，等待明确确认。

原先在 `C:\wang` 执行的二手车启动命令，现在需要先进入 `C:\wang\used-car-management`。
目录归位不会自动重启正在运行的服务。各项目运行详情以项目自己的 README 为准。
