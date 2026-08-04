export default function Home() {
  return (
    <main className="portal-page">
      <header className="portal-header">
        <div className="brand-mark">小</div>
        <div><strong>小满食堂</strong><span>店内自助点单系统</span></div>
        <a href="/admin" className="admin-entry">店家登录</a>
      </header>
      <section className="portal-hero scan-hero">
        <p>WELCOME TO XIAOMAN</p>
        <h1>扫码入座，<br />轻松点餐。</h1>
        <span>请扫描桌面上的专属二维码开始点单</span>
        <div aria-hidden="true">🍲</div>
      </section>
      <section className="scan-guide">
        <span>01</span><div><strong>扫描本桌二维码</strong><small>每张桌子都有独立入口</small></div>
        <i>→</i><span>02</span><div><strong>点餐并提交</strong><small>厨房会直接收到订单</small></div>
        <i>→</i><span>03</span><div><strong>用餐后申请结账</strong><small>店家确认收款后结清</small></div>
      </section>
      <section className="no-table-notice"><div>⌁</div><h2>需要桌面二维码</h2><p>为避免点错桌号，顾客不能在这里手动选择座位。请扫描您桌面上的二维码。</p></section>
      <footer className="portal-footer">小满食堂 · 今日营业至 21:30</footer>
    </main>
  );
}
