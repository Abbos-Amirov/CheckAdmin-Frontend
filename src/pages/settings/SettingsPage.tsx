import { useI18n } from '@/app/providers/I18nProvider';
import { Card } from '@/components/common/Card';
import styles from './SettingsPage.module.scss';

export function SettingsPage() {
  const { t } = useI18n();

  return (
    <div className={styles.page}>
      <Card className={styles.card}>
        <h2 className={styles.title}>{t('settingsPageTitle')}</h2>
        <p className={styles.text}>{t('settingsPageHint')}</p>
      </Card>
    </div>
  );
}
