import { useTheme } from '@/app/providers/ThemeProvider';
import { useI18n } from '@/app/providers/I18nProvider';
import { Button } from './Button';
import styles from './ThemeToggle.module.scss';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const { t } = useI18n();
  const isDark = theme === 'dark';

  return (
    <Button
      type="button"
      variant="outline"
      className={styles.toggle}
      onClick={toggleTheme}
      aria-label={isDark ? t('themeLight') : t('themeDark')}
      title={isDark ? t('themeLight') : t('themeDark')}
    >
      <span className={styles.icon} aria-hidden>
        {isDark ? '☀️' : '🌙'}
      </span>
      <span className={styles.label}>{isDark ? t('themeLight') : t('themeDark')}</span>
    </Button>
  );
}
