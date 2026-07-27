import './style.css'

const app = document.querySelector('#app')
const fmt = new Intl.NumberFormat('zh-CN', { notation: 'compact', maximumFractionDigits: 1 })
const full = new Intl.NumberFormat('zh-CN')
const dateFmt = new Intl.DateTimeFormat('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
let timer

function timeLeft(iso) {
  if (!iso) return '暂无重置时间'
  const ms = new Date(iso) - Date.now()
  if (ms <= 0) return '即将重置'
  const days = Math.floor(ms / 86400000)
  const hours = Math.floor(ms % 86400000 / 3600000)
  return `${days} 天 ${hours} 小时后重置`
}

function metric(label, value, note, color = '') {
  return `<article class="metric"><div class="metric-top"><span>${label}</span><i class="dot ${color}"></i></div><strong>${fmt.format(value)}</strong><small>${note}</small></article>`
}

function render(data) {
  const rate = data.rateLimit?.usedPercent ?? 0
  const remaining = Math.max(0, 100 - rate)
  const recentMax = Math.max(...data.recent.map(s => s.total), 1)
  app.innerHTML = `
    <div class="shell">
      <header>
        <div class="brand"><span class="mark">C</span><div><b>Codex Pulse</b><small>本地用量监视器</small></div></div>
        <div class="header-actions"><span class="live"><i></i> 实时读取中</span><button id="refresh" aria-label="立即刷新">↻</button></div>
      </header>
      <main>
        <section class="hero">
          <div><p class="eyebrow">本周概览</p><h1>你的 Codex 使用情况</h1><p class="sub">统计来自本机 Codex 会话，只读取用量字段。</p></div>
          <div class="updated">更新于 ${dateFmt.format(new Date(data.generatedAt))}</div>
        </section>
        <section class="metrics">
          ${metric('今日 Tokens', data.today.total, `${data.today.sessions} 个会话`, 'orange')}
          ${metric('本周 Tokens', data.week.total, `${data.week.sessions} 个会话`, 'blue')}
          ${metric('缓存 Tokens', data.week.cached, `缓存占比 ${data.week.input ? Math.round(data.week.cached / data.week.input * 100) : 0}%`, 'green')}
          ${metric('输出 Tokens', data.week.output, `其中推理 ${fmt.format(data.week.reasoning)}`, 'violet')}
        </section>
        <section class="grid">
          <article class="panel quota">
            <div class="panel-title"><div><p class="eyebrow">限额周期</p><h2>剩余可用量</h2></div><span>${timeLeft(data.rateLimit?.resetsAt)}</span></div>
            <div class="quota-body">
              <div class="ring" style="--used:${rate * 3.6}deg"><div><strong>${remaining.toFixed(0)}%</strong><small>可用</small></div></div>
              <div class="quota-copy"><b>已使用 ${rate}%</b><p>当前周期约 ${Math.round((data.rateLimit?.windowMinutes || 0) / 1440)} 天。限额来自 Codex 返回的最新状态。</p><div class="bar"><i style="width:${rate}%"></i></div><div class="bar-label"><span>已用 ${rate}%</span><span>剩余 ${remaining.toFixed(0)}%</span></div></div>
            </div>
          </article>
          <article class="panel breakdown">
            <div class="panel-title"><div><p class="eyebrow">Token 构成</p><h2>本周明细</h2></div><span>${full.format(data.week.total)} 总量</span></div>
            <div class="parts">
              ${[['输入',data.week.input,'#151515'],['缓存',data.week.cached,'#6e8f7a'],['输出',data.week.output,'#db7a4a'],['推理',data.week.reasoning,'#77739b']].map(([n,v,c]) => `<div><span><i style="background:${c}"></i>${n}</span><b>${full.format(v)}</b></div>`).join('')}
            </div>
          </article>
        </section>
        <section class="panel recent">
          <div class="panel-title"><div><p class="eyebrow">最近活动</p><h2>会话用量</h2></div><span>最近 ${data.recent.length} 个</span></div>
          <div class="session-list">${data.recent.map(s => `<div class="session"><div class="session-time"><b>${dateFmt.format(new Date(s.updatedAt))}</b><small>${s.id.slice(0,16)}…</small></div><div class="spark"><i style="width:${Math.max(2,s.total/recentMax*100)}%"></i></div><div class="session-value"><b>${fmt.format(s.total)}</b><small>tokens</small></div></div>`).join('') || '<p class="empty">还没有找到用量记录</p>'}</div>
        </section>
      </main>
      <footer>Codex Pulse · 数据仅保留在这台电脑上</footer>
    </div>`
  document.querySelector('#refresh').addEventListener('click', load)
}

async function load() {
  try {
    const res = await fetch('/api/usage', { cache: 'no-store' })
    if (!res.ok) throw new Error('读取失败')
    render(await res.json())
  } catch (error) {
    app.innerHTML = `<div class="error"><b>暂时无法读取用量</b><p>${error.message}</p><button onclick="location.reload()">重新加载</button></div>`
  }
}

load()
timer = setInterval(load, 30000)
