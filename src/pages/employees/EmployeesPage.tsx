import { Link } from 'react-router-dom';
import { useI18n } from '@/app/providers/I18nProvider';
import { useEmployees } from '@/hooks/useEmployees';
import { Card } from '@/components/common/Card';
import styles from './EmployeesPage.module.scss';

function IdIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="2.5" y="5" width="19" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="8.5" cy="12" r="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M13.5 9.5h6M13.5 14.5h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6.6 10.8c1.5 3 3.6 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1.1-.3 1.2.4 2.5.6 3.8.6.6 0 1 .4 1 1v3.7c0 .6-.4 1-1 1C10.7 21.2 2.8 13.3 2.8 3.7c0-.6.4-1 1-1H7.5c.6 0 1 .4 1 1 0 1.3.2 2.6.6 3.8.1.4 0 .8-.3 1.1L6.6 10.8Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EmployeePhoto({
  photoUrl,
  fullName,
}: {
  photoUrl: string;
  fullName: string;
}) {
  const initial = fullName.trim().charAt(0).toUpperCase() || '?';

  if (!photoUrl) {
    return (
      <div className={styles.photoFallback} aria-hidden>
        {initial}
      </div>
    );
  }

  return (
    <img
      className={styles.photo}
      src={photoUrl}
      alt=""
      width={320}
      height={320}
      loading="lazy"
    />
  );
}

export function EmployeesPage() {
  const { t } = useI18n();
  const { employees, loading, error, reload } = useEmployees();

  return (
    <div className={styles.page}>
      <p className={styles.lead}>{t('employeesPageHint')}</p>

      {error ? (
        <div className={styles.stateBox} role="alert">
          <p>{error}</p>
          <button type="button" className={styles.retryBtn} onClick={() => void reload()}>
            {t('retry')}
          </button>
        </div>
      ) : null}

      {loading ? <p className={styles.stateText}>{t('loading')}</p> : null}

      {!loading && !error && employees.length === 0 ? (
        <p className={styles.stateText}>{t('employeesEmpty')}</p>
      ) : null}

      <ul className={styles.grid}>
        {employees.map((emp) => (
          <li key={emp.id} className={styles.cell}>
            <Card className={styles.card}>
              <Link
                className={styles.photoLink}
                to={`/employees/${emp.id}`}
                aria-label={`${emp.fullName} — ${t('employeesPageTitle')}`}
              >
                <div className={styles.photoWrap}>
                  <EmployeePhoto photoUrl={emp.photoUrl} fullName={emp.fullName} />
                </div>
              </Link>
              <div className={styles.body}>
                <div className={styles.name}>{emp.fullName}</div>
                <div className={styles.meta}>
                  <span
                    className={`${styles.wp} ${
                      emp.workplace === 'INTERNAL' ? styles.wpIn : styles.wpOut
                    }`}
                  >
                    {emp.workplace === 'INTERNAL'
                      ? t('workplaceInternalShort')
                      : t('workplaceExternalShort')}
                  </span>
                </div>
                <div className={styles.chips}>
                  <span className={styles.chip}>
                    <span className={styles.chipIcon}>
                      <IdIcon />
                    </span>
                    <span className={styles.chipText}>
                      <span className={styles.chipLabel}>{t('authEmployeeIdLabel')}</span>
                      <span className={styles.chipValue}>{emp.employeeCode ?? '—'}</span>
                    </span>
                  </span>
                  {emp.phone ? (
                    <span className={styles.chip}>
                      <span className={styles.chipIcon}>
                        <PhoneIcon />
                      </span>
                      <span className={styles.chipText}>
                        <span className={styles.chipLabel}>{t('employeesPhoneLabel')}</span>
                        <span className={styles.chipValue}>{emp.phone}</span>
                      </span>
                    </span>
                  ) : null}
                </div>
                <div className={styles.status}>
                  <span className={`${styles.statusBadge} ${styles.statusOk}`}>
                    <span className={styles.statusDot} aria-hidden />
                    {t('statusActiveLabel')}
                  </span>
                </div>
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
