import { useI18n } from '@/app/providers/I18nProvider';
import type { TranslationKey } from '@/i18n';
import { formatDashboardMonth } from '@/utils/format';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import styles from './Header.module.scss';

const DEMO_MONTH = new Date(2026, 4, 1);

type Props = {
  titleKey: TranslationKey;
};

export function Header({ titleKey }: Props) {
  const { t, locale } = useI18n();
  const monthLabel = formatDashboardMonth(DEMO_MONTH, locale);

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <h1 className={styles.title}>{t(titleKey)}</h1>
      </div>
      <div className={styles.right}>
        <span className={styles.month}>{monthLabel}</span>
        <LanguageSwitcher />
        <ThemeToggle />
      </div>
    </header>
  );
}
