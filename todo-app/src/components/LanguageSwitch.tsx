import { LANGS, useI18n } from '../i18n'

export default function LanguageSwitch() {
  const { lang, setLang, t } = useI18n()

  return (
    <div className="lang-switch" role="group" aria-label={t.langLabel[lang]}>
      {LANGS.map((code) => (
        <button
          key={code}
          type="button"
          className={lang === code ? 'active' : ''}
          aria-pressed={lang === code}
          onClick={() => setLang(code)}
        >
          {code === 'ja' ? '日本語' : 'EN'}
        </button>
      ))}
    </div>
  )
}
