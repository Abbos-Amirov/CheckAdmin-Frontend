import type { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './Button.module.scss';

type Variant = 'primary' | 'outline' | 'ghost';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  children: ReactNode;
};

export function Button({
  variant = 'primary',
  className,
  type = 'button',
  ...rest
}: Props) {
  const classes = [styles.button, styles[variant], className]
    .filter(Boolean)
    .join(' ');

  return <button type={type} className={classes} {...rest} />;
}
