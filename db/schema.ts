import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const dishes = sqliteTable("dishes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  price: integer("price").notNull(),
  category: text("category").notNull().default("主食"),
  imageUrl: text("image_url"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
});

export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderNumber: text("order_number").notNull(),
  tableNumber: integer("table_number").notNull(),
  status: text("status").notNull().default("new"),
  note: text("note").notNull().default(""),
  total: integer("total").notNull(),
  createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
}, (table) => [
  uniqueIndex("idx_orders_order_number").on(table.orderNumber),
  index("idx_orders_status_created").on(table.status, table.createdAt),
  index("idx_orders_table_created").on(table.tableNumber, table.createdAt),
]);

export const orderItems = sqliteTable("order_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  dishId: integer("dish_id").references(() => dishes.id),
  dishName: text("dish_name").notNull(),
  unitPrice: integer("unit_price").notNull(),
  quantity: integer("quantity").notNull(),
}, (table) => [index("idx_order_items_order_id").on(table.orderId)]);
