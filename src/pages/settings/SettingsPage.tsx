import { useMemo, useState } from 'react';
import { useI18n } from '@/app/providers/I18nProvider';
import type { TranslationKey } from '@/i18n';
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

type SettingsTab =
  | 'overview'
  | 'notifications'
  | 'integrations'
  | 'security'
  | 'team'
  | 'data';

const TAB_KEYS: {
  id: SettingsTab;
  labelKey: TranslationKey;
  descKey: TranslationKey;
  icon: string;
  pageNum: number;
}[] = [
  { id: 'overview', labelKey: 'settingsTabOverview', descKey: 'settingsTabOverviewDesc', icon: 'grid', pageNum: 1 },
  { id: 'notifications', labelKey: 'settingsTabNotifications', descKey: 'settingsTabNotificationsDesc', icon: 'bell', pageNum: 2 },
  { id: 'integrations', labelKey: 'settingsTabIntegrations', descKey: 'settingsTabIntegrationsDesc', icon: 'link', pageNum: 3 },
  { id: 'security', labelKey: 'settingsTabSecurity', descKey: 'settingsTabSecurityDesc', icon: 'shield', pageNum: 4 },
  { id: 'team', labelKey: 'settingsTabTeam', descKey: 'settingsTabTeamDesc', icon: 'users', pageNum: 5 },
  { id: 'data', labelKey: 'settingsTabData', descKey: 'settingsTabDataDesc', icon: 'database', pageNum: 6 },
];

const HEALTH_ITEMS = [
  { key: 'settingsHealthDatabase' as const, pct: 98, tone: 'excellent' as const },
  { key: 'settingsHealthApi' as const, pct: 94, tone: 'excellent' as const },
  { key: 'settingsHealthStorage' as const, pct: 76, tone: 'good' as const },
  { key: 'settingsHealthWebhooks' as const, pct: 100, tone: 'excellent' as const },
];

const TEAM_MEMBERS = [
  { id: 'admin', name: '부장님', roleKey: 'settingsRoleAdmin' as const, initials: '部', color: '#2d9d5f' },
  { id: 'viewer', name: '양채원', roleKey: 'settingsRoleViewer' as const, initials: '양', color: '#6366f1' },
  { id: 'finance', name: '양채원', roleKey: 'settingsRoleFinance' as const, initials: '양', color: '#c67c4e' },
];

const AUDIT_EVENTS = [
  { time: '09:42', action: 'Chek tasdiqlandi · EMP-1042', tone: 'success' as const },
  { time: '09:18', action: 'Oylik allowance yangilandi · Salim', tone: 'neutral' as const },
  { time: '08:55', action: 'Webhook sinxron · ERP', tone: 'info' as const },
  { time: '08:05', action: 'Tizimga kirish · Admin', tone: 'neutral' as const },
];

const SESSIONS = [
  { device: 'MacBook Pro · Chrome', location: 'Seoul, KR', last: '09:42', current: true },
  { device: 'iPhone 15 · Safari', location: 'Seoul, KR', last: '08:12', current: false },
  { device: 'Windows · Edge', location: 'Busan, KR', last: 'Kecha', current: false },
];

const INTEGRATIONS = [
  { key: 'settingsIntegrationErp' as const, status: 'connected' as const, meta: 'SAP B1 · v4.2' },
  { key: 'settingsIntegrationPayroll' as const, status: 'syncing' as const, meta: 'Payroll KR' },
  { key: 'settingsIntegrationStorage' as const, status: 'connected' as const, meta: 'AWS S3 · ap-northeast-2' },
  { key: 'settingsIntegrationOcr' as const, status: 'connected' as const, meta: 'Vision API · v3' },
  { key: 'settingsWebhookLabel' as const, status: 'connected' as const, meta: DEMO_WEBHOOK },
  { key: 'settingsRestApiLabel' as const, status: 'connected' as const, meta: 'v1 · admin.check.api' },
];

const PERMISSION_ROWS = [
  { roleKey: 'settingsRoleAdmin' as const, view: true, edit: true, approve: true, export: true },
  { roleKey: 'settingsRoleFinance' as const, view: true, edit: true, approve: true, export: true },
  { roleKey: 'settingsRoleViewer' as const, view: true, edit: false, approve: false, export: false },
];

