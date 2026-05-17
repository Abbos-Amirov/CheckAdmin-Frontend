import { NavLink } from 'react-router-dom';
import { useI18n } from '@/app/providers/I18nProvider';
import styles from './Sidebar.module.scss';

type NavItem = {
  to: string;
  labelKey: 'dashboard' | 'employees' | 'receipts' | 'reports' | 'settings';
  icon: 'grid' | 'user' | 'doc' | 'chart' | 'gear';
};

const mainItems: NavItem[] = [
  { to: '/', labelKey: 'dashboard', icon: 'grid' },
  { to: '/employees', labelKey: 'employees', icon: 'user' },
  { to: '/receipts', labelKey: 'receipts', icon: 'doc' },
];

const analysisItems: NavItem[] = [
  { to: '/reports', labelKey: 'reports', icon: 'chart' },
  { to: '/settings', labelKey: 'settings', icon: 'gear' },
];

type Props = {
  onNavigate?: () => void;
};

export function Sidebar({ onNavigate }: Props) {
  const { t } = useI18n();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <div className={styles.brandTitle}>{t('appTitle')}</div>
        <div className={styles.brandSubtitle}>{t('appSubtitle')}</div>
      </div>

      <nav className={styles.nav} aria-label="Main">
        <div className={styles.sectionLabel}>{t('navMain')}</div>
        <ul className={styles.list}>
          {mainItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `${styles.link} ${isActive ? styles.active : ''}`
                }
                onClick={onNavigate}
              >
                <span className={styles.icon} aria-hidden>
                  <NavIcon name={item.icon} />
                </span>
                <span>{t(item.labelKey)}</span>
              </NavLink>
            </li>
          ))}
        </ul>

        <div className={styles.sectionLabel}>{t('navAnalysis')}</div>
        <ul className={styles.list}>
          {analysisItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `${styles.link} ${isActive ? styles.active : ''}`
                }
                onClick={onNavigate}
              >
                <span className={styles.icon} aria-hidden>
                  <NavIcon name={item.icon} />
                </span>
                <span>{t(item.labelKey)}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className={styles.profile}>
        <div className={styles.profileRole}>{t('adminAccount')}</div>
        <div className={styles.profileName}>{t('roleDirector')}</div>
      </div>
    </aside>
  );
}

function NavIcon({ name }: { name: NavItem['icon'] }) {
  switch (name) {
    case 'grid':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path
            d="M4 4h7v7H4V4zm9 0h7v7h-7V4zM4 13h7v7H4v-7zm9 0h7v7h-7v-7z"
            stroke="currentColor"
            strokeWidth="1.6"
          />
        </svg>
      );
    case 'user':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-4.418 0-8 2.015-8 4.5V21h16v-2.5C20 16.015 16.418 14 12 14Z"
            stroke="currentColor"
            strokeWidth="1.6"
          />
        </svg>
      );
    case 'doc':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path
            d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <path d="M14 3v5h5" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      );
    case 'chart':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M4 19V5" stroke="currentColor" strokeWidth="1.6" />
          <path d="M4 19h16" stroke="currentColor" strokeWidth="1.6" />
          <path
            d="M8 15v-4m4 4V9m4 6v-2"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'gear':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <path
            d="M19.4 15a7.86 7.86 0 0 0 .1-1 7.86 7.86 0 0 0-.1-1l2-1.5-2-3.5-2.4 1a7.7 7.7 0 0 0-1.7-1l-.4-2.6h-4l-.4 2.6a7.7 7.7 0 0 0-1.7 1l-2.4-1-2 3.5 2 1.5a7.86 7.86 0 0 0-.1 1 7.86 7.86 0 0 0 .1 1l-2 1.5 2 3.5 2.4-1a7.7 7.7 0 0 0 1.7 1l.4 2.6h4l.4-2.6a7.7 7.7 0 0 0 1.7-1l2.4 1 2-3.5-2-1.5Z"
            stroke="currentColor"
            strokeWidth="1.2"
          />
        </svg>
      );
    default:
      return null;
  }
}
