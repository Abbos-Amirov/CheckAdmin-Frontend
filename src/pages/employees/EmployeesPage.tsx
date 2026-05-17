import { Link } from 'react-router-dom';
import { mockEmployees } from '@/data/mockDashboard';
import { useI18n } from '@/app/providers/I18nProvider';
import { formatCurrency } from '@/utils/format';
import { Card } from '@/components/common/Card';
import styles from './EmployeesPage.module.scss';

export function EmployeesPage() {
  const { t, locale } = useI18n();

  const sorted = [...mockEmployees].sort((a, b) =>
    a.fullName.localeCompare(b.fullName, undefined, { sensitivity: 'base' }),
  );

  return (
    <div className={styles.page}>
      <p className={styles.lead}>{t('employeesPageHint')}</p>

      <ul className={styles.grid}>
        {sorted.map((emp) => (
          <li key={emp.id} className={styles.cell}>
            <Card className={styles.card}>
              <Link
                className={styles.photoLink}
                to={`/employees/${emp.id}`}
                aria-label={`${emp.fullName} — ${t('employeesPageTitle')}`}
              >
                <div className={styles.photoWrap}>
                  <img
                    className={styles.photo}
                    src={emp.photoUrl}
                    alt=""
                    width={320}
                    height={320}
                  />
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
                <div className={styles.amount}>
                  {formatCurrency(emp.monthlyAmount, locale)} {t('currency')}
                </div>
                <div className={styles.status}>
                  <span
                    className={`${styles.statusBadge} ${
                      emp.status === 'ACTIVE' ? styles.statusOk : styles.statusOff
                    }`}
                  >
                    {emp.status === 'ACTIVE'
                      ? t('statusActiveLabel')
                      : t('statusInactiveLabel')}
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
