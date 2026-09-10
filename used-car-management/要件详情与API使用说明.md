# 二手车管理系统：要件详情与 API 使用说明

更新日期：2026-09-10。本文依据当前项目源码整理，适用于 `C:\wang\used-car-management`。
“已实现”表示代码中已有该功能，不等于生产环境验收通过。本文不包含其他项目的要件。

## 1. 项目目标与范围

为二手车门店提供车辆库存查询、车辆资料维护、库存统计及 CSV 导出界面。
附带员工资料管理演示和附近餐饮游玩查询界面。

| 范围 | 当前实现 |
| --- | --- |
| 车辆管理 | Vue 界面 + Spring Boot API + MyBatis + H2 |
| 品牌、门店、状态主数据 | 后端查询接口，为前端下拉框提供选项 |
| 分析、提醒、品牌汇总 | 前端根据已加载车辆数据计算 |
| 员工管理、登录 | 前端演示逻辑，没有对应的后端认证或员工接口 |
| 附近餐饮游玩查询 | 前端界面及示例数据；调用的地点查询后端接口尚未实现 |

## 2. 技术与目录

- 前端：Vue 3、JavaScript、Vite、`@lucide/vue`。
- 后端：Java 17、Spring Boot 3.3.7、MyBatis starter 3.0.4、Maven。
- 数据库：H2 内存数据库，MySQL 兼容模式。
- 通信：HTTP + JSON。开发环境由 Vite 将 `/api` 转发到 `http://127.0.0.1:8080`。
- Git：由 `C:\wang` 统一管理，使用 `main` 分支。

| 位置（相对于本项目） | 职责 |
| --- | --- |
| `src/App.vue` | 主要界面、前端状态、API 调用 |
| `src/style.css`、`src/main.js` | 样式、前端入口 |
| `vite.config.js`、`package.json` | 前端代理、依赖和运行命令 |
| `backend/pom.xml` | 后端依赖和 Java 版本 |
| `backend/src/main/java/com/example/usedcar/controller/` | HTTP 接口入口 |
| 同级 `service/`、`mapper/`、`entity/`、`dto/` | 业务处理、数据访问、实体、响应对象 |
| `backend/src/main/resources/mapper/` | MyBatis XML SQL |
| `backend/src/main/resources/application.yml` | 端口、H2、MyBatis 配置 |
| `backend/src/main/resources/schema.sql`、`data.sql` | 建表和初始示例数据 |

## 3. 如何启动和打开 API

### 3.1 启动后端

在 VS Code 中打开 PowerShell 终端，执行：

```powershell
cd C:\wang\used-car-management\backend
$env:JAVA_HOME = "C:\Program Files\Java\jdk-17.0.18"
mvn spring-boot:run
```

上面的 JDK 路径适用于当前电脑；其他电脑需替换为实际 Java 17 安装路径。
首次运行需要 Maven 能下载依赖。看到 `Started UsedCarManagementApplication` 后再访问接口。
运行期间保持终端开启，按 `Ctrl + C` 停止后端。

| 可直接用浏览器打开的地址 | 用途 |
| --- | --- |
| http://127.0.0.1:8080/api/vehicles | 车辆列表，返回 JSON 数组 |
| http://127.0.0.1:8080/api/vehicles/1 | 查询 ID 为 1 的车辆；前提是该记录仍存在 |
| http://127.0.0.1:8080/api/master-data | 品牌、门店和状态选项 |
| http://127.0.0.1:8080/h2-console | 数据库控制台 |

浏览器显示 JSON 是正常结果，API 不是管理页面。只查看 API 时无需启动前端。
当前项目没有配置 Swagger/OpenAPI 文档页面。

### 3.2 启动前端页面

另开一个终端：

```powershell
cd C:\wang\used-car-management
npm run dev
```

未安装依赖的电脑先执行 `npm install`。使用终端输出的地址，通常为 `http://127.0.0.1:5173`。
车辆页面为 `/vehicles`，附加查询页面为 `/local-guide`。
端口被占用时 Vite 可能选择其他端口，前端请求仍使用 `/api` 代理。

### 3.3 演示登录

