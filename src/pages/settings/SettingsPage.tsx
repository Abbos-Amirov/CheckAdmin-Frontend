import { useMemo, useState } from 'react';
import { useI18n } from '@/app/providers/I18nProvider';
import { Card } from '@/components/common/Card';
import { formatCurrency } from '@/utils/format';
import styles from './SettingsPage.module.scss';

const DEMO_INTERNAL_CAP_WON = 400_000;
const DEMO_EXTERNAL_CAP_WON = 525_000;

const DEMO_ORG = {
  name: 'AdminCheck · Seoul Branch',
  id: 'ORG-CHK-2026-KR-01',
  timezoneValue: 'Asia/Seoul · UTC+9',
};

const DEMO_WEBHOOK = 'https://hooks.demo.admincheck.kr/rx/···a8f2c91';

function ToggleRow({
  title,
  description,
  initialOn,
}: {
  title: string;
  description: string;
  initialOn: boolean;
}) {
  const [on, setOn] = useState(initialOn);

  return (
    <div className={styles.toggleRow}>
      <div className={styles.toggleText}>
        <span className={styles.toggleTitle}>{title}</span>
        <span className={styles.toggleDesc}>{description}</span>
      </div>
      <button
        type="button"
        className={`${styles.switch} ${on ? styles.switchOn : ''}`.trim()}
        role="switch"
        aria-checked={on}
        onClick={() => setOn((v) => !v)}
      >
        <span className={styles.switchThumb} />
      </button>
    </div>
  );
}

