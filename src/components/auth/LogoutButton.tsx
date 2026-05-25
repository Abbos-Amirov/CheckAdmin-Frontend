import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import { useI18n } from '@/app/providers/I18nProvider';
import { toolbarStyles as styles } from '@/components/layout/Toolbar';

function LogoutIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 17l5-5-5-5M21 12H9"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LogoutButton() {
  const { logout } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const handleLogout = async () => {
    if (busy) return;

    setBusy(true);
    try {
      await logout();
      navigate('/login', { replace: true });
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      className={`${styles.actionBtn} ${styles.actionLogout}`.trim()}
      onClick={handleLogout}
      disabled={busy}
      aria-label={t('authLogout')}
      title={t('authLogout')}
    >
      <span className={styles.actionIcon}>
        <LogoutIcon />
      </span>
      <span className={styles.actionLabel}>{busy ? '…' : t('authLogout')}</span>
    </button>
  );
}