| 演示身份 | 用户名 | 示例密码 | 当前界面行为 |
| --- | --- | --- | --- |
| 管理员 | `admin` | `password` | 显示车辆、员工、分析等管理入口 |
| 一般员工 | `EMP-002` | `Password1` | 主要显示自己的登记资料更新入口 |

这些是源码中的演示凭据。登录状态保存在浏览器 `sessionStorage`，不构成后端认证。
当前车辆 API 没有登录令牌校验，直接请求 API 不需要先登录页面。

## 4. 功能要件

| 编号 | 要件 | 当前实现与验收重点 |
| --- | --- | --- |
| F-01 | 查看车辆库存 | 显示车辆信息及库存状态；后端返回全部车辆，按 ID 排序 |
| F-02 | 搜索、筛选车辆 | 按车名、管理编号、门店搜索，按品牌和状态筛选；当前为前端处理 |
| F-03 | 新增车辆 | 输入完整车辆资料，调用 POST；成功后刷新列表 |
| F-04 | 编辑车辆 | 打开已有车辆资料，调用 PUT 更新完整记录 |
| F-05 | 删除车辆 | 前端确认后调用 DELETE；成功后刷新列表 |
| F-06 | 主数据下拉选择 | 获取品牌、门店、状态，避免自由填写不存在的主数据 |
| F-07 | 库存分析 | 按价格区间、品牌、里程等展示分析；不是独立销售交易统计接口 |
| F-08 | 日历与提醒 | 展示车辆相关提示、整备和高里程提醒；不是独立预约管理后端 |
| F-09 | CSV 导出 | 前端生成车辆 CSV 文件；没有单独的导出 API |
| F-10 | 员工资料维护 | 前端新增、更新、退职标记与字段校验；有 localStorage 写入，不是服务端持久化 |
| F-11 | 登录与角色入口 | 前端区分管理员和一般员工；需要后端认证才能形成可靠权限控制 |
| F-12 | 附近餐饮游玩查询 | 保留前端展示和示例逻辑；真实地点 API 联调待补齐 |

员工密码表单虽有格式和确认校验，但保存资料不会建立真正的后端密码记录；员工演示登录仍采用固定示例密码。不能将该界面描述为已完成密码修改功能。

## 5. API 公共约定

- 基础地址：`http://127.0.0.1:8080`。
- POST、PUT 请求头：`Content-Type: application/json`。
- 正常查询和写入响应为 JSON；DELETE 成功不返回正文。
- 当前没有分页、服务端搜索、排序参数或统一的业务响应包装对象。
- Controller 当前允许的跨域来源为 `http://127.0.0.1:5173`；前端正常使用 Vite 同源代理。

| 方法 | 路径 | 输入 | 成功状态及正文 |
| --- | --- | --- | --- |
| GET | `/api/vehicles` | 无 | 200，Vehicle 数组 |
| GET | `/api/vehicles/{id}` | 路径中的数字 ID | 200，Vehicle 对象 |
| POST | `/api/vehicles` | 完整车辆 JSON，不需要 ID | 201，含生成 ID 的车辆对象 |
| PUT | `/api/vehicles/{id}` | 路径 ID + 完整车辆 JSON | 200，更新后重新查询的车辆对象 |
| DELETE | `/api/vehicles/{id}` | 路径中的数字 ID | 204，无正文 |
| GET | `/api/master-data` | 无 | 200，含 `makers`、`stores`、`statuses` 的对象 |

PUT 是完整更新，不是局部 PATCH；请求体中的 ID 会被路径 ID 覆盖。
不要把 `/api/places/search` 当作可用接口：当前后端源码没有对应 Controller。

## 6. Vehicle 字段定义

以下“必填”基于当前 INSERT/UPDATE 与数据库约束；不代表 Controller 已提供完整参数校验。

