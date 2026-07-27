import os
import sys
import threading
from datetime import datetime
from pathlib import Path

_runtime = Path(sys.executable).parent
os.environ.setdefault('TCL_LIBRARY', str(_runtime / 'tcl' / 'tcl8.6'))
os.environ.setdefault('TK_LIBRARY', str(_runtime / 'tcl' / 'tk8.6'))

import tkinter as tk
from codex_pulse import UsageReader, compact, local_date

WHITE = '#FFFFFF'
PAGE = '#F6F8FC'
SIDEBAR = '#F2F6FF'
BLUE = '#3977F6'
BLUE_SOFT = '#E3ECFF'
INK = '#20242C'
MUTED = '#7D8594'
LINE = '#E7EAF0'
GREEN = '#35A66F'
ORANGE = '#F08A52'
PURPLE = '#8A78D1'


class PulseClient(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title('Codex Pulse')
        self.geometry('1120x740')
        self.minsize(900, 620)
        self.configure(bg=PAGE)
        self.option_add('*Font', ('Microsoft YaHei UI', 10))
        self.reader = UsageReader()
        self.data = None
        self.refreshing = False
        self.refresh_job = None
        self.active_page = 'overview'
        self.nav_buttons = {}
        self.protocol('WM_DELETE_WINDOW', self.destroy)
        self._build_shell()
        self.show_page('overview')
        self.refresh()

    def text(self, parent, value='', size=10, weight='normal', color=INK, bg=None, **kwargs):
        return tk.Label(parent, text=value, bg=bg or parent.cget('bg'), fg=color,
                        font=('Microsoft YaHei UI', size, weight), **kwargs)

    def _build_shell(self):
        self.sidebar = tk.Frame(self, bg=SIDEBAR, width=198)
        self.sidebar.pack(side='left', fill='y')
        self.sidebar.pack_propagate(False)

        brand = tk.Frame(self.sidebar, bg=SIDEBAR, height=76)
        brand.pack(fill='x'); brand.pack_propagate(False)
        tk.Label(brand, text='C', bg=BLUE, fg='white', width=3, height=1,
                 font=('Segoe UI', 15, 'bold')).pack(side='left', padx=(20, 10), pady=19)
        self.text(brand, 'Codex Pulse', 12, 'bold').pack(side='left')

        self.text(self.sidebar, '用量中心', 8, 'bold', MUTED).pack(anchor='w', padx=24, pady=(18, 8))
        self._nav('overview', '▦', '用量概览')
        self._nav('history', '◷', '使用记录')
        self._nav('details', '≡', 'Token 明细')

        bottom = tk.Frame(self.sidebar, bg=SIDEBAR)
        bottom.pack(side='bottom', fill='x', padx=16, pady=18)
        privacy = tk.Frame(bottom, bg=WHITE, highlightbackground=LINE, highlightthickness=1)
        privacy.pack(fill='x')
        self.text(privacy, '●  本地模式', 9, 'bold', GREEN, WHITE).pack(anchor='w', padx=12, pady=(11, 2))
        self.text(privacy, '数据不会离开电脑', 8, color=MUTED, bg=WHITE).pack(anchor='w', padx=12, pady=(0, 11))

        right = tk.Frame(self, bg=PAGE)
        right.pack(side='left', fill='both', expand=True)
        top = tk.Frame(right, bg=WHITE, height=64, highlightbackground=LINE, highlightthickness=1)
        top.pack(fill='x'); top.pack_propagate(False)
        self.page_title = self.text(top, '用量概览', 14, 'bold', bg=WHITE)
        self.page_title.pack(side='left', padx=26)
        self.status = self.text(top, '● 正在读取', 9, color=MUTED, bg=WHITE)
        self.status.pack(side='right', padx=(12, 24))
        self.refresh_button = tk.Button(top, text='刷新  ↻', command=self.refresh, bg=BLUE_SOFT, fg=BLUE,
                                        activebackground='#D5E2FF', activeforeground=BLUE, relief='flat',
                                        bd=0, cursor='hand2', padx=15, pady=7,
                                        font=('Microsoft YaHei UI', 9, 'bold'))
        self.refresh_button.pack(side='right')

        self.content = tk.Frame(right, bg=PAGE)
        self.content.pack(fill='both', expand=True, padx=26, pady=22)

    def _nav(self, key, icon, label):
        button = tk.Button(self.sidebar, text=f'  {icon}    {label}', anchor='w', relief='flat', bd=0,
                           bg=SIDEBAR, fg='#586174', activebackground=BLUE_SOFT, activeforeground=BLUE,
                           cursor='hand2', padx=19, pady=11, font=('Microsoft YaHei UI', 10),
                           command=lambda: self.show_page(key))
        button.pack(fill='x', padx=12, pady=2)
        self.nav_buttons[key] = button

    def show_page(self, key):
        self.active_page = key
        names = {'overview': '用量概览', 'history': '使用记录', 'details': 'Token 明细'}
        self.page_title.config(text=names[key])
        for name, button in self.nav_buttons.items():
            active = name == key
            button.config(bg=BLUE_SOFT if active else SIDEBAR, fg=BLUE if active else '#586174',
                          font=('Microsoft YaHei UI', 10, 'bold' if active else 'normal'))
        for child in self.content.winfo_children():
            child.destroy()
        if key == 'overview':
            self._overview()
        elif key == 'history':
            self._history()
        else:
            self._details()

    def _card(self, parent):
        return tk.Frame(parent, bg=WHITE, highlightbackground=LINE, highlightthickness=1)

    def _empty(self):
        self.text(self.content, '正在读取本机 Codex 用量…', 11, color=MUTED).pack(expand=True)

    def _overview(self):
        if not self.data:
            return self._empty()
        d, today, week = self.data, self.data['today'], self.data['week']
        hero = self._card(self.content); hero.pack(fill='x', pady=(0, 16))
        left = tk.Frame(hero, bg=WHITE); left.pack(side='left', fill='both', expand=True, padx=22, pady=18)
        self.text(left, '本周 Codex 用量', 10, color=MUTED, bg=WHITE).pack(anchor='w')
        self.text(left, compact(week['total']), 30, 'bold', bg=WHITE).pack(anchor='w', pady=(3, 0))
        self.text(left, f"共 {week['sessions']} 个会话 · 自动刷新", 9, color=MUTED, bg=WHITE).pack(anchor='w')
        used = d['used']; remain = max(0, 100-used)
        q = tk.Canvas(hero, width=290, height=108, bg=WHITE, highlightthickness=0)
        q.pack(side='right', padx=22, pady=12)
        q.create_text(8, 17, text='周期剩余', anchor='w', fill=MUTED, font=('Microsoft YaHei UI', 9))
        q.create_text(8, 54, text=f'{remain:.0f}%', anchor='w', fill=INK, font=('Segoe UI', 25, 'bold'))
        q.create_rectangle(94, 48, 275, 57, fill='#EDF0F5', outline='')
        q.create_rectangle(94, 48, 94 + 181*remain/100, 57, fill=BLUE, outline='')
        reset = '暂无重置时间'
        if d['reset']:
            hours = max(0, int((d['reset']-datetime.now().astimezone()).total_seconds()//3600))
            reset = f'{hours//24} 天 {hours%24} 小时后重置'
        q.create_text(94, 80, text=reset, anchor='w', fill=MUTED, font=('Microsoft YaHei UI', 8))

        grid = tk.Frame(self.content, bg=PAGE); grid.pack(fill='x')
        items = [('今日 Tokens', today['total'], f"{today['sessions']} 个会话", BLUE),
                 ('缓存 Tokens', week['cached'], '减少重复输入消耗', GREEN),
                 ('输出 Tokens', week['output'], f"推理 {compact(week['reasoning'])}", ORANGE)]
        for i, (name, value, note, color) in enumerate(items):
            grid.grid_columnconfigure(i, weight=1, uniform='metric')
            card = self._card(grid); card.grid(row=0, column=i, sticky='nsew', padx=(0 if i == 0 else 6, 0 if i == 2 else 6))
            self.text(card, name, 9, color=MUTED, bg=WHITE).pack(anchor='w', padx=18, pady=(16, 6))
            self.text(card, compact(value), 21, 'bold', bg=WHITE).pack(anchor='w', padx=18)
            self.text(card, f'●  {note}', 8, color=color, bg=WHITE).pack(anchor='w', padx=18, pady=(3, 17))

        recent = self._card(self.content); recent.pack(fill='both', expand=True, pady=(16, 0))
        head = tk.Frame(recent, bg=WHITE); head.pack(fill='x', padx=20, pady=(16, 8))
        self.text(head, '最近使用', 13, 'bold', bg=WHITE).pack(side='left')
        self.text(head, '查看全部 ›', 9, color=BLUE, bg=WHITE).pack(side='right')
        self._session_rows(recent, d['recent'][:4])

    def _session_rows(self, parent, sessions):
        maximum = max((s['total'] for s in sessions), default=1)
        for s in sessions:
            row = tk.Frame(parent, bg=WHITE, height=48); row.pack(fill='x', padx=20); row.pack_propagate(False)
            when = local_date(s['updated']).strftime('%Y/%m/%d  %H:%M')
            self.text(row, when, 9, color=INK, bg=WHITE, width=18, anchor='w').pack(side='left')
            self.text(row, s['id'][:12]+'…', 8, color=MUTED, bg=WHITE, width=17, anchor='w').pack(side='left')
            self.text(row, compact(s['total'])+' tokens', 9, 'bold', bg=WHITE, width=15, anchor='e').pack(side='right')
            bar = tk.Canvas(row, height=7, bg=WHITE, highlightthickness=0); bar.pack(side='left', fill='x', expand=True, padx=14)
            bar.bind('<Configure>', lambda e, c=bar, v=s['total'], m=maximum: self._bar(c, v/m))

    def _bar(self, canvas, ratio):
        canvas.delete('all'); w = max(canvas.winfo_width(), 10)
        canvas.create_rectangle(0, 2, w, 6, fill='#EDF0F5', outline='')
        canvas.create_rectangle(0, 2, max(3, w*ratio), 6, fill=BLUE, outline='')

    def _history(self):
        if not self.data: return self._empty()
        self.text(self.content, '最近会话', 20, 'bold').pack(anchor='w')
        self.text(self.content, '按更新时间排列的 Codex 会话用量', 9, color=MUTED).pack(anchor='w', pady=(2, 14))
        card = self._card(self.content); card.pack(fill='both', expand=True)
        self._session_rows(card, self.data['recent'])

    def _details(self):
        if not self.data: return self._empty()
        week = self.data['week']
        self.text(self.content, '本周 Token 构成', 20, 'bold').pack(anchor='w', pady=(0, 14))
        for name, value, color in [('输入 Tokens', week['input'], BLUE), ('缓存 Tokens', week['cached'], GREEN),
                                   ('输出 Tokens', week['output'], ORANGE), ('推理 Tokens', week['reasoning'], PURPLE)]:
            card = self._card(self.content); card.pack(fill='x', pady=5)
            tk.Frame(card, bg=color, width=5).pack(side='left', fill='y')
            self.text(card, name, 11, bg=WHITE).pack(side='left', padx=18, pady=18)
            self.text(card, f'{value:,}', 15, 'bold', bg=WHITE).pack(side='right', padx=20)

    def apply_data(self, data):
        self.data = data
        self.refreshing = False
        self.status.config(text='● 数据已同步', fg=GREEN)
        self.refresh_button.config(state='normal', text='刷新  ↻')
        self.show_page(self.active_page)
        if self.refresh_job:
            self.after_cancel(self.refresh_job)
        self.refresh_job = self.after(30000, self.refresh)

    def refresh(self):
        if self.refreshing: return
        self.refreshing = True
        self.status.config(text='● 正在同步', fg=MUTED)
        self.refresh_button.config(state='disabled', text='读取中…')
        def worker():
            try:
                data = self.reader.read()
                self.after(0, lambda: self.apply_data(data))
            except Exception as exc:
                def failed():
                    self.refreshing = False
                    self.status.config(text=f'● 读取失败: {exc}', fg=ORANGE)
                    self.refresh_button.config(state='normal', text='重试  ↻')
                self.after(0, failed)
        threading.Thread(target=worker, daemon=True).start()


if __name__ == '__main__':
    PulseClient().mainloop()
