"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { TABLES } from "../table-config";

type Dish = {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string | null;
  isActive: boolean;
};

type OrderItem = {
  id: number;
  orderId: number;
  dishName: string;
  unitPrice: number;
  quantity: number;
};

type Order = {
  id: number;
  orderNumber: string;
  tableNumber: number;
  status: string;
  paymentStatus: string;
  note: string;
  total: number;
  createdAt: string;
  items: OrderItem[];
};

type TableDetail = {
  tableNumber: number;
  activeOrders: Order[];
  requestedCheckout: boolean;
  total: number;
  itemCount: number;
};

const statusMap: Record<string, string> = {
  new: "新订单",
  preparing: "制作中",
  ready: "待上菜",
  completed: "已完成",
  cancelled: "已取消",
};

const emptyForm = {
  name: "",
  description: "",
  price: "",
  category: "主食",
  imageUrl: "",
};

async function readJson(response: Response) {
  const text = await response.text();
  if (!text) throw new Error("服务器没有返回内容，请刷新后重试");
  const data = JSON.parse(text);
  if (!response.ok) throw new Error(data.error || "请求失败，请稍后重试");
  return data;
}

async function compressImage(file: File) {
  const bitmap = await createImageBitmap(file);
  const maxEdge = 1200;
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (result) => (result ? resolve(result) : reject(new Error("图片压缩失败"))),
      "image/jpeg",
      0.76,
    ),
  );
  return new File([blob], "dish-photo.jpg", { type: "image/jpeg" });
}

