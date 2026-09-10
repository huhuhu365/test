# 学生管理系统（my-vue）

Vue 3 + TypeScript + Element Plus 学生管理前端。项目路径：`C:\wang\my-vue`。

## 先看这里

**前端启动用 `pnpm dev`，不是 `pnpm start`。当前仓库没有学生后端源码，因此暂时没有可直接执行的学生后端启动命令。**
前端写死请求 `http://localhost:8080/api/students`，该接口需要另外的学生服务提供。`used-car-management/backend` 只提供车辆接口，不能代替它。

## 启动前端

要求 Node.js `^22.18.0 || >=24.12.0`（以 package.json 为准）。已安装依赖时直接运行：

```powershell
cd C:\wang\my-vue
pnpm dev
```

第一次使用且没有依赖时，在该目录运行 `pnpm install`。npm 用户可用 `npm install` 和 `npm run dev`；同一个项目选定一种包管理器使用，保留对应锁文件。

打开终端实际显示的地址，通常是 `http://localhost:5173`。关闭服务按 `Ctrl + C`。
`pnpm run` 可以列出已有脚本；本项目没有 `start` 或 `server` 脚本。

## 后端怎么打开

1. 先找到原来的学生后端项目；本次在 `C:\wang` 中没有找到 `StudentController`、学生 Service 或学生后端的 Maven 配置。
2. 若原项目是 Spring Boot + Maven，需进入**它自己的 pom.xml 所在目录**，按照其 README 配置 JDK、数据库和端口后运行 `mvn spring-boot:run`；目前没有足够信息给出该目录的准确启动命令。
3. 启动后访问 `http://localhost:8080/api/students`，应返回学生 JSON 数组。
4. 再启动或刷新学生前端。前端采用跨域直连，后端需允许前端实际来源，并处理 JSON 请求的 OPTIONS 预检。
5. 若原后端已经丢失，需要补建学生服务；单独执行 `students_seed.sql` 不会生成 HTTP API。

学生与二手车后端都可能使用 8080，不能同时占用同一个地址和端口。调整学生端口时也要修改 `src/views/Student.vue` 中的 `API_URL`。
**打开前端不等于后端已运行。没有学生 API 时页面会显示连接错误，不会自动使用本地模拟学生。**

## 前端需要的 API 契约（后端待定位）

| 方法 | 路径 | 前端预期 |
| --- | --- | --- |
| GET | `/api/students` | 直接返回 Student 数组，不是 `{ data: [...] }` |
| POST | `/api/students` | 新建后直接返回含 id 的 Student 对象 |
| PUT | `/api/students/{id}` | 修改后直接返回 Student 对象 |
| DELETE | `/api/students/{id}` | 成功响应，可无正文 |

```json
{ "id": 1, "name": "示例学生", "age": 18, "phone": "13800000000", "className": "高一一班", "createdAt": "2026-06-01T09:10:00" }
```

写入请求发送 `name`、`age`、`phone`、`className`。姓名、年龄、电话、班级在表单中必填；电话按 `^1[3-9]\d{9}$` 校验，目前面向中国大陆手机号。

## 当前功能与数据

- 学生列表、新增、编辑、删除；姓名/电话/班级搜索和班级筛选。
- 学生数量、班级数量、平均年龄等前端统计。
- `students_seed.sql` 提供 MySQL 风格建表和示例数据；导入前先确认目标数据库，重复插入会产生重复示例记录。
- `PRODUCT_INTRODUCTION.md` 中部分功能属于原产品规划；当前源码未实现的成绩、出勤等功能不能视为已完成。

## 构建和检查

```powershell
cd C:\wang\my-vue
pnpm run type-check
pnpm run build
pnpm run preview
```

`build` 包含类型检查，`preview` 预览构建产物，不会提供学生 API。本次仅核对文档与源码，没有验证缺失后端的运行结果。

## 关键文件

| 文件 | 用途 |
| --- | --- |
| `src/views/Student.vue` | 学生界面、API_URL、请求逻辑 |
| `src/App.vue` | 加载学生页面 |
| `vite.config.ts` | 前端工具配置，当前没有学生 API 代理 |
| `students_seed.sql` | 建表和示例数据 |
| [产品介绍](./PRODUCT_INTRODUCTION.md) | 产品规划资料 |

返回 [全部项目启动指南](../启动指南.md)。
