import { defineConfig } from 'vite'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

const sessionsRoot = path.join(os.homedir(), '.codex', 'sessions')

async function walk(dir, out = []) {
  try {
    for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) await walk(full, out)
      else if (entry.name.endsWith('.jsonl')) out.push(full)
    }
  } catch {}
  return out
}

function safeJson(line) {
  try { return JSON.parse(line) } catch { return null }
}

async function getUsage() {
  const files = await walk(sessionsRoot)
  const sessions = []
  let latestRate = null
  let latestTimestamp = null

  for (const file of files) {
    let text
    try { text = await fs.readFile(file, 'utf8') } catch { continue }
    let last = null
    let firstTimestamp = null
    for (const line of text.split(/\r?\n/)) {
      if (!line.includes('"token_count"')) continue
      const row = safeJson(line)
      if (row?.payload?.type !== 'token_count' || !row.payload.info?.total_token_usage) continue
      firstTimestamp ||= row.timestamp
      last = row
      if (!latestTimestamp || row.timestamp > latestTimestamp) {
        latestTimestamp = row.timestamp
        latestRate = row.payload.rate_limits || null
      }
    }
    if (!last) continue
    const u = last.payload.info.total_token_usage
    sessions.push({
      id: path.basename(file).replace(/^rollout-/, '').replace(/\.jsonl$/, ''),
      startedAt: firstTimestamp,
      updatedAt: last.timestamp,
      input: u.input_tokens || 0,
      cached: u.cached_input_tokens || 0,
      output: u.output_tokens || 0,
      reasoning: u.reasoning_output_tokens || 0,
      total: u.total_tokens || 0,
      contextWindow: last.payload.info.model_context_window || 0
    })
  }

  sessions.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  const now = Date.now()
  const todayKey = new Date().toLocaleDateString('en-CA')
  const today = sessions.filter(s => new Date(s.updatedAt).toLocaleDateString('en-CA') === todayKey)
  const week = sessions.filter(s => now - new Date(s.updatedAt).getTime() < 7 * 86400000)
  const sum = list => list.reduce((a, s) => ({
    input: a.input + s.input, cached: a.cached + s.cached, output: a.output + s.output,
    reasoning: a.reasoning + s.reasoning, total: a.total + s.total
  }), { input: 0, cached: 0, output: 0, reasoning: 0, total: 0 })

  const primary = latestRate?.primary
  return {
    generatedAt: new Date().toISOString(),
    today: { ...sum(today), sessions: today.length },
    week: { ...sum(week), sessions: week.length },
    all: { ...sum(sessions), sessions: sessions.length },
    rateLimit: primary ? {
      usedPercent: primary.used_percent,
      windowMinutes: primary.window_minutes,
      resetsAt: primary.resets_at ? new Date(primary.resets_at * 1000).toISOString() : null
    } : null,
    recent: sessions.slice(0, 8)
  }
}

export default defineConfig({
  server: { port: 5180, strictPort: true },
  plugins: [{
    name: 'codex-usage-api',
    configureServer(server) {
      server.middlewares.use('/api/usage', async (_req, res) => {
        try {
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.setHeader('Cache-Control', 'no-store')
          res.end(JSON.stringify(await getUsage()))
        } catch (error) {
          res.statusCode = 500
          res.end(JSON.stringify({ error: error.message }))
        }
      })
    }
  }]
})
