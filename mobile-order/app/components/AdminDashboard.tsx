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
    ready: "可出餐",
    completed: "已出餐",
    cancelled: "已取消",
};

const emptyForm = {
    name: "",
    description: "",
    price: "",
    category: "主食",
    imageUrl: "",
};

function formatDateTime(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat("zh-CN", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    }).format(date);
}

function isToday(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return false;

    const now = new Date();
    return (
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth() &&
        date.getDate() === now.getDate()
    );
}

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

    const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
            (result) => (result ? resolve(result) : reject(new Error("图片压缩失败"))),
            "image/jpeg",
            0.76,
        );
    });

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
    const [refreshing, setRefreshing] = useState(false);
    const [showTodayHistory, setShowTodayHistory] = useState(false);

    const loadOrders = useCallback(async () => {
        try {
            const data = await fetch("/api/orders", { cache: "no-store" }).then(readJson);
            setOrders(data.orders ?? []);
        } catch (error) {
            setMessage(error instanceof Error ? error.message : "订单读取失败");
        }
    }, []);

    const loadDishes = useCallback(async () => {
        try {
            const data = await fetch("/api/admin/dishes", { cache: "no-store" }).then(readJson);
            setDishes(data.dishes ?? []);
        } catch (error) {
            setMessage(error instanceof Error ? error.message : "菜单读取失败");
        }
    }, []);

    const loadTableDetail = useCallback(async (tableNumber: number) => {
        setTableLoading(true);
        try {
            const data = await fetch(`/api/admin/tables/${tableNumber}`, {
                cache: "no-store",
            }).then(readJson);
            setTableDetail(data.table ?? null);
        } catch (error) {
            setMessage(error instanceof Error ? error.message : "桌台明细读取失败");
        } finally {
            setTableLoading(false);
        }
    }, []);

    const refreshOrdersView = useCallback(async () => {
        setRefreshing(true);
        try {
            await loadOrders();
            await loadTableDetail(selectedTable);
        } finally {
            setRefreshing(false);
        }
    }, [loadOrders, loadTableDetail, selectedTable]);

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

        void loadOrders();
        void loadDishes();
        void loadTableDetail(selectedTable);
    }, [loadDishes, loadOrders, loadTableDetail, publicOrigin, selectedTable]);

    const unpaidOrders = useMemo(
        () => orders.filter((order) => order.paymentStatus !== "paid" && order.status !== "cancelled"),
        [orders],
    );

    const todayOrders = useMemo(() => orders.filter((order) => isToday(order.createdAt)), [orders]);

    const tableSummaries = useMemo(
        () =>
            TABLES.map((table) => {
                const activeOrders = orders.filter(
                    (order) =>
                        order.tableNumber === table.number &&
                        order.paymentStatus !== "paid" &&
                        order.status !== "cancelled",
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

    const checkoutTables = useMemo(
        () =>
            Array.from(
                new Set(
                    orders
                        .filter(
                            (order) =>
                                order.paymentStatus === "requested" &&
                                order.status !== "cancelled",
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
                            order.status !== "cancelled",
                    ),
                }))
                .filter((bill) => bill.orders.length),
        [orders],
    );

    async function saveDish(event: FormEvent) {
        event.preventDefault();
        setSaving(true);
        setMessage("");

        try {
            const payload = { ...form, price: Number(form.price) };
            const response = await fetch(
                editingId ? `/api/admin/dishes/${editingId}` : "/api/admin/dishes",
                {
                    method: editingId ? "PATCH" : "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify(payload),
                },
            );

            await readJson(response);
            setMessage(editingId ? "菜品已更新" : "菜品已新增");
            setForm(emptyForm);
            setEditingId(null);
            await loadDishes();
        } catch (error) {
            setMessage(error instanceof Error ? error.message : "保存菜品失败");
        } finally {
            setSaving(false);
        }
    }

    async function uploadImage(file?: File) {
        if (!file) return;
        setSaving(true);

        try {
            const body = new FormData();
            body.append("file", await compressImage(file));
            const response = await fetch("/api/admin/upload", {
                method: "POST",
                body,
            });
            const data = await readJson(response);
            setForm((current) => ({ ...current, imageUrl: data.url }));
        } catch (error) {
            setMessage(error instanceof Error ? error.message : "图片上传失败");
        } finally {
            setSaving(false);
        }
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
        try {
            await fetch(`/api/admin/dishes/${dish.id}`, {
                method: "PATCH",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ isActive: !dish.isActive }),
            });
            await loadDishes();
        } catch {
            setMessage("切换菜品状态失败");
        }
    }

    async function updateOrder(id: number, status: string) {
        try {
            await fetch(`/api/admin/orders/${id}`, {
                method: "PATCH",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ status }),
            });
            await loadOrders();
            await loadTableDetail(selectedTable);
        } catch {
            setMessage("更新订单状态失败");
        }
    }

    async function confirmPaid(tableNumber: number) {
        try {
            const response = await fetch(`/api/admin/bills/${tableNumber}`, {
                method: "PATCH",
            });
            await readJson(response);
            setMessage(`${tableNumber} 号桌已确认收款`);
            await loadOrders();
            await loadTableDetail(tableNumber);
        } catch (error) {
            setMessage(error instanceof Error ? error.message : "确认结单失败");
        }
    }

    async function changeItemQuantity(itemId: number, action: "decrease" | "remove") {
        try {
            const response = await fetch(`/api/admin/order-items/${itemId}`, {
                method: "PATCH",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ action }),
            });
            const data = await readJson(response);
            setMessage(data.message || "订单项已更新");
            await loadOrders();
            await loadTableDetail(selectedTable);
        } catch (error) {
            setMessage(error instanceof Error ? error.message : "修改订单项失败");
        }
    }

    return (
        <main className="admin-page">
            <header className="admin-header">
                <div className="brand-mark">店</div>
                <div>
                    <strong>小满点单后台</strong>
                    <span>{userName}</span>
                </div>
                <button type="button" onClick={logout} className="logout">
                    退出登录
                </button>
            </header>

            <section className="admin-summary">
                <div>
                    <span>新订单</span>
                    <strong>{unpaidOrders.filter((order) => order.status === "new").length}</strong>
                    <small>等待处理</small>
                </div>
                <div>
                    <span>制作中</span>
                    <strong>{unpaidOrders.filter((order) => order.status === "preparing").length}</strong>
                    <small>厨房处理中</small>
                </div>
                <div className="checkout-summary">
                    <span>待结单桌数</span>
                    <strong>{checkoutTables.length}</strong>
                    <small>顾客已点结单</small>
                </div>
                <div>
                    <span>今日订单</span>
                    <strong>{todayOrders.length}</strong>
                    <small>当天可回看记录</small>
                </div>
            </section>

            <nav className="admin-tabs">
                <button className={tab === "orders" ? "active" : ""} onClick={() => setTab("orders")}>
                    订单管理
                </button>
                <button className={tab === "menu" ? "active" : ""} onClick={() => setTab("menu")}>
                    菜单管理
                </button>
                <button className={tab === "tables" ? "active" : ""} onClick={() => setTab("tables")}>
                    桌号二维码
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
                                <h1>结单提醒</h1>
                                <span>顾客点结单后，会在这里等商家确认已收款</span>
                            </div>
                            <div className="checkout-request-grid">
                                {checkoutTables.map((bill) => (
                                    <article key={bill.tableNumber}>
                                        <div className="checkout-table-number">
                                            <span>TABLE</span>
                                            <strong>{bill.tableNumber}</strong>
                                        </div>
                                        <div>
                                            <strong>{bill.tableNumber} 号桌申请结单</strong>
                                            <span>{bill.orders.length} 笔订单</span>
                                        </div>
                                        <b>¥{bill.orders.reduce((sum, order) => sum + order.total, 0)}</b>
                                        <button onClick={() => confirmPaid(bill.tableNumber)}>
                                            确认已收款
                                        </button>
                                    </article>
                                ))}
                            </div>
                        </>
                    )}

                    <div className="admin-section-title admin-section-title-with-action">
                        <div>
                            <h1>桌台概览</h1>
                            <span>只要还没收款，这桌就会继续显示</span>
                        </div>
                        <button
                            type="button"
                            className="admin-refresh-button"
                            onClick={refreshOrdersView}
                            disabled={refreshing}
                        >
                            {refreshing ? "刷新中..." : "刷新订单"}
                        </button>
                    </div>

                    <div className="table-state-grid">
                        {tableSummaries.map((table) => (
                            <button
                                key={table.tableNumber}
                                type="button"
                                className={`table-state-card ${selectedTable === table.tableNumber ? "active" : ""} ${table.requestedCheckout ? "requested" : ""}`}
                                onClick={() => {
                                    setSelectedTable(table.tableNumber);
                                    void loadTableDetail(table.tableNumber);
                                }}
                            >
                                <div className="table-state-top">
                                    <strong>{table.tableNumber} 号桌</strong>
                                    <span>
                                        {table.requestedCheckout
                                            ? "待结单"
                                            : table.activeOrders.length
                                              ? "有订单"
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
                        <h1>未结订单</h1>
                        <span>已出餐但未收款的订单也会继续显示</span>
                    </div>

                    {unpaidOrders.length === 0 ? (
                        <div className="admin-empty">当前没有未结订单</div>
                    ) : (
                        <div className="order-grid">
                            {unpaidOrders.map((order) => (
                                <OrderCard
                                    key={`unpaid-${order.id}`}
                                    order={order}
                                    statusMap={statusMap}
                                    showActions
                                    onPreparing={() => updateOrder(order.id, "preparing")}
                                    onReady={() => updateOrder(order.id, "ready")}
                                    onCompleted={() => updateOrder(order.id, "completed")}
                                    onCancel={() => updateOrder(order.id, "cancelled")}
                                />
                            ))}
                        </div>
                    )}

                    <div className="admin-section-title list-title admin-section-title-with-action">
                        <div>
                            <h1>全部订单记录</h1>
                            <span>默认收起，只显示当天订单，点开后可回查时间</span>
                        </div>
                        <button
                            type="button"
                            className="admin-refresh-button"
                            onClick={() => setShowTodayHistory((current) => !current)}
                        >
                            {showTodayHistory ? "收起记录" : `查看今日订单 (${todayOrders.length})`}
                        </button>
                    </div>

                    {showTodayHistory && (
                        todayOrders.length === 0 ? (
                            <div className="admin-empty">今天还没有订单记录</div>
                        ) : (
                            <div className="order-grid">
                                {todayOrders.map((order) => (
                                    <OrderCard
                                        key={`history-${order.id}`}
                                        order={order}
                                        statusMap={statusMap}
                                        historyMode
                                        historyAction={
                                            order.paymentStatus !== "paid" && order.status !== "cancelled"
                                                ? () => {
                                                      setSelectedTable(order.tableNumber);
                                                      void loadTableDetail(order.tableNumber);
                                                  }
                                                : undefined
                                        }
                                    />
                                ))}
                            </div>
                        )
                    )}

                    <div className="admin-section-title detail-title admin-section-title-with-action">
                        <div>
                            <h1>{selectedTable} 号桌明细</h1>
                            <span>只有真正收款完成后，这桌才会从这里清空</span>
                        </div>
                        <button
                            type="button"
                            className="admin-refresh-button"
                            onClick={() => loadTableDetail(selectedTable)}
                            disabled={tableLoading}
                        >
                            {tableLoading ? "刷新中..." : "刷新本桌"}
                        </button>
                    </div>

                    <section className="table-detail-panel">
                        {tableLoading ? (
                            <div className="admin-empty">正在读取桌台明细...</div>
                        ) : !tableDetail || tableDetail.activeOrders.length === 0 ? (
                            <div className="admin-empty">{selectedTable} 号桌当前没有未结订单</div>
                        ) : (
                            <>
                                <div className="table-detail-summary">
                                    <div>
                                        <span>当前桌号</span>
                                        <strong>{tableDetail.tableNumber} 号桌</strong>
                                    </div>
                                    <div>
                                        <span>菜品数量</span>
                                        <strong>{tableDetail.itemCount} 份</strong>
                                    </div>
                                    <div>
                                        <span>当前合计</span>
                                        <strong>¥{tableDetail.total}</strong>
                                    </div>
                                </div>

                                <div className="table-order-list">
                                    {tableDetail.activeOrders.map((order) => (
                                        <article className="table-order-card" key={order.id}>
                                            <header>
                                                <div>
                                                    <strong>订单 #{order.orderNumber}</strong>
                                                    <span>
                                                        {statusMap[order.status] || order.status} · {formatDateTime(order.createdAt)}
                                                    </span>
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
                                                                减少一份
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="danger-light"
                                                                onClick={() => changeItemQuantity(item.id, "remove")}
                                                            >
                                                                直接移除
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {order.note && <p className="order-note">备注：{order.note}</p>}

                                            <footer>
                                                <strong>
                                                    {order.paymentStatus === "requested"
                                                        ? "顾客已申请结单"
                                                        : "可继续修改订单"}
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
                                                    {(order.status === "ready" || order.status === "completed") && (
                                                        <button onClick={() => updateOrder(order.id, "completed")}>
                                                            标记已出餐
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
                        <h1>{editingId ? "编辑菜品" : "新增菜品"}</h1>
                        <span>支持上传图片、修改价格和菜品介绍</span>
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
                                    onChange={(event) => setForm({ ...form, name: event.target.value })}
                                    placeholder="例如：招牌牛肉饭"
                                />
                            </label>

                            <div className="form-row">
                                <label>
                                    <span>价格</span>
                                    <input
                                        required
                                        min="0"
                                        step="1"
                                        type="number"
                                        value={form.price}
                                        onChange={(event) => setForm({ ...form, price: event.target.value })}
                                    />
                                </label>

                                <label>
                                    <span>分类</span>
                                    <select
                                        value={form.category}
                                        onChange={(event) => setForm({ ...form, category: event.target.value })}
                                    >
                                        <option>主食</option>
                                        <option>小吃</option>
                                        <option>饮品</option>
                                        <option>甜品</option>
                                        <option>加料</option>
                                    </select>
                                </label>
                            </div>

                            <label>
                                <span>菜品介绍</span>
                                <textarea
                                    value={form.description}
                                    onChange={(event) => setForm({ ...form, description: event.target.value })}
                                    placeholder="可以写口味、配料、推荐说明"
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
                                    {saving ? "保存中..." : editingId ? "保存修改" : "新增菜品"}
                                </button>
                            </div>
                        </div>
                    </form>

                    <div className="admin-section-title list-title">
                        <h1>已上架菜品</h1>
                        <span>{dishes.length} 个</span>
                    </div>

                    <div className="dish-admin-list">
                        {dishes.map((dish) => (
                            <article className={!dish.isActive ? "inactive" : ""} key={dish.id}>
                                <div className="dish-thumb">
                                    {dish.imageUrl ? <img src={dish.imageUrl} alt={dish.name} /> : "🍜"}
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
                        <h1>桌号二维码</h1>
                        <span>每桌都有独立入口，扫码后直接进入对应座位点单页</span>
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

function OrderCard({
    order,
    statusMap,
    showActions,
    historyMode,
    historyAction,
    onPreparing,
    onReady,
    onCompleted,
    onCancel,
}: {
    order: Order;
    statusMap: Record<string, string>;
    showActions?: boolean;
    historyMode?: boolean;
    historyAction?: () => void;
    onPreparing?: () => void;
    onReady?: () => void;
    onCompleted?: () => void;
    onCancel?: () => void;
}) {
    return (
        <article className={`order-card status-${order.status}`}>
            <header>
                <div>
                    <strong>{order.tableNumber} 号桌</strong>
                    <span>
                        #{order.orderNumber} · {formatDateTime(order.createdAt)}
                    </span>
                </div>
                <b>{statusMap[order.status] || order.status}</b>
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
                <strong>
                    合计 ¥{order.total}
                    {historyMode ? ` · ${order.paymentStatus}` : ""}
                </strong>
                <div>
                    {showActions && order.status === "new" && onPreparing && (
                        <button onClick={onPreparing}>开始制作</button>
                    )}
                    {showActions && order.status === "preparing" && onReady && (
                        <button onClick={onReady}>制作完成</button>
                    )}
                    {showActions &&
                        (order.status === "ready" || order.status === "completed") &&
                        onCompleted && <button onClick={onCompleted}>标记已出餐</button>}
                    {showActions && onCancel && (
                        <button className="muted-action" onClick={onCancel}>
                            取消
                        </button>
                    )}
                    {historyMode && historyAction && (
                        <button className="muted-action" onClick={historyAction}>
                            查看本桌
                        </button>
                    )}
                </div>
            </footer>
        </article>
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
                    <small>扫码即可点单</small>
                </div>
            </div>

            {qr ? (
                <img src={qr} alt={`${table.number}号桌二维码`} />
            ) : (
                <div className="qr-loading">二维码生成中...</div>
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
