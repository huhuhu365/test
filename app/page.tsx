"use client";

import { useMemo, useState } from "react";

type MenuItem = {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  emoji: string;
  badge?: string;
};

const menu: MenuItem[] = [
  { id: 1, name: "招牌牛肉饭", description: "慢炖牛腩、溏心蛋、时蔬", price: 32, category: "热销", emoji: "🍛", badge: "招牌" },
  { id: 2, name: "照烧鸡腿饭", description: "去骨鸡腿、照烧汁、温泉蛋", price: 28, category: "热销", emoji: "🍗", badge: "人气" },
  { id: 3, name: "番茄肥牛饭", description: "酸甜番茄、肥牛卷、米饭", price: 30, category: "主食", emoji: "🍅" },
  { id: 4, name: "黑椒牛柳意面", description: "现炒牛柳、彩椒、黑椒汁", price: 34, category: "主食", emoji: "🍝" },
  { id: 5, name: "鲜虾云吞面", description: "手工云吞、鲜虾、清鸡汤", price: 26, category: "主食", emoji: "🍜" },
  { id: 6, name: "香酥鸡米花", description: "外酥里嫩，搭配甜辣酱", price: 16, category: "小吃", emoji: "🍿" },
  { id: 7, name: "黄金薯条", description: "粗切薯条，现点现炸", price: 12, category: "小吃", emoji: "🍟" },
  { id: 8, name: "青柠气泡水", description: "鲜青柠、苏打水，清爽解腻", price: 10, category: "饮品", emoji: "🍋" },
  { id: 9, name: "手打柠檬茶", description: "香水柠檬、茉莉茶汤", price: 14, category: "饮品", emoji: "🧋", badge: "推荐" },
];

const categories = ["全部", "热销", "主食", "小吃", "饮品"];

