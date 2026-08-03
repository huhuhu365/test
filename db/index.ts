import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export function getDb() {
  if (!env.DB) {
    throw new Error(
      "Cloudflare D1 binding `DB` is unavailable. Set the `d1` field in .openai/hosting.json to `DB` or let your control plane inject the real binding values before using the database."
    );
  }

  return drizzle(env.DB, { schema });
}

let databaseReady: Promise<void> | null = null;

export async function ensureDatabase() {
  if (!env.DB) throw new Error("Cloudflare D1 binding `DB` is unavailable.");
  if (!databaseReady) {
    databaseReady = initializeDatabase().catch((error) => {
      databaseReady = null;
      throw error;
    });
  }
  await databaseReady;
}

export async function getReadyDb() {
  await ensureDatabase();
  return getDb();
}

async function initializeDatabase() {
  const d1 = env.DB;
  await d1.batch([
    d1.prepare(`CREATE TABLE IF NOT EXISTS dishes (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      name TEXT NOT NULL,
      description TEXT DEFAULT '' NOT NULL,
      price INTEGER NOT NULL,
      category TEXT DEFAULT '主食' NOT NULL,
      image_url TEXT,
      is_active INTEGER DEFAULT 1 NOT NULL,
      sort_order INTEGER DEFAULT 0 NOT NULL,
      created_at TEXT DEFAULT (CURRENT_TIMESTAMP) NOT NULL
    )`),
    d1.prepare(`CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      order_number TEXT NOT NULL,
      table_number INTEGER NOT NULL,
      status TEXT DEFAULT 'new' NOT NULL,
      note TEXT DEFAULT '' NOT NULL,
      total INTEGER NOT NULL,
      created_at TEXT DEFAULT (CURRENT_TIMESTAMP) NOT NULL
    )`),
    d1.prepare(`CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      order_id INTEGER NOT NULL,
      dish_id INTEGER,
      dish_name TEXT NOT NULL,
      unit_price INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (dish_id) REFERENCES dishes(id)
    )`),
    d1.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number)"),
    d1.prepare("CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders(status, created_at)"),
    d1.prepare("CREATE INDEX IF NOT EXISTS idx_orders_table_created ON orders(table_number, created_at)"),
    d1.prepare("CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id)"),
  ]);

  const row = await d1.prepare("SELECT COUNT(*) AS count FROM dishes").first<{ count: number }>();
  if (!row?.count) {
    await d1.batch([
      d1.prepare("INSERT INTO dishes (name, description, price, category, sort_order) VALUES (?, ?, ?, ?, ?)").bind("招牌牛肉饭", "慢炖牛腩、溏心蛋、时蔬", 32, "热销", 1),
      d1.prepare("INSERT INTO dishes (name, description, price, category, sort_order) VALUES (?, ?, ?, ?, ?)").bind("照烧鸡腿饭", "去骨鸡腿、照烧汁、温泉蛋", 28, "热销", 2),
      d1.prepare("INSERT INTO dishes (name, description, price, category, sort_order) VALUES (?, ?, ?, ?, ?)").bind("鲜虾云吞面", "手工云吞、鲜虾、清鸡汤", 26, "主食", 3),
      d1.prepare("INSERT INTO dishes (name, description, price, category, sort_order) VALUES (?, ?, ?, ?, ?)").bind("黄金薯条", "粗切薯条，现点现炸", 12, "小吃", 4),
      d1.prepare("INSERT INTO dishes (name, description, price, category, sort_order) VALUES (?, ?, ?, ?, ?)").bind("手打柠檬茶", "香水柠檬、茉莉茶汤", 14, "饮品", 5),
    ]);
  }
  await d1.prepare("PRAGMA optimize").run();
}
