import json
import os
import threading
from datetime import datetime, timedelta, timezone
from pathlib import Path
import sys

# Bundled Python on Windows may not advertise its Tcl/Tk library paths.
_runtime = Path(sys.executable).parent
os.environ.setdefault('TCL_LIBRARY', str(_runtime / 'tcl' / 'tcl8.6'))
os.environ.setdefault('TK_LIBRARY', str(_runtime / 'tcl' / 'tk8.6'))
import tkinter as tk

BG = '#F1F0EB'
CARD = '#FBFAF7'
INK = '#191A18'
MUTED = '#77766F'
BORDER = '#DDDAD2'
ORANGE = '#D97B4D'
GREEN = '#708F79'
BLUE = '#6687A0'
VIOLET = '#827BA0'
CACHE_FILE = Path(__file__).with_name('.usage-cache.json')


def compact(number):
    if number >= 100_000_000:
        return f'{number / 100_000_000:.1f}亿'
    if number >= 10_000:
        return f'{number / 10_000:.1f}万'
    return f'{number:,}'


def local_date(iso):
    return datetime.fromisoformat(iso.replace('Z', '+00:00')).astimezone()


class UsageReader:
    def __init__(self):
        self.files = {}
        self._load_cache()

    def _load_cache(self):
        try:
            raw = json.loads(CACHE_FILE.read_text(encoding='utf-8'))
            if raw.get('version') == 1:
                self.files = raw.get('files', {})
        except (OSError, ValueError, TypeError):
            self.files = {}

    def _save_cache(self):
        try:
            CACHE_FILE.write_text(json.dumps({'version': 1, 'files': self.files}), encoding='utf-8')
        except OSError:
            pass

    @staticmethod
    def _parse_file(file):
        last, first_time = None, None
        try:
            with file.open('r', encoding='utf-8') as stream:
                for line in stream:
                    if '"token_count"' not in line:
                        continue
                    try:
                        row = json.loads(line)
                    except json.JSONDecodeError:
                        continue
                    payload = row.get('payload', {})
                    info = payload.get('info') or {}
                    usage = info.get('total_token_usage')
                    if payload.get('type') != 'token_count' or not usage:
                        continue
                    first_time = first_time or row.get('timestamp')
                    last = row
        except (OSError, UnicodeError):
            return None
        if not last:
            return None
        info = last['payload']['info']
        u = info['total_token_usage']
        rate = last['payload'].get('rate_limits') or {}
        return {
            'id': file.stem.replace('rollout-', ''),
            'updated': last['timestamp'],
            'input': u.get('input_tokens', 0),
            'cached': u.get('cached_input_tokens', 0),
            'output': u.get('output_tokens', 0),
            'reasoning': u.get('reasoning_output_tokens', 0),
            'total': u.get('total_tokens', 0),
            'rate': rate.get('primary'),
        }

    def read(self):
        root = Path.home() / '.codex' / 'sessions'
        seen, changed = set(), False
        for file in root.rglob('*.jsonl') if root.exists() else []:
            key = str(file)
            seen.add(key)
            try:
                stat = file.stat()
            except OSError:
                continue
            signature = f'{stat.st_mtime_ns}:{stat.st_size}'
            cached = self.files.get(key)
            if cached and cached.get('signature') == signature:
                continue
            session = self._parse_file(file)
            self.files[key] = {'signature': signature, 'session': session}
            changed = True
        for key in list(self.files):
            if key not in seen:
                del self.files[key]
                changed = True
        if changed:
            self._save_cache()
        sessions = [item['session'] for item in self.files.values() if item.get('session')]
        return summarize(sessions)


def summarize(sessions):
    sessions.sort(key=lambda x: x['updated'], reverse=True)
    now = datetime.now().astimezone()
    today = [s for s in sessions if local_date(s['updated']).date() == now.date()]
    week = [s for s in sessions if now - local_date(s['updated']) < timedelta(days=7)]

    def total(items):
        keys = ('input', 'cached', 'output', 'reasoning', 'total')
        result = {key: sum(item[key] for item in items) for key in keys}
        result['sessions'] = len(items)
        return result

    primary = (sessions[0].get('rate') if sessions else None) or {}
    reset = primary.get('resets_at')
    return {
        'today': total(today), 'week': total(week), 'recent': sessions[:6],
        'used': float(primary.get('used_percent', 0)),
        'reset': datetime.fromtimestamp(reset, timezone.utc).astimezone() if reset else None,
    }


