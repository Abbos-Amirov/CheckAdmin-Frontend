import { Outlet } from 'react-router-dom';
import { useI18n } from '@/app/providers/I18nProvider';
import { PnsReceiptLogo } from '@/components/brand/PnsReceiptLogo';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { Toolbar, ToolbarDivider } from '@/components/layout/Toolbar';
import styles from './AuthLayout.module.scss';

export function AuthLayout() {
  const { t } = useI18n();

  return (
    <div className={styles.shell}>
      <div className={styles.panel}>
        <div className={styles.topBar}>
          <span />
          <div className={styles.tools}>
          <Toolbar>
            <LanguageSwitcher />
            <ToolbarDivider />
            <ThemeToggle />
          </Toolbar>
          </div>
        </div>

        <div className={styles.logoWrap}>
          <PnsReceiptLogo subtitle={t('appSubtitle')} />
        </div>

        <div className={styles.content}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
