import type { ReactNode } from 'react';
import { Card } from '@/components/common/Card';
import styles from './StatCard.module.scss';

type Tone = 'default' | 'warning' | 'success';

type Props = {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: Tone;
};

export function StatCard({ label, value, hint, tone = 'default' }: Props) {
  return (
    <Card className={styles.card}>
      <div className={styles.label}>{label}</div>
      <div className={`${styles.value} ${tone !== 'default' ? styles[tone] : ''}`}>
        {value}
      </div>
      {hint ? <div className={styles.hint}>{hint}</div> : null}
    </Card>
  );
}
