"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Dish = { id: number; name: string; description: string; price: number; category: string; imageUrl: string | null };
type BillItem = { id: number; dishName: string; unitPrice: number; quantity: number };
type BillOrder = { id: number; orderNumber: string; total: number; items: BillItem[] };
type Bill = { tableNumber: number; orders: BillOrder[]; total: number; checkoutRequested: boolean };

const emojiByCategory: Record<string, string> = { 热销: "🍛", 主食: "🍜", 小吃: "🍟", 饮品: "🧋", 甜品: "🍰" };

async function readJson(response: Response) {
  const text = await response.text();
  if (!text) throw new Error("服务器暂时没有返回数据");
  const data = JSON.parse(text);
  if (!response.ok) throw new Error(data.error || "请求失败，请稍后重试");
  return data;
}

export default function OrderingApp({ tableNumber, seatToken }: { tableNumber: number; seatToken: string }) {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [bill, setBill] = useState<Bill>({ tableNumber, orders: [], total: 0, checkoutRequested: false });
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("全部");
  const [cart, setCart] = useState<Record<number, number>>({});
  const [sheet, setSheet] = useState<"cart" | "checkout" | "bill" | null>(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ orderNumber: string; total: number } | null>(null);
  const [error, setError] = useState("");

  const loadBill = useCallback(() => fetch(`/api/table-bill?token=${encodeURIComponent(seatToken)}`).then(readJson).then((data) => setBill(data.bill)).catch(() => undefined), [seatToken]);

  useEffect(() => {
    fetch("/api/menu").then(readJson).then((data) => setDishes(data.dishes ?? [])).catch((caught) => setError(caught instanceof Error ? caught.message : "菜单加载失败")).finally(() => setLoading(false));
    loadBill();
    const timer = window.setInterval(loadBill, 5000);
    return () => window.clearInterval(timer);
  }, [loadBill]);

  const categories = useMemo(() => ["全部", ...Array.from(new Set(dishes.map((dish) => dish.category)))], [dishes]);
  const visible = category === "全部" ? dishes : dishes.filter((dish) => dish.category === category);
  const cartItems = dishes.filter((dish) => cart[dish.id]);
  const count = Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);
  const cartTotal = cartItems.reduce((sum, dish) => sum + dish.price * cart[dish.id], 0);

  function change(id: number, amount: number) {
    setCart((current) => {
      const quantity = Math.max(0, (current[id] ?? 0) + amount);
      const next = { ...current, [id]: quantity };
      if (!quantity) delete next[id];
      return next;
    });
  }

  async function submitOrder() {
    setSubmitting(true); setError("");
    try {
      const response = await fetch("/api/orders", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ seatToken, note, items: Object.entries(cart).map(([dishId, quantity]) => ({ dishId: Number(dishId), quantity })) }) });
      const data = await readJson(response);
      setSuccess({ orderNumber: data.order.orderNumber, total: data.order.total });
      setCart({}); setSheet(null); setNote(""); await loadBill();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "下单失败，请重试"); }
    finally { setSubmitting(false); }
  }

  async function requestCheckout() {
    setSubmitting(true); setError("");
    try {
      const response = await fetch("/api/table-bill", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ seatToken }) });
      const data = await readJson(response);
      setBill(data.bill); setSheet(null);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "申请结账失败"); }
    finally { setSubmitting(false); }
  }

  return <main>
    <header className="topbar locked-table-header">
      <div className="brand-mark">小</div>
      <div className="brand-copy"><strong>小满食堂</strong><span><i /> 本桌专属点单 · 无法切换桌号</span></div>
      <div className="table-badge">{tableNumber} 号桌 🔒</div>
    </header>
    <section className="hero compact-hero"><div><p className="eyebrow">TABLE {String(tableNumber).padStart(2, "0")}</p><h1>{tableNumber} 号桌，<br />今天想吃点什么？</h1><p>加菜会自动计入本桌账单</p></div><div className="hero-bowl" aria-hidden="true">🍲</div></section>
    {bill.total > 0 && <button className={`current-bill ${bill.checkoutRequested ? "requested" : ""}`} onClick={() => setSheet("bill")}><div><span>{bill.checkoutRequested ? "已申请结账" : "本桌当前账单"}</span><strong>¥{bill.total}</strong></div><small>{bill.checkoutRequested ? "请等待店家确认收款" : `${bill.orders.length} 笔订单 · 点击查看并结账`} →</small></button>}
    <nav className="categories" aria-label="菜品分类">{categories.map((item) => <button key={item} className={category === item ? "active" : ""} onClick={() => setCategory(item)}>{item}</button>)}</nav>
    <section className="menu-section">
      <div className="section-heading"><h2>{category === "全部" ? "今日菜单" : category}</h2><span>{visible.length} 道可选</span></div>
      {error && <p className="inline-error">{error}</p>}
      {loading ? <div className="empty-menu">菜单准备中…</div> : visible.length === 0 ? <div className="empty-menu">店家正在上架菜品</div> : <div className="menu-list">{visible.map((dish) => {
        const quantity = cart[dish.id] ?? 0;
        return <article className="menu-item" key={dish.id}><div className="food-visual">{dish.imageUrl ? <img src={dish.imageUrl} alt={dish.name} /> : <span>{emojiByCategory[dish.category] ?? "🍽️"}</span>}</div><div className="food-info"><div className="food-title"><h3>{dish.name}</h3></div><p>{dish.description || "店内现做，新鲜出餐"}</p><div className="food-bottom"><strong><small>¥</small>{dish.price}</strong>{quantity === 0 ? <button className="add-button" onClick={() => change(dish.id, 1)}>＋</button> : <div className="stepper"><button onClick={() => change(dish.id, -1)}>−</button><span>{quantity}</span><button className="plus" onClick={() => change(dish.id, 1)}>＋</button></div>}</div></div></article>;
      })}</div>}
    </section>
    <div className="page-spacer" />
    <aside className={`cart-bar ${count || bill.total ? "has-items" : ""}`}>
      <button className="cart-summary" onClick={() => count ? setSheet("cart") : bill.total ? setSheet("bill") : undefined} disabled={!count && !bill.total}><span className="bag-icon">▣{count > 0 && <b>{count}</b>}</span><span className="price-summary">{count ? <><strong>¥{cartTotal}</strong><small>待提交 · 共 {count} 件</small></> : bill.total ? <><strong>账单 ¥{bill.total}</strong><small>{bill.checkoutRequested ? "等待店家确认" : "本桌累计消费"}</small></> : <strong>还没有选餐</strong>}</span></button>
      <button className="checkout-button" disabled={!count && !bill.total} onClick={() => count ? setSheet("checkout") : setSheet("bill")}>{count ? "提交订单" : bill.checkoutRequested ? "待确认" : "去结账"}</button>
    </aside>

    {sheet && <div className="overlay" onMouseDown={() => setSheet(null)}><section className="sheet" onMouseDown={(event) => event.stopPropagation()}><div className="sheet-handle"/><div className="sheet-title"><h2>{sheet === "bill" ? `${tableNumber} 号桌账单` : sheet === "cart" ? "已选菜品" : "确认本次加菜"}</h2><button className="close" onClick={() => setSheet(null)}>×</button></div>
      {sheet === "bill" ? <>{bill.orders.map((order) => <div className="bill-order" key={order.id}><header><span>订单 #{order.orderNumber}</span><strong>¥{order.total}</strong></header>{order.items.map((item) => <p key={item.id}><span>{item.quantity} × {item.dishName}</span><small>¥{item.unitPrice * item.quantity}</small></p>)}</div>)}<div className="bill-grand-total"><span>本桌应付合计</span><strong>¥{bill.total}</strong></div>{bill.checkoutRequested ? <div className="checkout-waiting"><b>✓</b><div><strong>结账申请已发送</strong><span>请完成付款并等待店家确认</span></div></div> : <button className="primary-action" disabled={submitting || !bill.total} onClick={requestCheckout}>{submitting ? "正在申请…" : `确认申请结账 · ¥${bill.total}`}</button>}</> : <>{cartItems.map((dish) => <div className="cart-line" key={dish.id}><span>{emojiByCategory[dish.category] ?? "🍽️"}</span><p><strong>{dish.name}</strong><small>¥{dish.price}</small></p><div className="stepper"><button onClick={() => change(dish.id, -1)}>−</button><span>{cart[dish.id]}</span><button className="plus" onClick={() => change(dish.id, 1)}>＋</button></div></div>)}{sheet === "checkout" && <label className="input-field"><span>备注</span><input value={note} onChange={(event) => setNote(event.target.value)} placeholder="口味、忌口等（选填）" /></label>}<button className="primary-action" disabled={submitting} onClick={sheet === "cart" ? () => setSheet("checkout") : submitOrder}>{submitting ? "正在提交…" : `${sheet === "cart" ? "确认菜品" : "提交订单"} · ¥${cartTotal}`}</button></>}
    </section></div>}
    {success && <div className="overlay success-overlay"><section className="success-card"><div className="success-icon">✓</div><h2>下单成功</h2><p>订单号<strong>{success.orderNumber}</strong></p><span>{tableNumber} 号桌 · 已计入本桌账单 ¥{success.total}</span><button className="primary-action" onClick={() => setSuccess(null)}>继续加菜</button></section></div>}
  </main>;
}
