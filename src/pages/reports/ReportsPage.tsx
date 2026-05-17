import { useMemo, useState } from 'react';
import { useI18n } from '@/app/providers/I18nProvider';
import { getMonthlySubmissionRows } from '@/data/mockReports';
import { formatCalendarMonth } from '@/utils/format';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import styles from './ReportsPage.module.scss';

const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

export function ReportsPage() {
  const { t, locale } = useI18n();
  const year = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

  const rows = useMemo(() => {
    if (selectedMonth === null) return null;
    return getMonthlySubmissionRows(year, selectedMonth);
  }, [year, selectedMonth]);

  const summary = useMemo(() => {
    if (!rows) return null;
    const submitted = rows.filter((r) => r.submitted).length;
    return { submitted, total: rows.length };
  }, [rows]);

  return (
    <div className={styles.page}>
      <div className={styles.intro}>
        <h2 className={styles.pageTitle}>{t('reportsPageTitle')}</h2>
        <p className={styles.hint}>{t('reportsPageHint')}</p>
        <p className={styles.year}>{t('reportsYearLabel', { year })}</p>
      </div>

      <Card className={styles.monthsCard}>
        <h3 className={styles.sectionTitle}>{t('reportsMonthsTitle')}</h3>
        <p className={styles.sectionHint}>{t('reportsPickMonthHint')}</p>
        <div className={styles.monthGrid}>
          {MONTHS.map((m) => (
            <button
              key={m}
              type="button"
              className={`${styles.monthBtn} ${selectedMonth === m ? styles.monthBtnActive : ''}`}
              onClick={() => setSelectedMonth(m)}
              aria-pressed={selectedMonth === m}
            >
              <span className={styles.monthShort}>{formatCalendarMonth(m, locale, 'short')}</span>
              <span className={styles.monthNum}>{m}</span>
            </button>
          ))}
        </div>
      </Card>

      {selectedMonth !== null && rows && summary ? (
        <Card className={styles.detailCard}>
          <div className={styles.detailHead}>
            <div>
              <h3 className={styles.detailTitle}>{t('reportsSubmissionTitle')}</h3>
              <p className={styles.detailSubtitle}>
                {formatCalendarMonth(selectedMonth, locale, 'long')} ·{' '}
                {t('reportsSummaryCount', {
                  submitted: summary.submitted,
                  total: summary.total,
                })}
              </p>
            </div>
            <Button type="button" variant="ghost" onClick={() => setSelectedMonth(null)}>
              {t('reportsClearSelection')}
            </Button>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>{t('reportsEmployeeCol')}</th>
                  <th>{t('reportsSubmissionCol')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.employeeId}>
                    <td className={styles.nameCell}>{row.fullName}</td>
                    <td>
                      <span
                        className={`${styles.pill} ${row.submitted ? styles.pillOk : styles.pillNo}`}
                      >
                        {row.submitted ? t('reportsSubmittedYes') : t('reportsSubmittedNo')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
