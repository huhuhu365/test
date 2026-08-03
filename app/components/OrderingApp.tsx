"use client";

import { useEffect, useMemo, useState } from "react";

type Dish = { id: number; name: string; description: string; price: number; category: string; imageUrl: string | null };

const emojiByCategory: Record<string, string> = { 热销: "🍛", 主食: "🍜", 小吃: "🍟", 饮品: "🧋", 甜品: "🍰" };

export default function OrderingApp({ tableNumber }: { tableNumber: number }) {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("全部");
  const [cart, setCart] = useState<Record<number, number>>({});
  const [sheet, setSheet] = useState<"cart" | "checkout" | null>(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ orderNumber: string; total: number } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/menu").then((res) => res.json()).then((data) => setDishes(data.dishes ?? [])).catch(() => setError("菜单加载失败，请刷新重试")).finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => ["全部", ...Array.from(new Set(dishes.map((dish) => dish.category)))], [dishes]);
  const visible = category === "全部" ? dishes : dishes.filter((dish) => dish.category === category);
  const cartItems = dishes.filter((dish) => cart[dish.id]);
  const count = Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);
  const total = cartItems.reduce((sum, dish) => sum + dish.price * cart[dish.id], 0);

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
      const response = await fetch("/api/orders", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ tableNumber, note, items: Object.entries(cart).map(([dishId, quantity]) => ({ dishId: Number(dishId), quantity })) }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "下单失败");
      setSuccess({ orderNumber: data.order.orderNumber, total: data.order.total });
      setCart({}); setSheet(null); setNote("");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "下单失败，请重试"); }
    finally { setSubmitting(false); }
  }

  return (
    <main>
      <header className="topbar">
        <a href="/" className="back-link" aria-label="返回桌号选择">‹</a>
        <div className="brand-mark">小</div>
        <div className="brand-copy"><strong>小满食堂</strong><span><i /> 营业中 · 预计 15 分钟出餐</span></div>
        <div className="table-badge">{tableNumber} 号桌</div>
      </header>
      <section className="hero compact-hero"><div><p className="eyebrow">TABLE {String(tableNumber).padStart(2, "0")}</p><h1>{tableNumber} 号桌，<br />今天想吃点什么？</h1><p>下单后厨房会直接收到</p></div><div className="hero-bowl" aria-hidden="true">🍲</div></section>
      <nav className="categories" aria-label="菜品分类">{categories.map((item) => <button key={item} className={category === item ? "active" : ""} onClick={() => setCategory(item)}>{item}</button>)}</nav>
      <section className="menu-section">
        <div className="section-heading"><h2>{category === "全部" ? "今日菜单" : category}</h2><span>{visible.length} 道可选</span></div>
        {error && <p className="inline-error">{error}</p>}
        {loading ? <div className="empty-menu">菜单准备中…</div> : visible.length === 0 ? <div className="empty-menu">店家正在上架菜品</div> : <div className="menu-list">
          {visible.map((dish) => {
            const quantity = cart[dish.id] ?? 0;
            return <article className="menu-item" key={dish.id}>
              <div className="food-visual">{dish.imageUrl ? <img src={dish.imageUrl} alt={dish.name} /> : <span>{emojiByCategory[dish.category] ?? "🍽️"}</span>}</div>
              <div className="food-info"><div className="food-title"><h3>{dish.name}</h3></div><p>{dish.description || "店内现做，新鲜出餐"}</p><div className="food-bottom"><strong><small>¥</small>{dish.price}</strong>{quantity === 0 ? <button className="add-button" onClick={() => change(dish.id, 1)}>＋</button> : <div className="stepper"><button onClick={() => change(dish.id, -1)}>−</button><span>{quantity}</span><button className="plus" onClick={() => change(dish.id, 1)}>＋</button></div>}</div></div>
            </article>;
          })}
        </div>}
      </section>
      <div className="page-spacer" />
      <aside className={`cart-bar ${count ? "has-items" : ""}`}><button className="cart-summary" onClick={() => count && setSheet("cart")} disabled={!count}><span className="bag-icon">▣{count > 0 && <b>{count}</b>}</span><span className="price-summary">{count ? <><strong>¥{total}</strong><small>{tableNumber} 号桌 · 共 {count} 件</small></> : <strong>还没有选餐</strong>}</span></button><button className="checkout-button" disabled={!count} onClick={() => setSheet("checkout")}>去结算</button></aside>
      {sheet && <div className="overlay" onMouseDown={() => setSheet(null)}><section className="sheet" onMouseDown={(event) => event.stopPropagation()}><div className="sheet-handle"/><div className="sheet-title"><h2>{sheet === "cart" ? "已选菜品" : `确认 ${tableNumber} 号桌订单`}</h2><button className="close" onClick={() => setSheet(null)}>×</button></div>{cartItems.map((dish) => <div className="cart-line" key={dish.id}><span>{dish.imageUrl ? "🍽️" : (emojiByCategory[dish.category] ?? "🍽️")}</span><p><strong>{dish.name}</strong><small>¥{dish.price}</small></p><div className="stepper"><button onClick={() => change(dish.id, -1)}>−</button><span>{cart[dish.id]}</span><button className="plus" onClick={() => change(dish.id, 1)}>＋</button></div></div>)}{sheet === "checkout" && <label className="input-field"><span>备注</span><input value={note} onChange={(event) => setNote(event.target.value)} placeholder="口味、忌口等（选填）" /></label>}<button className="primary-action" disabled={submitting} onClick={sheet === "cart" ? () => setSheet("checkout") : submitOrder}>{submitting ? "正在提交…" : `${sheet === "cart" ? "确认菜品" : "提交订单"} · ¥${total}`}</button></section></div>}
      {success && <div className="overlay success-overlay"><section className="success-card"><div className="success-icon">✓</div><h2>下单成功</h2><p>订单号<strong>{success.orderNumber}</strong></p><span>{tableNumber} 号桌 · 厨房已收到您的订单</span><button className="primary-action" onClick={() => setSuccess(null)}>继续加菜</button></section></div>}
    </main>
  );
}
