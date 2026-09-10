import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

export type Lang = 'ja' | 'en'

export interface Dict {
  appTitle: string
  placeholder: string
  add: string
  filterAll: string
  filterActive: string
  filterDone: string
  empty: string
  count: (remaining: number, total: number) => string
  clearDone: string
  deleteLabel: string
  langLabel: Record<Lang, string>
}

const DICTS: Record<Lang, Dict> = {
  ja: {
    appTitle: 'ToDo リスト',
    placeholder: '新しいタスクを入力…',
    add: '追加',
    filterAll: 'すべて',
    filterActive: '未完了',
    filterDone: '完了',
    empty: 'タスクはありません',
    count: (remaining, total) => `未完了 ${remaining} 件 / 全 ${total} 件`,
    clearDone: '完了済みを削除',
    deleteLabel: '削除',
    langLabel: { ja: '日本語', en: 'English' },
  },
  en: {
    appTitle: 'ToDo List',
    placeholder: 'Add a new task…',
    add: 'Add',
    filterAll: 'All',
    filterActive: 'Active',
    filterDone: 'Done',
    empty: 'No tasks',
    count: (remaining, total) => `${remaining} active / ${total} total`,
    clearDone: 'Clear completed',
    deleteLabel: 'Delete',
    langLabel: { ja: '日本語', en: 'English' },
  },
}

export const LANGS: Lang[] = ['ja', 'en']

const STORAGE_KEY = 'todo-app-lang'
const DEFAULT_LANG: Lang = 'ja'

function loadLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved === 'ja' || saved === 'en' ? saved : DEFAULT_LANG
  } catch {
    return DEFAULT_LANG
  }
}

interface I18nValue {
  lang: Lang
  setLang: (lang: Lang) => void
  t: Dict
}

const I18nContext = createContext<I18nValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(loadLang)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, lang)
    } catch {
      /* ストレージが使えない環境では保存をスキップ */
    }
    document.documentElement.lang = lang
  }, [lang])

  return (
    <I18nContext.Provider value={{ lang, setLang, t: DICTS[lang] }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}
