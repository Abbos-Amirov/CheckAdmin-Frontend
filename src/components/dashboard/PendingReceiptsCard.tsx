import { useI18n } from '@/app/providers/I18nProvider';
import type { Receipt } from '@/types/receipt.types';
import { Card } from '@/components/common/Card';
import { ReceiptItem } from '@/components/dashboard/ReceiptItem';
import styles from './PendingReceiptsCard.module.scss';

type Props = {
  receipts: Receipt[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
};

export function PendingReceiptsCard({
  receipts,
  onApprove,
  onReject,
}: Props) {
  const { t } = useI18n();
  const pending = receipts.filter((r) => r.status === 'PENDING');

  return (
    <Card className={styles.card}>
      <div className={styles.head}>
        <h2 className={styles.title}>{t('pendingReceipts')}</h2>
      </div>

      {pending.length === 0 ? (
        <p className={styles.empty}>{t('noPending')}</p>
      ) : (
        <ul className={styles.list}>
          {pending.map((receipt) => (
            <li key={receipt.id}>
              <ReceiptItem
                receipt={receipt}
                onApprove={() => onApprove(receipt.id)}
                onReject={() => onReject(receipt.id)}
              />
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
