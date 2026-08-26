import { env } from "cloudflare:workers";
import { desc, eq, inArray } from "drizzle-orm";
import { ensureDatabase, getReadyDb } from "../../../db";
import { dishes, orderItems, orders } from "../../../db/schema";
import { getAdminUser } from "../../chatgpt-auth";
import { getTableByToken } from "../../table-config";

export async function GET() {
  if (!await getAdminUser()) return Response.json({ error: "请先登录" }, { status: 401 });
  const db = await getReadyDb();
  const recentOrders = await db.select().from(orders).orderBy(desc(orders.createdAt), desc(orders.id)).limit(100);
  const ids = recentOrders.map((order) => order.id);
  const items = ids.length ? await db.select().from(orderItems).where(inArray(orderItems.orderId, ids)) : [];
  return Response.json({ orders: recentOrders.map((order) => ({ ...order, items: items.filter((item) => item.orderId === order.id) })) });
}

export async function POST(request: Request) {
  try {
    const payload = await request.json() as { requestId?: string; seatToken?: string; note?: string; items?: { dishId: number; quantity: number }[] };
    const table = getTableByToken(payload.seatToken ?? "");
    if (!table) return Response.json({ error: "桌号二维码无效，请重新扫码" }, { status: 400 });

    const requestId = typeof payload.requestId === "string" && /^[0-9a-f-]{36}$/i.test(payload.requestId) ? payload.requestId : crypto.randomUUID();
    const quantities = new Map<number, number>();
    for (const item of payload.items ?? []) {
      if (!Number.isInteger(item.dishId) || !Number.isInteger(item.quantity) || item.quantity <= 0) continue;
      quantities.set(item.dishId, (quantities.get(item.dishId) ?? 0) + item.quantity);
    }
    const cleanItems = [...quantities].map(([dishId, quantity]) => ({ dishId, quantity }));
    if (!cleanItems.length) return Response.json({ error: "请先选择菜品" }, { status: 400 });
    if (cleanItems.some((item) => item.quantity > 20)) return Response.json({ error: "每种菜一次最多点20份" }, { status: 400 });
    if (cleanItems.reduce((sum, item) => sum + item.quantity, 0) > 100) return Response.json({ error: "一张订单最多点100份" }, { status: 400 });

    const db = await getReadyDb();
    const [existing] = await db.select().from(orders).where(eq(orders.requestId, requestId)).limit(1);
    if (existing) return Response.json({ order: existing, replayed: true });

    const selectedDishes = await db.select().from(dishes).where(inArray(dishes.id, cleanItems.map((item) => item.dishId)));
    if (selectedDishes.length !== cleanItems.length) return Response.json({ error: "部分菜品已下架，请刷新菜单" }, { status: 409 });

    const total = cleanItems.reduce((sum, item) => sum + (selectedDishes.find((dish) => dish.id === item.dishId)?.price ?? 0) * item.quantity, 0);
    const orderId = createOrderId();
    const orderNumber = createOrderNumber(table.number);
    const note = (payload.note ?? "").trim().slice(0, 200);

    await ensureDatabase();
    await runWithRetry(() => env.DB.batch([
      env.DB.prepare("INSERT INTO orders (id, order_number, request_id, table_number, note, total) VALUES (?, ?, ?, ?, ?, ?)").bind(orderId, orderNumber, requestId, table.number, note, total),
      ...cleanItems.map((item) => {
        const dish = selectedDishes.find((row) => row.id === item.dishId)!;
        return env.DB.prepare("INSERT INTO order_items (order_id, dish_id, dish_name, unit_price, quantity) VALUES (?, ?, ?, ?, ?)").bind(orderId, dish.id, dish.name, dish.price, item.quantity);
      }),
    ]));

    return Response.json({ order: { id: orderId, orderNumber, requestId, tableNumber: table.number, status: "new", paymentStatus: "unpaid", note, total, checkoutRequestedAt: null, paidAt: null } }, { status: 201 });
  } catch (error) {
    console.error("Order submission failed", error);
    return Response.json({ error: "订单提交失败，请稍后重试" }, { status: 500 });
  }
}

function createOrderId() {
  const values = crypto.getRandomValues(new Uint32Array(2));
  return values[0] * 0x10000 + (values[1] & 0xffff);
}

function createOrderNumber(tableNumber: number) {
  const random = crypto.getRandomValues(new Uint32Array(1))[0].toString(36).padStart(7, "0").slice(-7).toUpperCase();
  return `${String(tableNumber).padStart(2, "0")}-${random}`;
}

async function runWithRetry<T>(operation: () => Promise<T>, attempts = 5): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt === attempts - 1 || !isRetryable(error)) throw error;
      await new Promise((resolve) => setTimeout(resolve, 30 * 2 ** attempt + Math.floor(Math.random() * 40)));
    }
  }
  throw lastError;
}

function isRetryable(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /busy|locked|timeout|temporar|too many|internal|network/i.test(message);
}
