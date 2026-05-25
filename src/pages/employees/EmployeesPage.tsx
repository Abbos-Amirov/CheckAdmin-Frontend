import { Link } from 'react-router-dom';
import { useI18n } from '@/app/providers/I18nProvider';
import { useEmployees } from '@/hooks/useEmployees';
import { Card } from '@/components/common/Card';
import styles from './EmployeesPage.module.scss';

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
                <div className={styles.code}>
                  {t('authEmployeeIdLabel')}: {emp.employeeCode ?? '—'}
                </div>
                {emp.phone ? (
                  <div className={styles.phone}>
                    {t('employeesPhoneLabel')}: {emp.phone}
                  </div>
                ) : null}
                <div className={styles.status}>
                  <span className={`${styles.statusBadge} ${styles.statusOk}`}>
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
