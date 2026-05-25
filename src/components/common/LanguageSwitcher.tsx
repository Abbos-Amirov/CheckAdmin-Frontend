import { useI18n } from '@/app/providers/I18nProvider';
import { toolbarStyles as styles } from '@/components/layout/Toolbar';
import type { Locale } from '@/i18n';

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();

  const options: { id: Locale; label: string }[] = [
    { id: 'uz', label: "O'zbek" },
    { id: 'ko', label: '한국어' },
  ];

  return (
    <div className={styles.segment} role="group" aria-label={t('language')}>
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          className={`${styles.segmentBtn} ${locale === opt.id ? styles.segmentActive : ''}`.trim()}
          onClick={() => setLocale(opt.id)}
          aria-pressed={locale === opt.id}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