export default function Home() {
  const [activeCategory, setActiveCategory] = useState("全部");
  const [cart, setCart] = useState<Record<number, number>>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [orderOpen, setOrderOpen] = useState(false);
  const [orderType, setOrderType] = useState<"堂食" | "打包">("堂食");
  const [table, setTable] = useState("A01");
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const visibleMenu = activeCategory === "全部" ? menu : menu.filter((item) => item.category === activeCategory);
  const count = Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);
  const subtotal = menu.reduce((sum, item) => sum + item.price * (cart[item.id] ?? 0), 0);
  const packagingFee = orderType === "打包" && count > 0 ? 2 : 0;
  const total = subtotal + packagingFee;
  const cartItems = useMemo(() => menu.filter((item) => cart[item.id]), [cart]);

  function changeQuantity(id: number, amount: number) {
    setCart((current) => {
      const next = Math.max(0, (current[id] ?? 0) + amount);
      const updated = { ...current, [id]: next };
      if (next === 0) delete updated[id];
      return updated;
    });
  }

  function submitOrder() {
    setSubmitted(true);
    setOrderOpen(false);
    setCartOpen(false);
    setCart({});
  }

  return (
    <main>
      <header className="topbar">
        <div className="brand-mark">小</div>
        <div className="brand-copy">
          <strong>小满食堂</strong>
          <span><i /> 营业中 · 预计 15 分钟出餐</span>
        </div>
        <button className="more-button" aria-label="更多信息">•••</button>
      </header>

      <section className="hero">
        <div>
          <p className="eyebrow">今日现做 · 好好吃饭</p>
          <h1>一餐小满足，<br />一天好心情。</h1>
          <p>满 ¥39 赠青柠气泡水</p>
        </div>
        <div className="hero-bowl" aria-hidden="true">🍲</div>
      </section>

      <section className="service-card" aria-label="门店服务信息">
        <div><span>◎</span><p><small>当前门店</small><strong>小满食堂 · 中心店</strong></p></div>
        <div className="service-divider" />
        <div><span>◷</span><p><small>营业时间</small><strong>10:30–21:30</strong></p></div>
      </section>

      <nav className="categories" aria-label="菜品分类">
        {categories.map((category) => (
          <button
            key={category}
            className={activeCategory === category ? "active" : ""}
            onClick={() => setActiveCategory(category)}
          >
            {category}
          </button>
        ))}
      </nav>

      <section className="menu-section">
        <div className="section-heading">
          <h2>{activeCategory === "全部" ? "推荐菜品" : activeCategory}</h2>
          <span>{visibleMenu.length} 道可选</span>
        </div>
        <div className="menu-list">
          {visibleMenu.map((item) => {
            const quantity = cart[item.id] ?? 0;
            return (
              <article className="menu-item" key={item.id}>
                <div className={`food-visual visual-${item.id}`} aria-hidden="true"><span>{item.emoji}</span></div>
                <div className="food-info">
                  <div className="food-title">
                    <h3>{item.name}</h3>
                    {item.badge && <span>{item.badge}</span>}
                  </div>
                  <p>{item.description}</p>
                  <div className="food-bottom">
                    <strong><small>¥</small>{item.price}</strong>
                    {quantity === 0 ? (
                      <button className="add-button" onClick={() => changeQuantity(item.id, 1)} aria-label={`添加${item.name}`}>＋</button>
                    ) : (
                      <div className="stepper">
                        <button onClick={() => changeQuantity(item.id, -1)} aria-label={`减少${item.name}`}>−</button>
                        <span>{quantity}</span>
                        <button className="plus" onClick={() => changeQuantity(item.id, 1)} aria-label={`增加${item.name}`}>＋</button>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <div className="page-spacer" />

      <aside className={`cart-bar ${count ? "has-items" : ""}`}>
        <button className="cart-summary" onClick={() => count && setCartOpen(true)} disabled={!count}>
          <span className="bag-icon">▣{count > 0 && <b>{count}</b>}</span>
          <span className="price-summary">
            {count > 0 ? <><strong>¥{subtotal}</strong><small>共 {count} 件商品</small></> : <strong>还没有选餐</strong>}
          </span>
        </button>
        <button className="checkout-button" disabled={!count} onClick={() => setOrderOpen(true)}>去结算</button>
      </aside>

      {cartOpen && (
        <div className="overlay" onMouseDown={() => setCartOpen(false)}>
          <section className="sheet cart-sheet" onMouseDown={(event) => event.stopPropagation()}>
            <div className="sheet-handle" />
            <div className="sheet-title"><h2>已选菜品</h2><button onClick={() => setCart({})}>清空</button></div>
            {cartItems.map((item) => (
              <div className="cart-line" key={item.id}>
                <span>{item.emoji}</span><p><strong>{item.name}</strong><small>¥{item.price}</small></p>
                <div className="stepper"><button onClick={() => changeQuantity(item.id, -1)}>−</button><span>{cart[item.id]}</span><button className="plus" onClick={() => changeQuantity(item.id, 1)}>＋</button></div>
              </div>
            ))}
            <button className="primary-action" onClick={() => { setCartOpen(false); setOrderOpen(true); }}>去结算 · ¥{subtotal}</button>
          </section>
        </div>
      )}

      {orderOpen && (
        <div className="overlay" onMouseDown={() => setOrderOpen(false)}>
          <section className="sheet order-sheet" onMouseDown={(event) => event.stopPropagation()}>
            <div className="sheet-handle" />
            <div className="sheet-title"><h2>确认订单</h2><button className="close" onClick={() => setOrderOpen(false)}>×</button></div>
            <label className="field-label">取餐方式</label>
            <div className="type-switch">
              {(["堂食", "打包"] as const).map((type) => <button key={type} className={orderType === type ? "active" : ""} onClick={() => setOrderType(type)}>{type}</button>)}
            </div>
            {orderType === "堂食" && <label className="input-field"><span>桌号</span><input value={table} onChange={(event) => setTable(event.target.value)} placeholder="例如 A01" /></label>}
            <label className="input-field"><span>备注</span><input value={note} onChange={(event) => setNote(event.target.value)} placeholder="口味、忌口等（选填）" /></label>
            <div className="bill"><p><span>商品金额</span><strong>¥{subtotal}</strong></p>{packagingFee > 0 && <p><span>打包费</span><strong>¥{packagingFee}</strong></p>}<p className="bill-total"><span>合计</span><strong>¥{total}</strong></p></div>
            <button className="primary-action" onClick={submitOrder}>提交订单 · ¥{total}</button>
            <small className="demo-note">演示版不会产生真实付款</small>
          </section>
        </div>
      )}

      {submitted && (
        <div className="overlay success-overlay">
          <section className="success-card">
            <div className="success-icon">✓</div>
            <h2>下单成功</h2>
            <p>取餐号 <strong>A018</strong></p>
            <span>{orderType === "堂食" ? `${table || "未填写桌号"} · 请耐心等待送餐` : "预计 15 分钟后可取餐"}</span>
            <button className="primary-action" onClick={() => setSubmitted(false)}>继续点餐</button>
          </section>
        </div>
      )}
    </main>
  );
}