function TabIcon({ name }: { name: string }) {
  switch (name) {
    case 'grid':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M4 4h7v7H4V4zm9 0h7v7h-7V4zM4 13h7v7H4v-7zm9 0h7v7h-7v-7z" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      );
    case 'bell':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M12 3a5 5 0 0 1 5 5v2.5l1.5 3H5.5l1.5-3V8a5 5 0 0 1 5-5Z" stroke="currentColor" strokeWidth="1.6" />
          <path d="M10 18a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      );
    case 'link':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M10 13a3 3 0 0 0 4.24 0l2.83-2.83a3 3 0 0 0-4.24-4.24L11 7" stroke="currentColor" strokeWidth="1.6" />
          <path d="M14 11a3 3 0 0 0-4.24 0L6.93 13.83a3 3 0 0 0 4.24 4.24L13 17" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      );
    case 'shield':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M12 3 19 7v6c0 4.5-3.5 7-7 8-3.5-1-7-3.5-7-8V7l7-4Z" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      );
    case 'users':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.6" />
          <path d="M22 19v-1a3 3 0 0 0-2-2.87M16 4.13a3 3 0 0 1 0 5.74" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      );
    case 'database':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
          <ellipse cx="12" cy="6" rx="8" ry="3" stroke="currentColor" strokeWidth="1.6" />
          <path d="M4 6v6c0 1.66 3.58 3 8 3s8-1.34 8-3V6M4 12v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      );
    default:
      return null;
  }
}

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

function ChannelCard({
  label,
  icon,
  initialOn,
}: {
  label: string;
  icon: string;
  initialOn: boolean;
}) {
  const [on, setOn] = useState(initialOn);

  return (
    <div className={`${styles.channelCard} ${on ? styles.channelCardOn : ''}`.trim()}>
      <div className={styles.channelIcon} aria-hidden>
        {icon}
      </div>
      <span className={styles.channelLabel}>{label}</span>
      <button
        type="button"
        className={`${styles.switch} ${on ? styles.switchOn : ''}`.trim()}
        role="switch"
        aria-checked={on}
        aria-label={label}
        onClick={() => setOn((v) => !v)}
      >
        <span className={styles.switchThumb} />
      </button>
    </div>
  );
}

