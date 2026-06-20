import type { MouseEvent, ReactNode } from 'react';
import { Card } from '@/components/common/Card';
import styles from './StatCard.module.scss';

type Tone = 'default' | 'warning' | 'success';

type Props = {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: Tone;
  icon?: ReactNode;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  clickAriaLabel?: string;
};

export function StatCard({
  label,
  value,
  hint,
  tone = 'default',
  icon,
  onClick,
  clickAriaLabel,
}: Props) {
  const body = (
    <>
      <div className={styles.head}>
        {icon ? (
          <span className={`${styles.iconBadge} ${tone !== 'default' ? styles[tone] : ''}`}>
            {icon}
          </span>
        ) : null}
        <div className={styles.label}>{label}</div>
      </div>
      <div className={`${styles.value} ${tone !== 'default' ? styles[tone] : ''}`}>
        {value}
      </div>
      {hint ? <div className={styles.hintPill}>{hint}</div> : null}
    </>
  );

  if (!onClick) {
    return <Card className={styles.card}>{body}</Card>;
  }

  return (
    <Card className={`${styles.card} ${styles.clickable}`.trim()}>
      <button
        type="button"
        className={styles.clickTarget}
        onClick={onClick}
        aria-label={clickAriaLabel ?? label}
      >
        {body}
      </button>
    </Card>
  );
}
