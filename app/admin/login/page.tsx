"use client";

import { FormEvent, useState } from "react";

export default function LocalAdminLogin() {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function login(event: FormEvent) {
    event.preventDefault(); setLoading(true); setError("");
    const response = await fetch("/api/admin/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ username, password }) });
    const data = await response.json();
    if (!response.ok) { setError(data.error || "登录失败"); setLoading(false); return; }
    const returnTo = new URLSearchParams(window.location.search).get("return_to");
    window.location.href = returnTo?.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/admin";
  }

  return <main className="login-page">
    <section className="login-card">
      <div className="login-brand"><div className="brand-mark">小</div><div><strong>小满食堂</strong><span>店家管理后台</span></div></div>
      <p className="login-eyebrow">LOCAL STORE ADMIN</p>
      <h1>欢迎回来</h1>
      <p className="login-tip">登录后可以管理菜品、图片和各桌订单</p>
      <form onSubmit={login}>
        <label><span>店家账号</span><input autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} /></label>
        <label><span>登录密码</span><input autoFocus type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="请输入初始密码" /></label>
        {error && <p className="login-error">{error}</p>}
        <button disabled={loading}>{loading ? "正在登录…" : "登录店家后台"}</button>
      </form>
      <small>本地初始账号：admin　密码：123456</small>
      <a href="/">← 返回顾客点餐</a>
    </section>
  </main>;
}
