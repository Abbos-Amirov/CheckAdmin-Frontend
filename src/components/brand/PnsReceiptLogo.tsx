import styles from './PnsReceiptLogo.module.scss';

type Props = {
  subtitle?: string;
  compact?: boolean;
};

export function PnsReceiptLogo({ subtitle, compact = false }: Props) {
  return (
    <div className={`${styles.logo} ${compact ? styles.compact : ''}`.trim()}>
      <div className={styles.markWrap} aria-hidden>
        <div className={styles.markGlow} />
        <div className={styles.mark}>
          <svg className={styles.markSvg} viewBox="0 0 48 48" fill="none">
            <rect
              x="10"
              y="6"
              width="28"
              height="36"
              rx="6"
              className={styles.markPaper}
            />
            <path
              d="M16 16h16M16 22h16M16 28h10"
              className={styles.markLines}
              strokeWidth="2.4"
              strokeLinecap="round"
            />
            <circle cx="32" cy="32" r="9" className={styles.markBadge} />
            <path
              d="M28.5 32l2.2 2.2L35.8 29"
              className={styles.markCheck}
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      <div className={styles.text}>
        <div className={styles.wordmark}>
          <span className={styles.pns}>PNS</span>
          <span className={styles.receipt}>Receipt</span>
        </div>
        {subtitle && !compact ? (
          <p className={styles.subtitle}>{subtitle}</p>
        ) : null}
      </div>
    </div>
  );
}