export default function AdminDashboard({
  userName,
  publicOrigin,
}: {
  userName: string;
  publicOrigin: string;
}) {
  const [tab, setTab] = useState<"orders" | "menu" | "tables">("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [origin, setOrigin] = useState(publicOrigin);
  const [selectedTable, setSelectedTable] = useState(1);
  const [tableDetail, setTableDetail] = useState<TableDetail | null>(null);
  const [tableLoading, setTableLoading] = useState(false);

  const loadOrders = useCallback(() => {
    return fetch("/api/orders")
      .then(readJson)
      .then((data) => setOrders(data.orders ?? []))
      .catch((error) => setMessage(error.message));
  }, []);

  const loadDishes = useCallback(() => {
    return fetch("/api/admin/dishes")
      .then(readJson)
      .then((data) => setDishes(data.dishes ?? []))
      .catch((error) => setMessage(error.message));
  }, []);

  const loadTableDetail = useCallback((tableNumber: number) => {
    setTableLoading(true);
    return fetch(`/api/admin/tables/${tableNumber}`)
      .then(readJson)
      .then((data) => setTableDetail(data.table))
      .catch((error) => setMessage(error.message))
      .finally(() => setTableLoading(false));
  }, []);

  useEffect(() => {
    const hostname = window.location.hostname;
    const localNetwork =
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("10.") ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(hostname);

    if (localNetwork) {
      fetch(`/local-site.json?t=${Date.now()}`)
        .then((response) => response.json())
        .then((data) => setOrigin(data.origin || window.location.origin))
        .catch(() => setOrigin(window.location.origin));
    } else {
      setOrigin(publicOrigin || window.location.origin);
    }

    loadOrders();
    loadDishes();
    loadTableDetail(selectedTable);

    const timer = window.setInterval(() => {
      loadOrders();
      loadTableDetail(selectedTable);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [loadDishes, loadOrders, loadTableDetail, publicOrigin, selectedTable]);

  const tableSummaries = useMemo(
    () =>
      TABLES.map((table) => {
        const activeOrders = orders.filter(
          (order) =>
            order.tableNumber === table.number &&
            !["completed", "cancelled"].includes(order.status) &&
            order.paymentStatus !== "paid",
        );
        return {
          tableNumber: table.number,
          activeOrders,
          total: activeOrders.reduce((sum, order) => sum + order.total, 0),
          itemCount: activeOrders.reduce(
            (sum, order) =>
              sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
            0,
          ),
          requestedCheckout: activeOrders.some(
            (order) => order.paymentStatus === "requested",
          ),
        };
      }),
    [orders],
  );

  async function saveDish(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    const payload = { ...form, price: Number(form.price) };
    const response = await fetch(
      editingId ? `/api/admin/dishes/${editingId}` : "/api/admin/dishes",
      {
        method: editingId ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    try {
      await readJson(response);
      setMessage(editingId ? "菜品已更新" : "菜品已上架");
      setForm(emptyForm);
      setEditingId(null);
      loadDishes();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "保存失败");
    }
    setSaving(false);
  }

  async function uploadImage(file?: File) {
    if (!file) return;
    setSaving(true);
    const body = new FormData();
    try {
      body.append("file", await compressImage(file));
    } catch {
      setMessage("图片压缩失败，请换一张图片");
      setSaving(false);
      return;
    }
    const response = await fetch("/api/admin/upload", { method: "POST", body });
    try {
      const data = await readJson(response);
      setForm((current) => ({ ...current, imageUrl: data.url }));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "图片上传失败");
    }
    setSaving(false);
  }

  async function logout() {
    await fetch("/api/admin/logout", { cache: "no-store" });
    window.location.replace("/admin/login");
  }

  function editDish(dish: Dish) {
    setEditingId(dish.id);
    setForm({
      name: dish.name,
      description: dish.description,
      price: String(dish.price),
      category: dish.category,
      imageUrl: dish.imageUrl ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function toggleDish(dish: Dish) {
    await fetch(`/api/admin/dishes/${dish.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ isActive: !dish.isActive }),
    });
    loadDishes();
  }

  async function updateOrder(id: number, status: string) {
    await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status }),
    });
    loadOrders();
    loadTableDetail(selectedTable);
  }

  async function confirmPaid(tableNumber: number) {
    const response = await fetch(`/api/admin/bills/${tableNumber}`, {
      method: "PATCH",
    });
    try {
      await readJson(response);
      setMessage(`${tableNumber} 号桌已确认收款并清桌`);
      await loadOrders();
      await loadTableDetail(tableNumber);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "确认收款失败");
    }
  }

  async function changeItemQuantity(
    itemId: number,
    action: "decrease" | "remove",
  ) {
    const response = await fetch(`/api/admin/order-items/${itemId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action }),
    });
    try {
      const data = await readJson(response);
      setMessage(data.message || "订单已修改");
      await loadOrders();
      await loadTableDetail(selectedTable);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "修改失败");
    }
  }

  const openOrders = orders.filter(
    (order) =>
      !["completed", "cancelled"].includes(order.status) &&
      order.paymentStatus !== "paid",
  );

  const checkoutTables = Array.from(
    new Set(
      orders
        .filter(
          (order) =>
            order.paymentStatus === "requested" &&
            order.status !== "cancelled" &&
            order.paymentStatus !== "paid",
        )
        .map((order) => order.tableNumber),
    ),
  )
    .map((tableNumber) => ({
      tableNumber,
      orders: orders.filter(
        (order) =>
          order.tableNumber === tableNumber &&
          order.paymentStatus === "requested" &&
          order.status !== "cancelled" &&
          order.paymentStatus !== "paid",
      ),
    }))
    .filter((bill) => bill.orders.length);

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div className="brand-mark">满</div>
        <div>
          <strong>小满食堂 · 商家后台</strong>
          <span>{userName}</span>
        </div>
        <button type="button" onClick={logout} className="logout">
          退出
        </button>
      </header>

      <section className="admin-summary">
        <div>
          <span>待处理</span>
          <strong>{openOrders.filter((order) => order.status === "new").length}</strong>
          <small>笔新订单</small>
        </div>
        <div>
          <span>制作中</span>
          <strong>
            {openOrders.filter((order) => order.status === "preparing").length}
          </strong>
          <small>桌正在等待</small>
        </div>
        <div className="checkout-summary">
          <span>待结账</span>
          <strong>{checkoutTables.length}</strong>
          <small>桌请求结账</small>
        </div>
        <div>
          <span>今日订单</span>
          <strong>{orders.length}</strong>
          <small>最近 100 笔</small>
        </div>
      </section>

      <nav className="admin-tabs">
        <button
          className={tab === "orders" ? "active" : ""}
          onClick={() => setTab("orders")}
        >
          订单
        </button>
        <button
          className={tab === "menu" ? "active" : ""}
          onClick={() => setTab("menu")}
        >
          菜品管理
        </button>
        <button
          className={tab === "tables" ? "active" : ""}
          onClick={() => setTab("tables")}
        >
          桌位二维码
        </button>
      </nav>

      {message && (
        <button className="toast" onClick={() => setMessage("")}>
          {message} ×
        </button>
      )}

      {tab === "orders" && (
        <section className="admin-content">
          {checkoutTables.length > 0 && (
            <>
              <div className="admin-section-title checkout-title">
                <h1>结账提醒</h1>
                <span>请核对收款后确认</span>
              </div>
              <div className="checkout-request-grid">
                {checkoutTables.map((bill) => (
                  <article key={bill.tableNumber}>
                    <div className="checkout-table-number">
                      <span>TABLE</span>
                      <strong>{bill.tableNumber}</strong>
                    </div>
                    <div>
                      <strong>{bill.tableNumber} 号桌申请结账</strong>
                      <span>{bill.orders.length} 笔订单</span>
                    </div>
                    <b>¥{bill.orders.reduce((sum, order) => sum + order.total, 0)}</b>
                    <button onClick={() => confirmPaid(bill.tableNumber)}>
                      确认已付款
                    </button>
                  </article>
                ))}
              </div>
            </>
          )}

          <div className="admin-section-title">
            <h1>桌位管理</h1>
            <span>点击桌位可查看明细，并撤销点错的菜</span>
          </div>

          <div className="table-state-grid">
            {tableSummaries.map((table) => (
              <button
                key={table.tableNumber}
                type="button"
                className={`table-state-card ${
                  selectedTable === table.tableNumber ? "active" : ""
                } ${table.requestedCheckout ? "requested" : ""}`}
                onClick={() => {
                  setSelectedTable(table.tableNumber);
                  loadTableDetail(table.tableNumber);
                }}
              >
                <div className="table-state-top">
                  <strong>{table.tableNumber} 号桌</strong>
                  <span>
                    {table.requestedCheckout
                      ? "待结账"
                      : table.activeOrders.length
                        ? "点餐中"
                        : "空桌"}
                  </span>
                </div>
                <div className="table-state-metrics">
                  <b>¥{table.total}</b>
                  <small>{table.itemCount} 份菜品</small>
                </div>
              </button>
            ))}
          </div>

          <div className="admin-section-title list-title">
            <h1>实时订单</h1>
            <span>每 5 秒自动刷新</span>
          </div>

          {openOrders.length === 0 ? (
            <div className="admin-empty">暂时没有待处理订单</div>
          ) : (
            <div className="order-grid">
              {openOrders.map((order) => (
                <article className={`order-card status-${order.status}`} key={order.id}>
                  <header>
                    <div>
                      <strong>{order.tableNumber} 号桌</strong>
                      <span>#{order.orderNumber}</span>
                    </div>
                    <b>{statusMap[order.status]}</b>
                  </header>
                  <ul>
                    {order.items.map((item) => (
                      <li key={item.id}>
                        <span>
                          {item.quantity} × {item.dishName}
                        </span>
                        <strong>¥{item.unitPrice * item.quantity}</strong>
                      </li>
                    ))}
                  </ul>
                  {order.note && <p className="order-note">备注：{order.note}</p>}
                  <footer>
                    <strong>合计 ¥{order.total}</strong>
                    <div>
                      {order.status === "new" && (
                        <button onClick={() => updateOrder(order.id, "preparing")}>
                          开始制作
                        </button>
                      )}
                      {order.status === "preparing" && (
                        <button onClick={() => updateOrder(order.id, "ready")}>
                          制作完成
                        </button>
                      )}
                      {order.status === "ready" && (
                        <button onClick={() => updateOrder(order.id, "completed")}>
                          确认上菜
                        </button>
                      )}
                      <button
                        className="muted-action"
                        onClick={() => updateOrder(order.id, "cancelled")}
                      >
                        取消
                      </button>
                    </div>
                  </footer>
                </article>
              ))}
            </div>
          )}

          <div className="admin-section-title detail-title">
            <h1>{selectedTable} 号桌明细</h1>
            <span>店家可在这里减一份或直接删除点错的菜</span>
          </div>

          <section className="table-detail-panel">
            {tableLoading ? (
              <div className="admin-empty">正在加载桌位详情…</div>
            ) : !tableDetail || tableDetail.activeOrders.length === 0 ? (
              <div className="admin-empty">
                {selectedTable} 号桌目前没有未结清订单
              </div>
            ) : (
              <>
                <div className="table-detail-summary">
                  <div>
                    <span>当前桌位</span>
                    <strong>{tableDetail.tableNumber} 号桌</strong>
                  </div>
                  <div>
                    <span>菜品数量</span>
                    <strong>{tableDetail.itemCount} 份</strong>
                  </div>
                  <div>
                    <span>未结金额</span>
                    <strong>¥{tableDetail.total}</strong>
                  </div>
                </div>

                <div className="table-order-list">
                  {tableDetail.activeOrders.map((order) => (
                    <article className="table-order-card" key={order.id}>
                      <header>
                        <div>
                          <strong>订单 #{order.orderNumber}</strong>
                          <span>{statusMap[order.status] || order.status}</span>
                        </div>
                        <b>¥{order.total}</b>
                      </header>

                      <div className="table-order-items">
                        {order.items.map((item) => (
                          <div className="table-item-row" key={item.id}>
                            <div>
                              <strong>
                                {item.quantity} × {item.dishName}
                              </strong>
                              <span>¥{item.unitPrice * item.quantity}</span>
                            </div>
                            <div className="table-item-actions">
                              <button
                                type="button"
                                onClick={() => changeItemQuantity(item.id, "decrease")}
                              >
                                减一份
                              </button>
                              <button
                                type="button"
                                className="danger-light"
                                onClick={() => changeItemQuantity(item.id, "remove")}
                              >
                                删除
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {order.note && <p className="order-note">备注：{order.note}</p>}

                      <footer>
                        <strong>
                          {order.paymentStatus === "requested"
                            ? "顾客已申请结账"
                            : "仍可继续修改"}
                        </strong>
                        <div>
                          {order.status === "new" && (
                            <button onClick={() => updateOrder(order.id, "preparing")}>
                              开始制作
                            </button>
                          )}
                          {order.status === "preparing" && (
                            <button onClick={() => updateOrder(order.id, "ready")}>
                              制作完成
                            </button>
                          )}
                          {order.status === "ready" && (
                            <button onClick={() => updateOrder(order.id, "completed")}>
                              确认上菜
                            </button>
                          )}
                          <button
                            className="muted-action"
                            onClick={() => updateOrder(order.id, "cancelled")}
                          >
                            整单取消
                          </button>
                        </div>
                      </footer>
                    </article>
                  ))}
                </div>
              </>
            )}
          </section>
        </section>
      )}

      {tab === "menu" && (
        <section className="admin-content">
          <div className="admin-section-title">
            <h1>{editingId ? "编辑菜品" : "上架新菜"}</h1>
            <span>图片、价格、分类都可以修改</span>
          </div>
          <form className="dish-form" onSubmit={saveDish}>
            <label className="upload-box">
              {form.imageUrl ? (
                <img src={form.imageUrl} alt="菜品图片" />
              ) : (
                <>
                  <b>＋</b>
                  <span>上传菜品图片</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(event) => uploadImage(event.target.files?.[0])}
              />
            </label>
            <div className="form-fields">
              <label>
                <span>菜品名称</span>
                <input
                  required
                  value={form.name}
                  onChange={(event) =>
                    setForm({ ...form, name: event.target.value })
                  }
                  placeholder="例如：招牌牛肉饭"
                />
              </label>
              <div className="form-row">
                <label>
                  <span>价格（元）</span>
                  <input
                    required
                    min="0"
                    step="1"
                    type="number"
                    value={form.price}
                    onChange={(event) =>
                      setForm({ ...form, price: event.target.value })
                    }
                  />
                </label>
                <label>
                  <span>分类</span>
                  <select
                    value={form.category}
                    onChange={(event) =>
                      setForm({ ...form, category: event.target.value })
                    }
                  >
                    <option>主食</option>
                    <option>小吃</option>
                    <option>热菜</option>
                    <option>饮料</option>
                    <option>甜品</option>
                  </select>
                </label>
              </div>
              <label>
                <span>菜品介绍</span>
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm({ ...form, description: event.target.value })
                  }
                  placeholder="可以填写口味、食材、推荐说明"
                />
              </label>
              <div className="form-actions">
                {editingId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setForm(emptyForm);
                    }}
                  >
                    取消编辑
                  </button>
                )}
                <button className="save-button" disabled={saving}>
                  {saving ? "保存中…" : editingId ? "保存修改" : "确认上架"}
                </button>
              </div>
            </div>
          </form>

          <div className="admin-section-title list-title">
            <h1>已上架菜品</h1>
            <span>{dishes.length} 道</span>
          </div>
          <div className="dish-admin-list">
            {dishes.map((dish) => (
              <article className={!dish.isActive ? "inactive" : ""} key={dish.id}>
                <div className="dish-thumb">
                  {dish.imageUrl ? <img src={dish.imageUrl} alt={dish.name} /> : "🍽"}
                </div>
                <div>
                  <strong>{dish.name}</strong>
                  <span>
                    {dish.category} · ¥{dish.price}
                  </span>
                  <small>{dish.isActive ? "前台可见" : "已下架"}</small>
                </div>
                <button onClick={() => editDish(dish)}>编辑</button>
                <button onClick={() => toggleDish(dish)}>
                  {dish.isActive ? "下架" : "上架"}
                </button>
              </article>
            ))}
          </div>
        </section>
      )}

      {tab === "tables" && (
        <section className="admin-content">
          <div className="admin-section-title">
            <h1>桌位二维码</h1>
            <span>扫码后直接进入对应座位点单页</span>
          </div>
          <div className="admin-table-grid qr-table-grid">
            {TABLES.map((table) => (
              <QrTableCard
                key={table.number}
                table={table}
                origin={origin}
                onCopy={() => {
                  navigator.clipboard.writeText(`${origin}/seat/${table.token}`);
                  setMessage(`${table.number} 号桌链接已复制`);
                }}
              />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

function QrTableCard({
  table,
  origin,
  onCopy,
}: {
  table: (typeof TABLES)[number];
  origin: string;
  onCopy: () => void;
}) {
  const [qr, setQr] = useState("");
  const url = origin ? `${origin}/seat/${table.token}` : "";

  useEffect(() => {
    if (!url) return;
    QRCode.toDataURL(url, {
      width: 240,
      margin: 1,
      color: { dark: "#254532", light: "#ffffff" },
    }).then(setQr);
  }, [url]);

  return (
    <article className="qr-card">
      <div className="qr-card-heading">
        <span>{String(table.number).padStart(2, "0")}</span>
        <div>
          <strong>{table.number} 号桌</strong>
          <small>扫码即可进入</small>
        </div>
      </div>
      {qr ? (
        <img src={qr} alt={`${table.number}号桌二维码`} />
      ) : (
        <div className="qr-loading">二维码生成中…</div>
      )}
      <small className="qr-url">{url}</small>
      <div className="qr-actions">
        <a href={qr} download={`xiaoman-table-${table.number}.png`}>
          下载二维码
        </a>
        <button onClick={onCopy}>复制链接</button>
      </div>
    </article>
  );
}
