import { Link, Navigate, useParams } from 'react-router-dom';
import { getEmployeeById } from '@/data/mockDashboard';
import { useI18n } from '@/app/providers/I18nProvider';
import { formatCurrency } from '@/utils/format';
import { Card } from '@/components/common/Card';
import styles from './EmployeeDetailPage.module.scss';

export function EmployeeDetailPage() {
  const { employeeId } = useParams<{ employeeId: string }>();
  const { t, locale } = useI18n();

  if (!employeeId) {
    return <Navigate to="/employees" replace />;
  }

  const emp = getEmployeeById(employeeId);

  if (!emp) {
    return (
      <div className={styles.page}>
        <p className={styles.missing}>{t('employeeNotFound')}</p>
        <Link className={styles.back} to="/employees">
          {t('backToEmployees')}
        </Link>
      </div>
    );
  }

  const isInternal = emp.workplace === 'INTERNAL';

  return (
    <div className={styles.page}>
      <Link className={styles.back} to="/employees">
        {t('backToEmployees')}
      </Link>

      <Card className={styles.card}>
        <div className={styles.layout}>
          <div className={styles.photoCol}>
            <div className={styles.photoFrame}>
              <img
                className={styles.photo}
                src={emp.photoUrl}
                alt={emp.fullName}
                width={400}
                height={400}
              />
            </div>
          </div>
          <div className={styles.info}>
            <h2 className={styles.name}>{emp.fullName}</h2>

            <dl className={styles.dl}>
              <div className={styles.row}>
                <dt>{t('workplaceColumn')}</dt>
                <dd>
                  <span
                    className={`${styles.wp} ${isInternal ? styles.wpIn : styles.wpOut}`}
                  >
                    {isInternal ? t('workplaceInternalShort') : t('workplaceExternalShort')}
                  </span>
                </dd>
              </div>
              <div className={styles.row}>
                <dt>{t('employeeDetailMonthly')}</dt>
                <dd className={styles.amount}>
                  {formatCurrency(emp.monthlyAmount, locale)} {t('currency')}
                </dd>
              </div>
              <div className={styles.row}>
                <dt>{t('employeesStatus')}</dt>
                <dd>
                  <span
                    className={`${styles.st} ${
                      emp.status === 'ACTIVE' ? styles.stOk : styles.stOff
                    }`}
                  >
                    {emp.status === 'ACTIVE'
                      ? t('statusActiveLabel')
                      : t('statusInactiveLabel')}
                  </span>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </Card>
    </div>
  );
}