export function SettingsPage() {
  const { t, locale } = useI18n();

  const formattedLastLogin = useMemo(() => {
    const d = new Date('2026-05-17T09:42:00+09:00');
    const lc = locale === 'ko' ? 'ko-KR' : 'en-US';
    return new Intl.DateTimeFormat(lc, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(d);
  }, [locale]);

  const formattedLastSync = useMemo(() => {
    const d = new Date('2026-05-17T08:05:00+09:00');
    const lc = locale === 'ko' ? 'ko-KR' : 'en-US';
    return new Intl.DateTimeFormat(lc, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(d);
  }, [locale]);

  const internalFmt = `${formatCurrency(DEMO_INTERNAL_CAP_WON, locale)} ${t('currency')}`;
  const externalFmt = `${formatCurrency(DEMO_EXTERNAL_CAP_WON, locale)} ${t('currency')}`;

  return (
    <div className={styles.page}>
      <header className={styles.intro}>
        <h1 className={styles.pageTitle}>{t('settingsPageTitle')}</h1>
        <p className={styles.hint}>{t('settingsPageHint')}</p>
      </header>

      <div className={styles.grid}>
        <div className={styles.column}>
          <Card className={styles.sectionCard}>
            <div className={styles.sectionHead}>
              <span className={styles.sectionIcon} aria-hidden>
                ◇
              </span>
              <div>
                <h2 className={styles.sectionTitle}>{t('settingsSectionOrg')}</h2>
                <p className={styles.sectionLead}>{t('settingsOrgProfileHint')}</p>
              </div>
            </div>
            <dl className={styles.fields}>
              <div className={styles.field}>
                <dt>{t('settingsLabelOrgName')}</dt>
                <dd>{DEMO_ORG.name}</dd>
              </div>
              <div className={styles.field}>
                <dt>{t('settingsLabelOrgId')}</dt>
                <dd className={styles.mono}>{DEMO_ORG.id}</dd>
              </div>
              <div className={styles.field}>
                <dt>{t('settingsLabelTimezone')}</dt>
                <dd>{DEMO_ORG.timezoneValue}</dd>
              </div>
              <div className={styles.field}>
                <dt>{t('settingsLabelMonthStart')}</dt>
                <dd>{t('settingsMonthStartValue')}</dd>
              </div>
            </dl>
          </Card>

          <Card className={styles.sectionCard}>
            <div className={styles.sectionHead}>
              <span className={styles.sectionIcon} aria-hidden>
                ⧉
              </span>
              <div>
                <h2 className={styles.sectionTitle}>{t('settingsSectionLimits')}</h2>
                <p className={styles.sectionLead}>{t('settingsLimitsHint')}</p>
              </div>
            </div>
            <div className={styles.limitGrid}>
              <div className={`${styles.limitTile} ${styles.limitTileInternal}`}>
                <span className={styles.limitCaption}>{t('settingsLimitInternalCaption')}</span>
                <span className={styles.limitValue}>{internalFmt}</span>
              </div>
              <div className={`${styles.limitTile} ${styles.limitTileExternal}`}>
                <span className={styles.limitCaption}>{t('settingsLimitExternalCaption')}</span>
                <span className={styles.limitValue}>{externalFmt}</span>
              </div>
            </div>
          </Card>
        </div>

        <div className={styles.column}>
          <Card className={styles.sectionCard}>
            <div className={styles.sectionHead}>
              <span className={styles.sectionIcon} aria-hidden>
                ✉
              </span>
              <div>
                <h2 className={styles.sectionTitle}>{t('settingsSectionNotify')}</h2>
                <p className={styles.sectionLead}>{t('settingsNotifyHint')}</p>
              </div>
            </div>
            <div className={styles.toggleList}>
              <ToggleRow
                title={t('settingsNotifyPendingTitle')}
                description={t('settingsNotifyPendingDesc')}
                initialOn
              />
              <ToggleRow
                title={t('settingsNotifyWeeklyTitle')}
                description={t('settingsNotifyWeeklyDesc')}
                initialOn
              />
              <ToggleRow
                title={t('settingsNotifyReportsTitle')}
                description={t('settingsNotifyReportsDesc')}
                initialOn={false}
              />
            </div>
          </Card>

          <Card className={styles.sectionCard}>
            <div className={styles.sectionHead}>
              <span className={styles.sectionIcon} aria-hidden>
                ⎘
              </span>
              <div>
                <h2 className={styles.sectionTitle}>{t('settingsSectionIntegrations')}</h2>
                <p className={styles.sectionLead}>{t('settingsIntegrationHint')}</p>
              </div>
            </div>
            <div className={styles.integrationRows}>
              <div className={styles.integrationRow}>
                <div className={styles.integrationMain}>
                  <span className={styles.integrationLabel}>{t('settingsWebhookLabel')}</span>
                  <code className={styles.code}>{DEMO_WEBHOOK}</code>
                </div>
                <span className={styles.pillOk}>{t('settingsStatusConnected')}</span>
              </div>
              <div className={styles.integrationRow}>
                <div className={styles.integrationMain}>
                  <span className={styles.integrationLabel}>{t('settingsRestApiLabel')}</span>
                  <span className={styles.integrationMeta}>v1 · admin.check.api</span>
                </div>
                <span className={styles.pillOk}>{t('settingsStatusConnected')}</span>
              </div>
              <p className={styles.syncLine}>
                <span className={styles.syncLabel}>{t('settingsLastSyncLabel')}</span>
                <span className={styles.syncValue}>{formattedLastSync}</span>
              </p>
            </div>
          </Card>

          <Card className={styles.sectionCard}>
            <div className={styles.sectionHead}>
              <span className={styles.sectionIcon} aria-hidden>
                ◈
              </span>
              <div>
                <h2 className={styles.sectionTitle}>{t('settingsSectionSecurity')}</h2>
                <p className={styles.sectionLead}>{t('settingsSecurityHint')}</p>
              </div>
            </div>
            <dl className={styles.fields}>
              <div className={styles.field}>
                <dt>{t('settingsLastSignInLabel')}</dt>
                <dd>{formattedLastLogin}</dd>
              </div>
              <div className={styles.field}>
                <dt>{t('settingsTwoFactorLabel')}</dt>
                <dd>
                  <span className={styles.pillOk}>{t('settingsTwoFactorOn')}</span>
                </dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>

      <Card className={styles.demoBanner}>
        <div className={styles.demoBannerInner}>
          <span className={styles.demoBadge}>{t('settingsDemoBanner')}</span>
          <p className={styles.demoText}>{t('settingsDemoBannerDetail')}</p>
        </div>
      </Card>
    </div>
  );
}
