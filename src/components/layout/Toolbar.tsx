import type { ReactNode } from 'react';
import styles from './Toolbar.module.scss';

export function Toolbar({ children }: { children: ReactNode }) {
  return <div className={styles.group}>{children}</div>;
}

export function ToolbarDivider() {
  return <span className={styles.divider} aria-hidden />;
}

export { styles as toolbarStyles };
