import { mockEmployees } from '@/data/mockDashboard';
import { useI18n } from '@/app/providers/I18nProvider';
import { formatCurrency } from '@/utils/format';
import { Card } from '@/components/common/Card';
import styles from './EmployeesPage.module.scss';

export function EmployeesPage() {
  const { t, locale } = useI18n();

  return (
    <div className={styles.page}>
      <p className={styles.lead}>{t('employeesPageHint')}</p>

      <Card className={styles.card}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{t('employees')}</th>
                <th>{t('receiptAmount')}</th>
                <th>{t('employeesStatus')}</th>
              </tr>
            </thead>
            <tbody>
              {mockEmployees.map((emp) => (
                <tr key={emp.id}>
                  <td className={styles.name}>{emp.fullName}</td>
                  <td>
                    {formatCurrency(emp.monthlyAmount, locale)} {t('currency')}
                  </td>
                  <td>
                    <span
                      className={`${styles.badge} ${
                        emp.status === 'ACTIVE' ? styles.badgeOk : styles.badgeOff
                      }`}
                    >
                      {emp.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
