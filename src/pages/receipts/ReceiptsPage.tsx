import type { Locale } from '@/i18n';
import { useI18n } from '@/app/providers/I18nProvider';
import { useReceipts } from '@/app/providers/ReceiptsProvider';
import type { ReceiptStatus } from '@/types/receipt.types';
import { formatCurrency } from '@/utils/format';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import styles from './ReceiptsPage.module.scss';

export function ReceiptsPage() {
  const { t, locale } = useI18n();
  const { receipts, approveReceipt, rejectReceipt } = useReceipts();

  const sorted = [...receipts].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <div className={styles.page}>
      <p className={styles.lead}>{t('receiptsPageHint')}</p>

      <div className={styles.list}>
        {sorted.map((r) => (
          <Card key={r.id} className={styles.item}>
            <div className={styles.thumb}>
              <img src={r.imageUrl} alt="" width={56} height={56} loading="lazy" />
            </div>
            <div className={styles.body}>
              <div className={styles.top}>
                <div>
                  <div className={styles.name}>{r.employeeName}</div>
                  <div className={styles.amount}>
                    {formatCurrency(r.amount, locale)} {t('currency')}
                  </div>
                </div>
                <StatusBadge status={r.status} />
              </div>
              <div className={styles.meta}>
                <span>
                  {t('receiptDate')}: {formatDate(r.createdAt, locale)}
                </span>
                <span className={styles.id}>ID · {r.id}</span>
              </div>
              {r.status === 'PENDING' ? (
                <div className={styles.actions}>
                  <Button type="button" variant="outline" onClick={() => approveReceipt(r.id)}>
                    {t('approve')}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => rejectReceipt(r.id)}>
                    {t('reject')}
                  </Button>
                </div>
              ) : null}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: ReceiptStatus }) {
  const { t } = useI18n();
  const label =
    status === 'PENDING'
      ? t('statusPending')
      : status === 'APPROVED'
        ? t('statusApproved')
        : t('statusRejected');

  const cls =
    status === 'PENDING'
      ? styles.stPending
      : status === 'APPROVED'
        ? styles.stApproved
        : styles.stRejected;

  return <span className={`${styles.status} ${cls}`}>{label}</span>;
}

function formatDate(iso: string, locale: Locale) {
  const d = new Date(iso);
  const lc = locale === 'ko' ? 'ko-KR' : 'uz-Latn-UZ';
  return new Intl.DateTimeFormat(lc, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(d);
}
