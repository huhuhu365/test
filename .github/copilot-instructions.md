# 项目协作指引

## 沟通与工作方式
- 默认使用简体中文回答；用户明确要求其他语言时遵循用户要求。
- 保留现有界面文案的语言（主应用主要为日文），不要因中文交流而翻译整个界面。
- 修改前先阅读目标文件、相关配置和现有实现。文档与代码不一致时，以当前代码及依赖配置为准，并说明差异。
- 大范围或跨模块修改前，简要说明修改计划、影响范围及验证方式，再按已授权的任务执行。
- 保留用户尚未提交的修改；只改与任务有关的内容，避免顺带重构和全文件格式化。

## 仓库与范围
- `used-car-management/` 是二手车管理系统，提供车辆查询、筛选、增删改、统计及 CSV 导出；前端还包含附近餐饮与游玩地点查询界面。
- `used-car-management/src/` 是 Vue 前端，`used-car-management/backend/` 是对应的 Spring Boot API。根目录仅管理多个项目，项目列表见根目录 `README.md`。
- `bulk-letter-vue/`、`mobile-order/`、`my-vue/`、`react-basic/`、`react-learning/`、`todo-app/`、`wang1/`、`mulesoft-hello-world/` 是其他项目目录，技术栈各不相同（例如 `todo-app/` 是 React 18 + TypeScript + Vite 5，`mulesoft-hello-world/` 是 Mule 4 + Maven，`wang1/` 混有 Python 脚本）。修改其中内容前，先检查其自身 README、依赖和脚本；不要套用主应用的技术栈与启动命令。
- `学习资料/` 存放 COBOL、ServiceNow 和 Git 笔记，不是可运行项目。
- `used-car-management/README.md` 描述二手车应用与启动方式，该目录的 `DATABASE_PRACTICE.md` 说明数据库练习；涉及具体行为时仍需核对实现。注意 `README.md` 写的是 Java 25，而 `backend/pom.xml` 实际为 Java 17，以 `pom.xml` 为准。

## 二手车应用技术栈（以下路径均相对于 `used-car-management/`）
- 前端：Vue 3.5、Vite 7、JavaScript ES Modules、`@lucide/vue` 图标；具体版本约束见该项目的 `package.json`，解析版本见锁文件。
- 后端：Java 17、Spring Boot 3.3.7、MyBatis starter 3.0.4、H2、Maven，以 `backend/pom.xml` 为准。
- 不默认引入 TypeScript、Vue Router、Pinia 或其他依赖。优先复用已有实现；增加依赖应有明确的任务需要。

## 文件位置与设计
- `src/main.js`：前端入口；`src/App.vue`：主要界面及交互；`src/style.css`：样式。
- `vite.config.js`：Vite 配置，开发环境将 `/api` 代理至 `http://127.0.0.1:8080`。
- `backend/src/main/java/com/example/usedcar/`：按 `controller`、`service`、`mapper`、`entity`、`dto` 分层。
- `backend/src/main/resources/mapper/`：MyBatis XML；`schema.sql` 和 `data.sql`：数据库表结构与初始数据；`application.yml`：后端配置。
- `backend/src/test/java/com/example/usedcar/service/`：已有服务层测试。
- 前端遵循相邻 Vue 代码的组织方式、命名和缩进。不要为小改动重写整个 `App.vue`。
- 后端保持 Controller → Service → Mapper 分层，SQL 放在现有 Mapper 体系中；查询参数使用参数绑定，避免拼接不可信输入。
- 修改接口或表字段时，同时检查前端调用、DTO/entity、Mapper XML 和数据库脚本的一致性。
- 保留现有 API 路径与数据格式，除非任务明确需要改变。区分演示数据和后端持久化数据，不把演示登录当作生产级认证。

## 命令与验证
- 以下命令仅适用于 `used-car-management/` 项目，在执行前确认所在目录。
- 前端开发：在 `used-car-management/` 运行 `npm run dev`；生产构建：`npm run build`；预览：`npm run preview`。
- 后端开发：在 `backend/` 运行 `mvn spring-boot:run`；后端测试：在 `backend/` 运行 `mvn test`。
- 二手车项目目前没有 `test` 或 `lint` 脚本，不要声称执行过不存在的检查。
- 修改前端代码后运行构建；涉及交互时，验证受影响流程及错误、空数据等相关状态。
- 修改后端逻辑时运行相关测试，按行为变化补充有价值的测试；沿用已有 Spring Boot 测试工具和风格。
- 仅修改文档时检查内容和差异即可。结束时说明改了什么、执行了哪些验证及尚未验证的部分，不虚报成功。

## 避免事项
- 不手工修改 `node_modules/`、`dist/`、`backend/target/`、`mulesoft-hello-world/target/` 或 `.npm-cache/`、`.m2-mule/`、`.vite/` 等缓存产物。
- 不随意切换包管理器、重建锁文件或升级无关依赖；先检查目标项目已有用法。
- 不提交真实密码、令牌或私钥，不在日志中输出敏感信息。
- 不吞掉异常，不用硬编码结果代替真实修复。
- 中文和日文文件按 UTF-8 读写，避免使用系统默认编码导致乱码。
