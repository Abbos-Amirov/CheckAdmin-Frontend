import { useTheme } from '@/app/providers/ThemeProvider';
import { useI18n } from '@/app/providers/I18nProvider';
import { toolbarStyles as styles } from '@/components/layout/Toolbar';

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M21 14.5A8.5 8.5 0 1 1 9.5 3 7 7 0 0 0 21 14.5Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const { t } = useI18n();
  const isDark = theme === 'dark';
  const label = isDark ? t('themeLight') : t('themeDark');

  return (
    <button
      type="button"
      className={styles.actionBtn}
      onClick={toggleTheme}
      aria-label={label}
      title={label}
    >
      <span className={styles.actionIcon}>{isDark ? <SunIcon /> : <MoonIcon />}</span>
      <span className={styles.actionLabel}>{label}</span>
    </button>
  );
}
