import { useState } from 'react';
import { useI18n } from '@/app/providers/I18nProvider';
import styles from './PasswordInput.module.scss';

type PasswordInputProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  inputClassName?: string;
};

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 3l18 18M10.58 10.58A3 3 0 0 0 12 15a3 3 0 0 0 2.42-4.42M9.88 4.24A10.94 10.94 0 0 1 12 5c6.5 0 10 7 10 7a18.2 18.2 0 0 1-4.11 5.19M6.11 6.11C3.6 7.86 2 12 2 12s3.5 7 10 7c1.05 0 2.02-.16 2.92-.45"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PasswordInput({
  id,
  value,
  onChange,
  placeholder,
  autoComplete,
  inputClassName = '',
}: PasswordInputProps) {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);

  return (
    <div className={styles.wrap}>
      <input
        id={id}
        className={`${inputClassName} ${styles.inputWithToggle}`.trim()}
        type={visible ? 'text' : 'password'}
        autoComplete={autoComplete}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
      <button
        type="button"
        className={styles.toggle}
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? t('authHidePassword') : t('authShowPassword')}
      >
        {visible ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  );
}