| JSON 字段 | 类型 | 写入要求 | 含义与示例 |
| --- | --- | --- | --- |
| `id` | 整数 / Long | 新增不用传 | 数据库自动生成的主键 |
| `name` | 字符串 | 必填，最长 120 | 车名，如 `トヨタ プリウス` |
| `stockNo` | 字符串 | 必填且唯一，最长 40 | 管理编号，如 `DOC-DEMO-001` |
| `maker` | 字符串 | 必填，必须匹配已有品牌名称 | 如 `トヨタ`；不是 maker ID |
| `year` | 整数 / Integer | 必填 | 年式，如 2021 |
| `mileage` | 整数 / Integer | 必填 | 里程，单位 km |
| `price` | 整数 / Long | 必填 | 价格，单位日元，不是“万日元” |
| `status` | 字符串 | 必填，必须匹配状态 code | 如 `available`；不是日文 label |
| `store` | 字符串 | 必填，必须匹配已有门店名称 | 如 `東京本店`；不是 store ID |
| `fuel` | 字符串 | 必填，最长 40 | 如 `ハイブリッド` |
| `color` | 字符串 | 请明确填写，最长 40 | 如 `ホワイト` |
| `transmission` | 字符串 | 必填，最长 20 | 如 `AT` 或 `MT` |
| `inspection` | 字符串 | 必填，最长 20 | 如 `2027/04`；当前不是数据库日期类型 |

`color` 在表结构中有默认值，但 Mapper 会显式写入该字段；API 省略它仍可能写入 null 并触发约束错误。
前端会将价格、里程转换为非负数，后端目前没有相应的完整业务范围校验。

初始化状态：

| code | 界面名称 | 中文含义 |
| --- | --- | --- |
| `available` | 販売中 | 在售 |
| `reserved` | 商談中 | 洽谈中 |
| `sold` | 成約済み | 已成交 |
| `maintenance` | 整備中 | 整备中 |

主数据响应包含：`makers`（`id`、`name`、`country`）、`stores`（`id`、`name`、`prefecture`、`phone`）、`statuses`（`code`、`label`、`displayOrder`）。实际选项优先从接口获取。

## 7. PowerShell 请求示例

### 7.1 只读查询

```powershell
$baseUrl = 'http://127.0.0.1:8080'
Invoke-RestMethod "$baseUrl/api/vehicles"
Invoke-RestMethod "$baseUrl/api/vehicles/1"
Invoke-RestMethod "$baseUrl/api/master-data" | ConvertTo-Json -Depth 5
```

### 7.2 新增 → 修改 → 删除演示记录

以下示例会修改本地数据库。只在学习数据中执行；删除步骤仅删除刚创建的记录。
需先启动后端，并按顺序在同一 PowerShell 终端执行。

```powershell
$baseUrl = 'http://127.0.0.1:8080'
$master = Invoke-RestMethod "$baseUrl/api/master-data"
$vehicle = @{
    name = 'API演示车辆'
    stockNo = 'DOC-' + [guid]::NewGuid().ToString('N').Substring(0, 12)
    maker = $master.makers[0].name
    year = 2021
    mileage = 24800
    price = 2180000
    status = $master.statuses[0].code
    store = $master.stores[0].name
    fuel = 'ハイブリッド'
    color = 'ホワイト'
    transmission = 'AT'
    inspection = '2027/04'
}

# 转成 UTF-8 字节，兼容 Windows PowerShell 中的中日文请求体。
$body = [Text.Encoding]::UTF8.GetBytes(($vehicle | ConvertTo-Json))
$created = Invoke-RestMethod "$baseUrl/api/vehicles" -Method Post `
    -ContentType 'application/json; charset=utf-8' -Body $body
$created | ConvertTo-Json

# 使用完整字段进行修改，保留其他字段。
$vehicle.price = 2080000
$body = [Text.Encoding]::UTF8.GetBytes(($vehicle | ConvertTo-Json))
Invoke-RestMethod "$baseUrl/api/vehicles/$($created.id)" -Method Put `
    -ContentType 'application/json; charset=utf-8' -Body $body

# 删除这条演示记录。204 表示成功，通常没有显示内容。
Invoke-RestMethod "$baseUrl/api/vehicles/$($created.id)" -Method Delete
```

新增前应确保主数据接口返回非空选项。不要连续重跑相同管理编号的 POST。
在 Postman 中也可以选择对应方法和 URL，用 Body → raw → JSON 发送同样的车辆字段。

## 8. 数据库及数据保存

