import { useMemo, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import type { TranslationKey } from '@/i18n';
import { useI18n } from '@/app/providers/I18nProvider';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import styles from './AdminLayout.module.scss';

function titleKeyForPath(pathname: string): TranslationKey {
  if (pathname.startsWith('/employees')) return 'employees';
  if (pathname.startsWith('/receipts')) return 'receipts';
  if (pathname.startsWith('/reports')) return 'reports';
  if (pathname.startsWith('/settings')) return 'settings';
  return 'dashboard';
}

export function AdminLayout() {
  const { pathname } = useLocation();
  const titleKey = useMemo(() => titleKeyForPath(pathname), [pathname]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useI18n();

  const closeMobile = () => setMobileOpen(false);

  return (
    <div className={styles.shell}>
      <button
        type="button"
        className={styles.burger}
        onClick={() => setMobileOpen(true)}
        aria-expanded={mobileOpen}
        aria-controls="admin-sidebar"
      >
        <span className={styles.burgerIcon} aria-hidden>
          ☰
        </span>
        <span className={styles.burgerText}>{t('openMenu')}</span>
      </button>

      {mobileOpen ? (
        <button
          type="button"
          className={styles.backdrop}
          aria-label={t('closeMenu')}
          onClick={closeMobile}
        />
      ) : null}

      <div
        id="admin-sidebar"
        className={`${styles.sidebarWrap} ${mobileOpen ? styles.sidebarOpen : ''}`}
      >
        <Sidebar onNavigate={closeMobile} />
      </div>

      <div className={styles.main}>
        <Header titleKey={titleKey} />
        <Outlet />
      </div>
    </div>
  );
}
