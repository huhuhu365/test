"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type Dish = { id: number; name: string; description: string; price: number; category: string; imageUrl: string | null; isActive: boolean };
type OrderItem = { id: number; dishName: string; unitPrice: number; quantity: number };
type Order = { id: number; orderNumber: string; tableNumber: number; status: string; note: string; total: number; createdAt: string; items: OrderItem[] };

const statusMap: Record<string, string> = { new: "新订单", preparing: "制作中", ready: "待上菜", completed: "已完成", cancelled: "已取消" };
const emptyForm = { name: "", description: "", price: "", category: "主食", imageUrl: "" };

export default function AdminDashboard({ userName, isLocal }: { userName: string; isLocal: boolean }) {
  const [tab, setTab] = useState<"orders" | "menu" | "tables">("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [origin, setOrigin] = useState("");

  const loadOrders = useCallback(() => fetch("/api/orders").then((res) => res.json()).then((data) => setOrders(data.orders ?? [])), []);
  const loadDishes = useCallback(() => fetch("/api/admin/dishes").then((res) => res.json()).then((data) => setDishes(data.dishes ?? [])), []);

  useEffect(() => { setOrigin(window.location.origin); loadOrders(); loadDishes(); const timer = window.setInterval(loadOrders, 5000); return () => window.clearInterval(timer); }, [loadDishes, loadOrders]);

  async function saveDish(event: FormEvent) {
    event.preventDefault(); setSaving(true); setMessage("");
    const payload = { ...form, price: Number(form.price) };
    const response = await fetch(editingId ? `/api/admin/dishes/${editingId}` : "/api/admin/dishes", { method: editingId ? "PATCH" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    const data = await response.json();
    setMessage(response.ok ? (editingId ? "菜品已更新" : "菜品已上架") : data.error || "保存失败");
    if (response.ok) { setForm(emptyForm); setEditingId(null); loadDishes(); }
    setSaving(false);
  }

  async function uploadImage(file?: File) {
    if (!file) return;
    setSaving(true); const body = new FormData(); body.append("file", file);
    const response = await fetch("/api/admin/upload", { method: "POST", body });
    const data = await response.json();
    if (response.ok) setForm((current) => ({ ...current, imageUrl: data.url })); else setMessage(data.error || "图片上传失败");
    setSaving(false);
  }

  function editDish(dish: Dish) { setEditingId(dish.id); setForm({ name: dish.name, description: dish.description, price: String(dish.price), category: dish.category, imageUrl: dish.imageUrl ?? "" }); window.scrollTo({ top: 0, behavior: "smooth" }); }
  async function toggleDish(dish: Dish) { await fetch(`/api/admin/dishes/${dish.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ isActive: !dish.isActive }) }); loadDishes(); }
  async function updateOrder(id: number, status: string) { await fetch(`/api/admin/orders/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status }) }); loadOrders(); }
  async function copyLink(number: number) { await navigator.clipboard.writeText(`${origin}/table/${number}`); setMessage(`${number} 号桌链接已复制`); }

  const openOrders = orders.filter((order) => !["completed", "cancelled"].includes(order.status));

  return <main className="admin-page">
    <header className="admin-header"><div className="brand-mark">小</div><div><strong>小满食堂 · 店家后台</strong><span>{userName}</span></div><a href={isLocal ? "/api/admin/logout" : "/signout-with-chatgpt?return_to=/"} className="logout">退出</a></header>
    <section className="admin-summary"><div><span>待处理</span><strong>{openOrders.filter((order) => order.status === "new").length}</strong><small>笔新订单</small></div><div><span>制作中</span><strong>{openOrders.filter((order) => order.status === "preparing").length}</strong><small>桌正在等待</small></div><div><span>今日订单</span><strong>{orders.length}</strong><small>最近 100 笔</small></div></section>
    <nav className="admin-tabs"><button className={tab === "orders" ? "active" : ""} onClick={() => setTab("orders")}>订单</button><button className={tab === "menu" ? "active" : ""} onClick={() => setTab("menu")}>菜品管理</button><button className={tab === "tables" ? "active" : ""} onClick={() => setTab("tables")}>桌位链接</button></nav>
    {message && <button className="toast" onClick={() => setMessage("")}>{message} ×</button>}

    {tab === "orders" && <section className="admin-content"><div className="admin-section-title"><h1>实时订单</h1><span>每 5 秒自动刷新</span></div>{openOrders.length === 0 ? <div className="admin-empty">暂时没有待处理订单</div> : <div className="order-grid">{openOrders.map((order) => <article className={`order-card status-${order.status}`} key={order.id}><header><div><strong>{order.tableNumber} 号桌</strong><span>#{order.orderNumber}</span></div><b>{statusMap[order.status]}</b></header><ul>{order.items.map((item) => <li key={item.id}><span>{item.quantity} × {item.dishName}</span><strong>¥{item.unitPrice * item.quantity}</strong></li>)}</ul>{order.note && <p className="order-note">备注：{order.note}</p>}<footer><strong>合计 ¥{order.total}</strong><div>{order.status === "new" && <button onClick={() => updateOrder(order.id, "preparing")}>开始制作</button>}{order.status === "preparing" && <button onClick={() => updateOrder(order.id, "ready")}>制作完成</button>}{order.status === "ready" && <button onClick={() => updateOrder(order.id, "completed")}>确认上菜</button>}<button className="muted-action" onClick={() => updateOrder(order.id, "cancelled")}>取消</button></div></footer></article>)}</div>}</section>}

    {tab === "menu" && <section className="admin-content"><div className="admin-section-title"><h1>{editingId ? "编辑菜品" : "上架新菜"}</h1><span>图片建议小于 4MB</span></div><form className="dish-form" onSubmit={saveDish}><label className="upload-box">{form.imageUrl ? <img src={form.imageUrl} alt="菜品预览" /> : <><b>＋</b><span>上传菜品图片</span></>}<input type="file" accept="image/*" onChange={(event) => uploadImage(event.target.files?.[0])} /></label><div className="form-fields"><label><span>菜品名称</span><input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="例如 招牌牛肉饭" /></label><div className="form-row"><label><span>价格（元）</span><input required min="0" step="1" type="number" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} /></label><label><span>分类</span><select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}><option>热销</option><option>主食</option><option>小吃</option><option>饮品</option><option>甜品</option></select></label></div><label><span>菜品介绍</span><textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="简单介绍口味和主要食材" /></label><div className="form-actions">{editingId && <button type="button" onClick={() => { setEditingId(null); setForm(emptyForm); }}>取消编辑</button>}<button className="save-button" disabled={saving}>{saving ? "保存中…" : editingId ? "保存修改" : "确认上架"}</button></div></div></form><div className="admin-section-title list-title"><h1>已上架菜品</h1><span>{dishes.length} 道菜</span></div><div className="dish-admin-list">{dishes.map((dish) => <article className={!dish.isActive ? "inactive" : ""} key={dish.id}><div className="dish-thumb">{dish.imageUrl ? <img src={dish.imageUrl} alt={dish.name} /> : "🍽️"}</div><div><strong>{dish.name}</strong><span>{dish.category} · ¥{dish.price}</span><small>{dish.isActive ? "顾客可见" : "已下架"}</small></div><button onClick={() => editDish(dish)}>编辑</button><button onClick={() => toggleDish(dish)}>{dish.isActive ? "下架" : "上架"}</button></article>)}</div></section>}

    {tab === "tables" && <section className="admin-content"><div className="admin-section-title"><h1>桌位专属链接</h1><span>可复制后生成二维码</span></div><div className="admin-table-grid">{Array.from({ length: 10 }, (_, index) => index + 1).map((number) => <article key={number}><span>{String(number).padStart(2, "0")}</span><div><strong>{number} 号桌</strong><small>{origin}/table/{number}</small></div><a href={`/table/${number}`} target="_blank" rel="noreferrer">打开</a><button onClick={() => copyLink(number)}>复制</button></article>)}</div></section>}
  </main>;
}
