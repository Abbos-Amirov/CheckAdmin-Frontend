import { useI18n } from '@/app/providers/I18nProvider';
import type { Locale } from '@/i18n';
import styles from './LanguageSwitcher.module.scss';

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();

  const options: { id: Locale; label: string }[] = [
    { id: 'uz', label: "O'zbek" },
    { id: 'ko', label: '한국어' },
  ];

  return (
    <div className={styles.wrap} role="group" aria-label={t('language')}>
      <span className={styles.caption}>{t('language')}</span>
      <div className={styles.buttons}>
        {options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            className={`${styles.btn} ${locale === opt.id ? styles.active : ''}`}
            onClick={() => setLocale(opt.id)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
