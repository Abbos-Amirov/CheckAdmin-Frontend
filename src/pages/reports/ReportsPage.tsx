import { useI18n } from '@/app/providers/I18nProvider';
import { Card } from '@/components/common/Card';
import styles from './ReportsPage.module.scss';

export function ReportsPage() {
  const { t } = useI18n();

  return (
    <div className={styles.page}>
      <Card className={styles.card}>
        <h2 className={styles.title}>{t('reportsPageTitle')}</h2>
        <p className={styles.text}>{t('reportsPageHint')}</p>
      </Card>
    </div>
  );
}