function HealthBar({
  label,
  pct,
  tone,
  statusLabel,
}: {
  label: string;
  pct: number;
  tone: 'excellent' | 'good';
  statusLabel: string;
}) {
  return (
    <div className={styles.healthRow}>
      <div className={styles.healthMeta}>
        <span className={styles.healthLabel}>{label}</span>
        <span className={`${styles.healthStatus} ${styles[`healthStatus_${tone}`]}`}>
          {statusLabel} · {pct}%
        </span>
      </div>
      <div className={styles.healthTrack}>
        <div
          className={`${styles.healthFill} ${styles[`healthFill_${tone}`]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function SettingsPage() {
  const { t, locale } = useI18n();
  const [activeTab, setActiveTab] = useState<SettingsTab>('overview');

  const formattedLastLogin = useMemo(() => {
    const d = new Date('2026-05-17T09:42:00+09:00');
    const lc = locale === 'ko' ? 'ko-KR' : 'en-US';
    return new Intl.DateTimeFormat(lc, { dateStyle: 'medium', timeStyle: 'short' }).format(d);
  }, [locale]);

  const formattedLastSync = useMemo(() => {
    const d = new Date('2026-05-17T08:05:00+09:00');
    const lc = locale === 'ko' ? 'ko-KR' : 'en-US';
    return new Intl.DateTimeFormat(lc, { dateStyle: 'medium', timeStyle: 'short' }).format(d);
  }, [locale]);

  const formattedBackup = useMemo(() => {
    const d = new Date('2026-05-16T02:00:00+09:00');
    const lc = locale === 'ko' ? 'ko-KR' : 'en-US';
    return new Intl.DateTimeFormat(lc, { dateStyle: 'medium', timeStyle: 'short' }).format(d);
  }, [locale]);

  const internalFmt = `${formatCurrency(DEMO_INTERNAL_CAP_WON, locale)} ${t('currency')}`;
  const externalFmt = `${formatCurrency(DEMO_EXTERNAL_CAP_WON, locale)} ${t('currency')}`;

  const renderOverview = () => (
    <div className={styles.panelGrid}>
      <Card className={styles.panelCard}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionIcon}>◇</span>
          <div>
            <h2 className={styles.sectionTitle}>{t('settingsSectionOrg')}</h2>
            <p className={styles.sectionLead}>{t('settingsOrgProfileHint')}</p>
          </div>
        </div>
        <div className={styles.orgHero}>
          <div className={styles.orgLogo} aria-hidden>
            AC
          </div>
          <div className={styles.orgMeta}>
            <span className={styles.orgName}>{DEMO_ORG.name}</span>
            <code className={styles.orgId}>{DEMO_ORG.id}</code>
          </div>
        </div>
        <dl className={styles.fields}>
          <div className={styles.field}>
            <dt>{t('settingsLabelTimezone')}</dt>
            <dd>{DEMO_ORG.timezoneValue}</dd>
          </div>
          <div className={styles.field}>
            <dt>{t('settingsLabelMonthStart')}</dt>
            <dd>{t('settingsMonthStartValue')}</dd>
          </div>
          <div className={styles.field}>
            <dt>{t('settingsPlanLabel')}</dt>
            <dd>
              <span className={styles.planBadge}>{t('settingsPlanEnterprise')}</span>
              <span className={styles.planSeats}>{t('settingsPlanSeats', { used: 3, total: 10 })}</span>
            </dd>
          </div>
        </dl>
      </Card>

      <Card className={styles.panelCard}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionIcon}>⧉</span>
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

      <Card className={`${styles.panelCard} ${styles.panelWide}`}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionIcon}>◉</span>
          <div>
            <h2 className={styles.sectionTitle}>{t('settingsSystemHealth')}</h2>
            <p className={styles.sectionLead}>{t('settingsIntegrationHint')}</p>
          </div>
        </div>
        <div className={styles.healthGrid}>
          {HEALTH_ITEMS.map((item) => (
            <HealthBar
              key={item.key}
              label={t(item.key)}
              pct={item.pct}
              tone={item.tone}
              statusLabel={
                item.tone === 'excellent' ? t('settingsHealthExcellent') : t('settingsHealthGood')
              }
            />
          ))}
        </div>
      </Card>

      <Card className={styles.panelCard}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionIcon}>◷</span>
          <div>
            <h2 className={styles.sectionTitle}>{t('settingsAuditTitle')}</h2>
            <p className={styles.sectionLead}>{t('settingsAuditHint')}</p>
          </div>
        </div>
        <ul className={styles.auditList}>
          {AUDIT_EVENTS.map((event) => (
            <li key={`${event.time}-${event.action}`} className={styles.auditItem}>
              <span className={styles.auditTime}>{event.time}</span>
              <span className={`${styles.auditDot} ${styles[`auditDot_${event.tone}`]}`} aria-hidden />
              <span className={styles.auditAction}>{event.action}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );

  const renderNotifications = () => (
    <div className={styles.panelGrid}>
      <Card className={styles.panelCard}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionIcon}>✉</span>
          <div>
            <h2 className={styles.sectionTitle}>{t('settingsSectionNotify')}</h2>
            <p className={styles.sectionLead}>{t('settingsNotifyHint')}</p>
          </div>
        </div>
        <div className={styles.toggleList}>
          <ToggleRow title={t('settingsNotifyPendingTitle')} description={t('settingsNotifyPendingDesc')} initialOn />
          <ToggleRow title={t('settingsNotifyWeeklyTitle')} description={t('settingsNotifyWeeklyDesc')} initialOn />
          <ToggleRow title={t('settingsNotifyReportsTitle')} description={t('settingsNotifyReportsDesc')} initialOn={false} />
        </div>
      </Card>

      <Card className={styles.panelCard}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionIcon}>📡</span>
          <div>
            <h2 className={styles.sectionTitle}>{t('settingsChannelsTitle')}</h2>
            <p className={styles.sectionLead}>{t('settingsChannelsHint')}</p>
          </div>
        </div>
        <div className={styles.channelGrid}>
          <ChannelCard label={t('settingsChannelEmail')} icon="✉" initialOn />
          <ChannelCard label={t('settingsChannelSlack')} icon="💬" initialOn />
          <ChannelCard label={t('settingsChannelKakao')} icon="💛" initialOn />
          <ChannelCard label={t('settingsChannelSms')} icon="📱" initialOn={false} />
        </div>
      </Card>
    </div>
  );

  const renderIntegrations = () => (
    <Card className={styles.panelCard}>
      <div className={styles.sectionHead}>
        <span className={styles.sectionIcon}>⎘</span>
        <div>
          <h2 className={styles.sectionTitle}>{t('settingsIntegrationsGridTitle')}</h2>
          <p className={styles.sectionLead}>{t('settingsIntegrationsGridHint')}</p>
        </div>
      </div>
      <div className={styles.integrationGrid}>
        {INTEGRATIONS.map((item) => (
          <div key={item.key} className={styles.integrationCard}>
            <div className={styles.integrationCardHead}>
              <span className={styles.integrationCardTitle}>{t(item.key)}</span>
              <span
                className={
                  item.status === 'syncing' ? styles.pillSync : styles.pillOk
                }
              >
                {item.status === 'syncing'
                  ? t('settingsStatusSyncing')
                  : t('settingsStatusConnected')}
              </span>
            </div>
            <code className={styles.integrationCardMeta}>{item.meta}</code>
            <div className={styles.integrationCardBar}>
              <div
                className={styles.integrationCardBarFill}
                style={{ width: item.status === 'syncing' ? '62%' : '100%' }}
              />
            </div>
          </div>
        ))}
      </div>
      <p className={styles.syncLine}>
        <span className={styles.syncLabel}>{t('settingsLastSyncLabel')}</span>
        <span className={styles.syncValue}>{formattedLastSync}</span>
      </p>
    </Card>
  );

  const renderSecurity = () => (
    <div className={styles.panelGrid}>
      <Card className={styles.panelCard}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionIcon}>◈</span>
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

      <Card className={styles.panelCard}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionIcon}>🖥</span>
          <div>
            <h2 className={styles.sectionTitle}>{t('settingsSessionTitle')}</h2>
            <p className={styles.sectionLead}>{t('settingsSessionHint')}</p>
          </div>
        </div>
        <div className={styles.sessionTable}>
          <div className={styles.sessionHead}>
            <span>{t('settingsSessionDevice')}</span>
            <span>{t('settingsSessionLocation')}</span>
            <span>{t('settingsSessionLastActive')}</span>
          </div>
          {SESSIONS.map((session) => (
            <div key={session.device} className={styles.sessionRow}>
              <span className={styles.sessionDevice}>
                {session.device}
                {session.current ? (
                  <span className={styles.sessionCurrent}>{t('settingsSessionCurrent')}</span>
                ) : null}
              </span>
              <span>{session.location}</span>
              <span className={styles.sessionLast}>{session.last}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className={`${styles.panelCard} ${styles.panelWide}`}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionIcon}>⚠</span>
          <div>
            <h2 className={styles.sectionTitle}>{t('settingsDangerZone')}</h2>
            <p className={styles.sectionLead}>{t('settingsDangerHint')}</p>
          </div>
        </div>
        <div className={styles.dangerActions}>
          <button type="button" className={styles.dangerBtn}>
            {t('settingsDangerReset')}
          </button>
          <button type="button" className={styles.dangerBtn}>
            {t('settingsDangerRevoke')}
          </button>
        </div>
      </Card>
    </div>
  );

  const renderTeam = () => (
    <div className={styles.panelGrid}>
      <Card className={styles.panelCard}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionIcon}>👥</span>
          <div>
            <h2 className={styles.sectionTitle}>{t('settingsTeamTitle')}</h2>
            <p className={styles.sectionLead}>{t('settingsTeamHint')}</p>
          </div>
        </div>
        <ul className={styles.teamList}>
          {TEAM_MEMBERS.map((member) => (
            <li key={member.id} className={styles.teamRow}>
              <div
                className={styles.teamAvatar}
                style={{ background: `color-mix(in srgb, ${member.color} 18%, transparent)`, color: member.color }}
              >
                {member.initials}
              </div>
              <div className={styles.teamInfo}>
                <span className={styles.teamName}>{member.name}</span>
                <span className={styles.teamRole}>{t(member.roleKey)}</span>
              </div>
              <span className={styles.pillOk}>{t('statusActiveLabel')}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card className={`${styles.panelCard} ${styles.panelWide}`}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionIcon}>🔐</span>
          <div>
            <h2 className={styles.sectionTitle}>{t('settingsPermissionsTitle')}</h2>
            <p className={styles.sectionLead}>{t('settingsPermissionsHint')}</p>
          </div>
        </div>
        <div className={styles.permTable}>
          <div className={styles.permHead}>
            <span />
            <span>{t('settingsPermView')}</span>
            <span>{t('settingsPermEdit')}</span>
            <span>{t('settingsPermApprove')}</span>
            <span>{t('settingsPermExport')}</span>
          </div>
          {PERMISSION_ROWS.map((row) => (
            <div key={row.roleKey} className={styles.permRow}>
              <span className={styles.permRole}>{t(row.roleKey)}</span>
              <span className={row.view ? styles.permYes : styles.permNo}>{row.view ? '✓' : '—'}</span>
              <span className={row.edit ? styles.permYes : styles.permNo}>{row.edit ? '✓' : '—'}</span>
              <span className={row.approve ? styles.permYes : styles.permNo}>{row.approve ? '✓' : '—'}</span>
              <span className={row.export ? styles.permYes : styles.permNo}>{row.export ? '✓' : '—'}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  const renderData = () => (
    <div className={styles.panelGrid}>
      <Card className={styles.panelCard}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionIcon}>💾</span>
          <div>
            <h2 className={styles.sectionTitle}>{t('settingsBackupTitle')}</h2>
            <p className={styles.sectionLead}>{t('settingsBackupHint')}</p>
          </div>
        </div>
        <div className={styles.exportGrid}>
          <button type="button" className={styles.exportBtn}>
            <span className={styles.exportIcon}>📄</span>
            {t('settingsExportCsv')}
          </button>
          <button type="button" className={styles.exportBtn}>
            <span className={styles.exportIcon}>📊</span>
            {t('settingsExportPdf')}
          </button>
          <button type="button" className={styles.exportBtn}>
            <span className={styles.exportIcon}>📗</span>
            {t('settingsExportExcel')}
          </button>
        </div>
        <p className={styles.backupMeta}>{t('settingsBackupSchedule')}</p>
        <p className={styles.backupMeta}>{t('settingsBackupLast', { date: formattedBackup })}</p>
      </Card>

      <Card className={styles.panelCard}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionIcon}>📦</span>
          <div>
            <h2 className={styles.sectionTitle}>{t('settingsStatStorage')}</h2>
            <p className={styles.sectionLead}>{t('settingsStatStorageHint')}</p>
          </div>
        </div>
        <div className={styles.storageRing}>
          <svg viewBox="0 0 120 120" className={styles.storageSvg} aria-hidden>
            <circle cx="60" cy="60" r="48" className={styles.storageTrack} />
            <circle cx="60" cy="60" r="48" className={styles.storageFill} strokeDasharray="301.6" strokeDashoffset="72" />
          </svg>
          <div className={styles.storageCenter}>
            <span className={styles.storagePct}>76%</span>
            <span className={styles.storageLabel}>2.4 GB / 3.2 GB</span>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'notifications':
        return renderNotifications();
      case 'integrations':
        return renderIntegrations();
      case 'security':
        return renderSecurity();
      case 'team':
        return renderTeam();
      case 'data':
        return renderData();
      default:
        return null;
    }
  };

  const activeTabMeta = TAB_KEYS.find((tab) => tab.id === activeTab) ?? TAB_KEYS[0];
  const totalTabs = TAB_KEYS.length;

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroGlow} aria-hidden />
        <div className={styles.heroInner}>
          <div className={styles.heroText}>
            <span className={styles.heroBadge}>{t('settingsHeroBadge')}</span>
            <h1 className={styles.heroTitle}>{t('settingsPageTitle')}</h1>
            <p className={styles.heroSubtitle}>{t('settingsHeroSubtitle')}</p>
          </div>
          <div className={styles.heroActions}>
            <span className={styles.heroActionsLabel}>{t('settingsQuickActions')}</span>
            <div className={styles.heroBtnRow}>
              <button type="button" className={styles.heroBtnPrimary}>
                {t('settingsQuickSync')}
              </button>
              <button type="button" className={styles.heroBtn}>
                {t('settingsQuickExport')}
              </button>
              <button type="button" className={styles.heroBtn}>
                {t('settingsQuickDocs')}
              </button>
            </div>
          </div>
        </div>
      </section>

      {activeTab === 'overview' ? (
        <section className={styles.statsRow} aria-label={t('settingsSystemHealth')}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>{t('settingsStatUptime')}</span>
            <span className={`${styles.statValue} ${styles.statSuccess}`}>99.97%</span>
            <span className={styles.statHint}>{t('settingsStatUptimeHint')}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>{t('settingsStatLatency')}</span>
            <span className={styles.statValue}>42ms</span>
            <span className={styles.statHint}>{t('settingsStatLatencyHint')}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>{t('settingsStatActiveWorkers')}</span>
            <span className={styles.statValue}>128</span>
            <span className={styles.statHint}>{t('settingsStatWorkersHint')}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>{t('settingsStatApiCalls')}</span>
            <span className={styles.statValue}>14.2k</span>
            <span className={styles.statHint}>{t('settingsStatApiHint')}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>{t('settingsStatStorage')}</span>
            <span className={styles.statValue}>76%</span>
            <span className={styles.statHint}>{t('settingsStatStorageHint')}</span>
          </div>
        </section>
      ) : null}

      <div className={styles.workspace}>
        <aside className={styles.navAside}>
          <div className={styles.navAsideHead}>
            <span className={styles.navAsideLabel}>{t('settingsNavSectionsLabel')}</span>
            <p className={styles.navAsideHint}>{t('settingsNavSectionsHint')}</p>
          </div>
          <nav className={styles.tabNav} aria-label={t('settingsNavSectionsLabel')}>
            {TAB_KEYS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  className={`${styles.tabBtn} ${isActive ? styles.tabBtnActive : ''}`.trim()}
                  onClick={() => setActiveTab(tab.id)}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span className={styles.tabBtnMain}>
                    <span className={styles.tabPageNum}>{String(tab.pageNum).padStart(2, '0')}</span>
                    <span className={styles.tabIcon}>
                      <TabIcon name={tab.icon} />
                    </span>
                    <span className={styles.tabBtnText}>
                      <span className={styles.tabBtnTitle}>{t(tab.labelKey)}</span>
                      <span className={styles.tabBtnDesc}>{t(tab.descKey)}</span>
                    </span>
                  </span>
                  {isActive ? (
                    <span className={styles.tabBtnArrow} aria-hidden>
                      →
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>
        </aside>

        <div className={styles.tabPage} key={activeTab}>
          <header className={styles.tabPageHeader}>
            <div className={styles.tabPageBreadcrumb}>
              <span>{t('settingsBreadcrumbRoot')}</span>
              <span className={styles.tabPageSep} aria-hidden>/</span>
              <span className={styles.tabPageCurrent}>{t(activeTabMeta.labelKey)}</span>
            </div>
            <div className={styles.tabPageTitleRow}>
              <div className={styles.tabPageTitleWrap}>
                <span className={styles.tabPageIcon}>
                  <TabIcon name={activeTabMeta.icon} />
                </span>
                <div>
                  <h2 className={styles.tabPageTitle}>{t(activeTabMeta.labelKey)}</h2>
                  <p className={styles.tabPageDesc}>{t(activeTabMeta.descKey)}</p>
                </div>
              </div>
              <span className={styles.tabPageBadge}>
                {t('settingsTabPageBadge', {
                  current: activeTabMeta.pageNum,
                  total: totalTabs,
                })}
              </span>
            </div>
          </header>
          <div className={styles.tabPageBody}>{renderTabContent()}</div>
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
