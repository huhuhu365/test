import Link from "next/link";

export default function Home() {
  return (
    <main className="portal-page">
      <header className="portal-header">
        <div className="brand-mark">小</div>
        <div><strong>小满食堂</strong><span>店内自助点单系统</span></div>
        <Link href="/admin" className="admin-entry">店家登录</Link>
      </header>
      <section className="portal-hero">
        <p>WELCOME TO XIAOMAN</p>
        <h1>请先选择<br />您的桌号</h1>
        <span>每张桌子都有独立点单入口，订单不会混淆</span>
        <div aria-hidden="true">🍲</div>
      </section>
      <section className="table-picker">
        <div className="section-heading"><h2>10 张桌位</h2><span>点击桌号开始点单</span></div>
        <div className="table-grid">
          {Array.from({ length: 10 }, (_, index) => index + 1).map((number) => (
            <Link href={`/table/${number}`} key={number}>
              <span>{String(number).padStart(2, "0")}</span>
              <strong>{number} 号桌</strong>
              <small>进入点单 →</small>
            </Link>
          ))}
        </div>
      </section>
      <footer className="portal-footer">小满食堂 · 今日营业至 21:30</footer>
    </main>
  );
}
