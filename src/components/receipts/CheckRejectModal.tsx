import { type FormEvent, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useI18n } from '@/app/providers/I18nProvider';
import { Button } from '@/components/common/Button';
import styles from './CheckRejectModal.module.scss';

type Props = {
  open: boolean;
  storeName: string;
  saving?: boolean;
  error?: string;
  onConfirm: (rejectReason: string) => void | Promise<void>;
  onClose: () => void;
};

export function CheckRejectModal({
  open,
  storeName,
  saving = false,
  error = '',
  onConfirm,
  onClose,
}: Props) {
  const { t } = useI18n();
  const [reason, setReason] = useState('');
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (!open) return;
    setReason('');
    setValidationError('');
  }, [open, storeName]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (saving) return;

    const trimmed = reason.trim();
    if (!trimmed) {
      setValidationError(t('monthlyRejectReasonRequired'));
      return;
    }

    await onConfirm(trimmed);
  };

  if (!open) return null;

  return createPortal(
    <>
      <button
        type="button"
        className={styles.backdrop}
        aria-label={t('monthlyRejectCancel')}
        onClick={onClose}
      />
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="check-reject-title"
      >
        <form className={styles.form} onSubmit={handleSubmit}>
          <h2 id="check-reject-title" className={styles.title}>
            {t('receiptRejectModalTitle', { name: storeName })}
          </h2>
          <p className={styles.subtitle}>{t('receiptRejectModalPrompt')}</p>

          <label className={styles.fieldLabel} htmlFor="check-reject-reason">
            {t('monthlyRejectReasonLabel')}
          </label>
          <textarea
            id="check-reject-reason"
            className={`${styles.textarea} ${validationError ? styles.textareaError : ''}`.trim()}
            rows={3}
            value={reason}
            onChange={(event) => {
              setReason(event.target.value);
              if (validationError) setValidationError('');
            }}
            placeholder={t('monthlyRejectReasonPlaceholder')}
            autoFocus
          />

          {validationError ? (
            <p className={styles.error} role="alert">
              {validationError}
            </p>
          ) : null}
          {error ? (
            <p className={styles.error} role="alert">
              {error}
            </p>
          ) : null}

          <div className={styles.actions}>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              {t('monthlyRejectCancel')}
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? '…' : t('monthlyRejectConfirm')}
            </Button>
          </div>
        </form>
      </div>
    </>,
    document.body,
  );
}
