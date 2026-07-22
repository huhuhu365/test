# 中古車管理システム

Java + Spring Boot + MyBatis + Vue.js で構成した中古車管理システムです。

## 技術構成

- Frontend: Vue 3, Vite, lucide-vue
- Backend: Java 25, Spring Boot, MyBatis
- Database: H2 Database
- API: REST API

## 主な機能

- 在庫車両一覧表示
- 車名、管理番号、店舗検索
- メーカー、状態フィルタ
- 車両の登録、編集、削除
- 価格帯分析
- 低走行車両ランキング
- メーカー別在庫集計
- 車検、整備、高走行リマインド
- CSV 書き出し

## バックエンド起動

Maven をインストールした状態で実行します。

```bash
cd backend
mvn spring-boot:run
```

API は `http://127.0.0.1:8080/api/vehicles` で起動します。

H2 Console は `http://127.0.0.1:8080/h2-console` で確認できます。

接続情報:

- JDBC URL: `jdbc:h2:mem:usedcar`
- User: `sa`
- Password: 空

## フロントエンド起動

```bash
npm install
npm run dev
```

画面は `http://127.0.0.1:5173/` で確認できます。

Vite の proxy により、フロントエンドから `/api/vehicles` へアクセスすると Spring Boot API に転送されます。

## ビルド

```bash
npm run build
```

## API 一覧

| Method | Path                 | 内容                                   |
| ------ | -------------------- | -------------------------------------- |
| GET    | `/api/vehicles`      | 車両一覧取得                           |
| GET    | `/api/vehicles/{id}` | 車両詳細取得                           |
| POST   | `/api/vehicles`      | 車両登録                               |
| PUT    | `/api/vehicles/{id}` | 車両更新                               |
| DELETE | `/api/vehicles/{id}` | 車両削除                               |
| GET    | `/api/master-data`   | メーカー、店舗、車両状態の主データ取得 |

## データベース練習用テーブル

このプロジェクトは練習用に以下の関連テーブルを使います。

- `makers`
- `stores`
- `vehicle_statuses`
- `vehicles`

`vehicles` は `maker_id`、`store_id`、`status_code` を持ち、MyBatis の XML Mapper で JOIN して画面表示用データを返します。

Vue の登録・編集フォームでは `/api/master-data` から取得した `makers`、`stores`、`vehicle_statuses` を下拉選択として使用します。

詳しい表構成と練習 SQL は [DATABASE_PRACTICE.md](./DATABASE_PRACTICE.md) を確認してください。

## 住所検索（OpenStreetMap 無料 API）

「近くのグルメ・遊び案内」画面では、OpenStreetMap の無料 API（Nominatim + Overpass API）を使って駅周辺のレストラン・観光スポットを検索します。

- **Geocoding**: [Nominatim](https://nominatim.openstreetmap.org/)（住所→座標）
- **POI 検索**: [Overpass API](https://overpass-api.de/)（周辺施設検索）

API キー不要、完全無料で利用できます。

| Method | Path                        | 内容                                           |
| ------ | --------------------------- | ---------------------------------------------- |
| GET    | `/api/places/search`        | OpenStreetMap 経由で周辺スポット検索           |

## 補足

Spring Boot API が起動していない場合、Vue 画面はデモデータを表示します。API を起動すると H2 データベース上のデータに切り替わります。