class Card(tk.Frame):
    def __init__(self, parent, **kwargs):
        super().__init__(parent, bg=CARD, highlightbackground=BORDER,
                         highlightthickness=1, bd=0, **kwargs)


class PulseApp(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title('Codex Pulse · 用量监视器')
        self.geometry('980x720')
        self.minsize(820, 640)
        self.configure(bg=BG)
        self.option_add('*Font', ('Microsoft YaHei UI', 10))
        self.reader = UsageReader()
        self.refreshing = False
        self.refresh_job = None
        self.protocol('WM_DELETE_WINDOW', self.destroy)
        self._build()
        self.refresh()

    def label(self, parent, text='', size=10, weight='normal', color=INK, **kwargs):
        return tk.Label(parent, text=text, bg=parent.cget('bg'), fg=color,
                        font=('Microsoft YaHei UI', size, weight), **kwargs)

    def _build(self):
        header = tk.Frame(self, bg='#F8F7F3', height=70, highlightbackground=BORDER, highlightthickness=1)
        header.pack(fill='x'); header.pack_propagate(False)
        mark = tk.Label(header, text='C', bg=INK, fg='white', font=('Segoe UI', 15, 'bold'), width=3, height=1)
        mark.pack(side='left', padx=(28, 12), pady=17)
        title_box = tk.Frame(header, bg='#F8F7F3'); title_box.pack(side='left')
        self.label(title_box, 'Codex Pulse', 12, 'bold').pack(anchor='w')
        self.label(title_box, '本地桌面用量监视器', 8, color=MUTED).pack(anchor='w')
        self.status = self.label(header, '● 读取中', 9, color=GREEN)
        self.status.pack(side='right', padx=(12, 28))
        tk.Button(header, text='↻', command=self.refresh, bg='white', fg=INK, relief='flat',
                  font=('Segoe UI', 16), cursor='hand2', width=3).pack(side='right')

        body = tk.Frame(self, bg=BG); body.pack(fill='both', expand=True, padx=28, pady=22)
        self.label(body, '本周概览', 8, 'bold', MUTED).pack(anchor='w')
        self.label(body, '你的 Codex 使用情况', 25, 'bold').pack(anchor='w', pady=(3, 2))
        self.label(body, '统计来自本机 Codex 会话，只读取用量字段。', 9, color=MUTED).pack(anchor='w', pady=(0, 18))

        metrics = tk.Frame(body, bg=BG); metrics.pack(fill='x')
        self.metric_labels = []
        for i, (name, color) in enumerate((('今日 Tokens', ORANGE), ('本周 Tokens', BLUE), ('缓存 Tokens', GREEN), ('输出 Tokens', VIOLET))):
            card = Card(metrics, height=112); card.grid(row=0, column=i, padx=(0 if i == 0 else 5, 0 if i == 3 else 5), sticky='nsew')
            metrics.grid_columnconfigure(i, weight=1)
            self.label(card, f'●  {name}', 9, color=color).pack(anchor='w', padx=16, pady=(14, 5))
            value = self.label(card, '—', 20, 'bold'); value.pack(anchor='w', padx=16)
            note = self.label(card, '', 8, color=MUTED); note.pack(anchor='w', padx=16, pady=(1, 12))
            self.metric_labels.append((value, note))

        lower = tk.Frame(body, bg=BG); lower.pack(fill='both', expand=True, pady=(12, 0))
        quota = Card(lower); quota.pack(side='left', fill='both', expand=True, padx=(0, 6))
        side = Card(lower, width=355); side.pack(side='left', fill='both', padx=(6, 0)); side.pack_propagate(False)
        self.label(quota, '限额周期', 8, 'bold', MUTED).pack(anchor='w', padx=20, pady=(18, 3))
        qhead = tk.Frame(quota, bg=CARD); qhead.pack(fill='x', padx=20)
        self.label(qhead, '剩余可用量', 16, 'bold').pack(side='left')
        self.reset_label = self.label(qhead, '', 8, color=MUTED); self.reset_label.pack(side='right')
        center = tk.Frame(quota, bg=CARD); center.pack(fill='both', expand=True, pady=12)
        self.ring = tk.Canvas(center, width=205, height=205, bg=CARD, highlightthickness=0)
        self.ring.pack()
        self.used_label = self.label(quota, '已使用 —', 10, 'bold'); self.used_label.pack(anchor='w', padx=20)
        self.progress = tk.Canvas(quota, height=12, bg=CARD, highlightthickness=0)
        self.progress.pack(fill='x', padx=20, pady=(8, 20))

        self.label(side, '最近活动', 8, 'bold', MUTED).pack(anchor='w', padx=18, pady=(18, 3))
        self.label(side, '会话用量', 16, 'bold').pack(anchor='w', padx=18, pady=(0, 8))
        self.recent_box = tk.Frame(side, bg=CARD); self.recent_box.pack(fill='both', expand=True, padx=18)

    def draw_ring(self, used):
        c = self.ring; c.delete('all')
        c.create_oval(24, 24, 181, 181, outline='#E8E5DE', width=18)
        c.create_arc(24, 24, 181, 181, start=90, extent=-max(1, used * 3.6), outline=ORANGE, width=18, style='arc')
        c.create_text(102, 96, text=f'{max(0, 100-used):.0f}%', fill=INK, font=('Segoe UI', 26, 'bold'))
        c.create_text(102, 126, text='可用', fill=MUTED, font=('Microsoft YaHei UI', 9))
        self.progress.delete('all'); self.progress.update_idletasks()
        width = max(self.progress.winfo_width(), 200)
        self.progress.create_rectangle(0, 3, width, 10, fill='#E8E5DE', outline='')
        self.progress.create_rectangle(0, 3, width * used / 100, 10, fill=ORANGE, outline='')

    def apply_data(self, data):
        today, week = data['today'], data['week']
        values = ((today['total'], f"{today['sessions']} 个会话"),
                  (week['total'], f"{week['sessions']} 个会话"),
                  (week['cached'], f"缓存占比 {round(week['cached']/week['input']*100) if week['input'] else 0}%"),
                  (week['output'], f"其中推理 {compact(week['reasoning'])}"))
        for pair, (value, note) in zip(self.metric_labels, values):
            pair[0].config(text=compact(value)); pair[1].config(text=note)
        used = data['used']; self.draw_ring(used)
        self.used_label.config(text=f'已使用 {used:.0f}%')
        if data['reset']:
            delta = data['reset'] - datetime.now().astimezone()
            hours = max(0, int(delta.total_seconds() // 3600))
            self.reset_label.config(text=f'{hours//24} 天 {hours%24} 小时后重置')
        else:
            self.reset_label.config(text='暂无重置时间')
        for child in self.recent_box.winfo_children(): child.destroy()
        maximum = max((s['total'] for s in data['recent']), default=1)
        for s in data['recent']:
            row = tk.Frame(self.recent_box, bg=CARD); row.pack(fill='x', pady=7)
            when = local_date(s['updated']).strftime('%m/%d %H:%M')
            self.label(row, when, 9, 'bold').pack(side='left')
            self.label(row, compact(s['total']), 9, 'bold').pack(side='right')
            bar = tk.Canvas(row, width=90, height=7, bg=CARD, highlightthickness=0); bar.pack(side='right', padx=10)
            bar.create_rectangle(0, 1, 90, 6, fill='#EBE8E1', outline='')
            bar.create_rectangle(0, 1, max(3, 90*s['total']/maximum), 6, fill=ORANGE, outline='')
        self.status.config(text='● 实时读取中', fg=GREEN)
        self.refreshing = False
        if self.refresh_job:
            self.after_cancel(self.refresh_job)
        self.refresh_job = self.after(30000, self.refresh)

    def refresh(self):
        if self.refreshing:
            return
        self.refreshing = True
        self.status.config(text='● 正在刷新…', fg=MUTED)
        def worker():
            try:
                data = self.reader.read()
                self.after(0, lambda: self.apply_data(data))
            except Exception as exc:
                def failed():
                    self.refreshing = False
                    self.status.config(text=f'● 读取失败: {exc}', fg=ORANGE)
                self.after(0, failed)
        threading.Thread(target=worker, daemon=True).start()


if __name__ == '__main__':
    PulseApp().mainloop()