| 表 | 用途 |
| --- | --- |
| `makers` | 品牌主数据 |
| `stores` | 门店主数据 |
| `vehicle_statuses` | 库存状态及显示顺序 |
| `vehicles` | 车辆数据，通过三个外键关联主数据 |

API 用品牌、门店名称收发数据，Mapper 在写入时根据名称查询对应 ID。
详细表结构与 SQL 练习见 [DATABASE_PRACTICE.md](./DATABASE_PRACTICE.md)。

H2 控制台连接：

```text
地址：http://127.0.0.1:8080/h2-console
Driver Class：org.h2.Driver
JDBC URL：jdbc:h2:mem:usedcar
User Name：sa
Password：留空
```

当前是内存数据库，且启动脚本会删表重建并加载示例数据。**后端停止后再启动，车辆修改不会永久保留。**
前端 API 连接失败时展示演示车辆，演示模式下的车辆增删改不是数据库写入。
浏览器中的员工等数据也不等于后端数据库中的数据，不能跨电脑共享。

## 9. 错误处理与待完善要件

| 场景 | 当前行为或限制 | 后续建议 |
| --- | --- | --- |
| 查询、修改、删除不存在的 ID | Service 抛出 `IllegalArgumentException`；没有自定义 404 映射 | 增加统一异常处理和 404 响应 |
| 重复管理编号、主数据名称不存在、必填字段缺失 | 可能触发数据库约束异常；没有稳定的业务错误正文 | 增加 DTO 校验和明确错误码 |
| 页面已登录 | 仅有浏览器状态；API 没有认证授权 | 增加后端用户、密码哈希和接口权限校验 |
| 员工修改密码 | 前端校验不等于真正修改登录密码 | 实现后端密码变更流程 |
| 后端重启 | 重载初始化数据 | 正式使用前改为持久化数据库及迁移机制 |
| 大量车辆 | 一次返回全部记录 | 增加服务端分页、筛选和排序 |
| 地点查询 | `/api/places/search` 没有后端实现 | 实现后再进行真实数据联调 |

以上是待完善项，不属于当前已实现的 API 承诺。

## 10. 常见启动问题

| 现象 | 检查方式 |
| --- | --- |
| 浏览器提示无法连接 | 后端是否启动成功；是否打开了 8080 而非前端端口 |
| 8080 被占用 | 检查是否已有后端实例；不要重复启动。改后端端口时同步改 Vite 代理 |
| `mvn` 无法识别 | 检查 Maven 是否安装并加入 PATH，运行 `mvn -v` |
| Java 版本不符 | 检查当前终端 `JAVA_HOME` 和 `mvn -v` 显示的 Java 版本 |
| Maven 下载失败 | 检查网络和 Maven 仓库访问；首次运行不能依赖空的离线缓存 |
| API 正常，页面仍显示演示数据 | 先启动后端，再刷新页面；检查页面连接状态 |
| 请求 `/` 或 Swagger 地址报错 | 当前只实现上表中的业务接口，没有后端首页或 Swagger 页面 |
| 删除成功却没有内容 | 204 响应没有正文，这是接口定义的正常行为 |

## 11. 验证清单

- [ ] 后端启动成功，车辆列表和主数据接口均能返回 JSON。
- [ ] 查询一条存在的车辆，字段符合本说明。
- [ ] 在学习数据中新增一条唯一编号记录，再修改并删除。
- [ ] 前端显示 API 已连接，列表与 API 数据一致。
- [ ] 搜索、筛选、CSV 导出及车辆表单满足预期。
- [ ] 演示模式与 API 模式能够明确区分。

已有构建和测试命令：

```powershell
# 前端构建
cd C:\wang\used-car-management
npm run build

# 后端测试
cd C:\wang\used-car-management\backend
$env:JAVA_HOME = "C:\Program Files\Java\jdk-17.0.18"
mvn test
```

2026-09-10 目录整理时，前端构建通过、后端 7 项服务层测试通过。
这些结果不代表本清单全部完成，也不代表真实浏览器及全部 HTTP 异常场景已经验证。
本次文档整理依据源码核对，没有执行上面的新增、修改、删除示例。
