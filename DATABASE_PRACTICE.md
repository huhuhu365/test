mvn "-Dmaven.test.skip=true" clean spring-boot:run

npm run dev

# 车管理系统数据库练习说明

这个项目的后端数据库已经改成练习用的多表结构，适合学习 Java + Spring Boot + MyBatis + Vue.js 的前后端联动和 SQL 表关联。

## 表结构

### 1. makers

厂家主表。

| 字段    | 说明     |
| ------- | -------- |
| id      | 厂家 ID  |
| name    | 厂家名称 |
| country | 国家     |

### 2. stores

门店主表。

| 字段       | 说明     |
| ---------- | -------- |
| id         | 门店 ID  |
| name       | 门店名称 |
| prefecture | 都道府县 |
| phone      | 电话     |

### 3. vehicle_statuses

车辆状态主表。

| 字段          | 说明         |
| ------------- | ------------ |
| code          | 状态编码     |
| label         | 状态显示名称 |
| display_order | 显示顺序     |

### 4. vehicles

车辆主表。

| 字段         | 说明                                 |
| ------------ | ------------------------------------ |
| id           | 车辆 ID                              |
| name         | 车名                                 |
| stock_no     | 管理编号                             |
| maker_id     | 厂家 ID，关联 makers.id              |
| store_id     | 门店 ID，关联 stores.id              |
| status_code  | 状态编码，关联 vehicle_statuses.code |
| model_year   | 年式                                 |
| mileage      | 走行距离                             |
| price        | 价格                                 |
| fuel         | 燃料                                 |
| transmission | 变速箱                               |
| inspection   | 车检                                 |

## 表关系

```text
makers 1 ─── * vehicles
stores 1 ─── * vehicles
vehicle_statuses 1 ─── * vehicles
```

`vehicles` 是业务主表，`makers`、`stores`、`vehicle_statuses` 是主数据表。

## MyBatis JOIN 查询

文件位置：

```text
backend/src/main/resources/mapper/VehicleMapper.xml
```

核心查询：

```sql
SELECT
  v.id,
  v.name,
  v.stock_no,
  m.name AS maker,
  v.year,
  v.mileage,
  v.price,
  s.code AS status,
  st.name AS store,
  v.fuel,
  v.transmission,
  v.inspection
FROM vehicles v
INNER JOIN makers m ON v.maker_id = m.id
INNER JOIN stores st ON v.store_id = st.id
INNER JOIN vehicle_statuses s ON v.status_code = s.code
ORDER BY v.id;
```

## 可练习的 SQL

### 查询所有车辆和厂家、门店、状态

```sql
SELECT v.name, m.name AS maker, st.name AS store, s.label AS status_label
FROM vehicles v
JOIN makers m ON v.maker_id = m.id
JOIN stores st ON v.store_id = st.id
JOIN vehicle_statuses s ON v.status_code = s.code;
```

### 按厂家统计库存数量

```sql
SELECT m.name AS maker, COUNT(*) AS vehicle_count
FROM vehicles v
JOIN makers m ON v.maker_id = m.id
GROUP BY m.name
ORDER BY vehicle_count DESC;
```

### 按门店统计平均价格

```sql
SELECT st.name AS store, AVG(v.price) AS average_price
FROM vehicles v
JOIN stores st ON v.store_id = st.id
GROUP BY st.name;
```

### 查询销售中的车辆

```sql
SELECT v.name, v.price, m.name AS maker, st.name AS store
FROM vehicles v
JOIN makers m ON v.maker_id = m.id
JOIN stores st ON v.store_id = st.id
WHERE v.status_code = 'available';
```

## 前后端对应关系

- Vue 页面调用 `/api/vehicles`
- Vue 表单调用 `/api/master-data` 获取厂家、门店、状态下拉框
- Spring Boot Controller 接收请求
- Service 调用 Mapper
- MyBatis XML 执行 JOIN SQL
- H2 数据库返回多表关联结果
- Vue 表格显示厂家、门店、状态等文字

## 主数据 API

新增的主数据 API:

```text
GET /api/master-data
```

返回示例:

```json
{
    "makers": [{ "id": 1, "name": "トヨタ", "country": "日本" }],
    "stores": [
        {
            "id": 1,
            "name": "東京本店",
            "prefecture": "東京都",
            "phone": "03-0000-1001"
        }
    ],
    "statuses": [{ "code": "available", "label": "販売中", "displayOrder": 1 }]
}
```

对应代码:

- `MasterDataController`
- `MasterDataService`
- `MasterDataMapper`
- `MasterDataMapper.xml`

## 启动顺序

```bash
cd backend
mvn spring-boot:run
```

然后另开一个终端：

```bash
npm run dev
```
