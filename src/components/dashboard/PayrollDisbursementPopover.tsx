import { useEffect, useLayoutEffect, useRef, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { useI18n } from '@/app/providers/I18nProvider';
import { Button } from '@/components/common/Button';
import { parseWonAmountInput } from '@/utils/payrollDisbursement';
import styles from './PayrollDisbursementPopover.module.scss';

type Props = {
  open: boolean;
  anchorRect: DOMRect | null;
  label: string;
  initialValue: number | null;
  saving?: boolean;
  saveError?: string;
  onSave: (amount: number) => void | Promise<void>;
  onClose: () => void;
};

function computePopoverPosition(
  anchor: DOMRect,
  popoverWidth: number,
  popoverHeight: number,
): { top: number; left: number } {
  const gap = 12;
  const margin = 16;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let left = anchor.right + gap;
  let top = anchor.top + (anchor.height - popoverHeight) / 2;

  if (left + popoverWidth > vw - margin) {
    left = anchor.left - popoverWidth - gap;
  }

  if (left < margin) {
    left = Math.max(margin, anchor.left);
    top = anchor.bottom + gap;
  }

  top = Math.max(margin, Math.min(top, vh - popoverHeight - margin));
  left = Math.max(margin, Math.min(left, vw - popoverWidth - margin));

  return { top, left };
}

export function PayrollDisbursementPopover({
  open,
  anchorRect,
  label,
  initialValue,
  saving = false,
  saveError = '',
  onSave,
  onClose,
}: Props) {
  const { t } = useI18n();
  const popoverRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!open) return;
    setValue(initialValue === null ? '' : String(initialValue));
    setError('');
  }, [open, initialValue]);

  useLayoutEffect(() => {
    if (!open || !anchorRect || !popoverRef.current) return;

    const updatePosition = () => {
      if (!popoverRef.current || !anchorRect) return;
      const { offsetWidth, offsetHeight } = popoverRef.current;
      setPosition(computePopoverPosition(anchorRect, offsetWidth, offsetHeight));
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open, anchorRect, value, error]);

  useEffect(() => {
    if (!open) return;
    const id = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
    return () => window.cancelAnimationFrame(id);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (saving) return;

    const parsed = parseWonAmountInput(value);
    if (parsed === null) {
      setError(t('payrollDisbursementInvalid'));
      return;
    }
    await onSave(parsed);
  };

  if (!open || !anchorRect) return null;

  return createPortal(
    <>
      <button
        type="button"
        className={styles.backdrop}
        aria-label={t('payrollDisbursementCancel')}
        onClick={onClose}
      />
      <div
        ref={popoverRef}
        className={styles.popover}
        style={{ top: position.top, left: position.left }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="payroll-disbursement-title"
      >
        <form className={styles.form} onSubmit={handleSubmit}>
          <p id="payroll-disbursement-title" className={styles.title}>
            {label}
          </p>
          <p className={styles.subtitle}>{t('payrollDisbursementPromptShort')}</p>

          <label className={styles.fieldLabel} htmlFor="payroll-disbursement-input">
            {t('payrollDisbursementAmountLabel')}
          </label>
          <div className={`${styles.inputWrap} ${error ? styles.inputWrapError : ''}`.trim()}>
            <input
              ref={inputRef}
              id="payroll-disbursement-input"
              className={styles.input}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                if (error) setError('');
              }}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? 'payroll-disbursement-error' : undefined}
            />
            <span className={styles.suffix}>{t('currency')}</span>
          </div>
          {error ? (
            <p id="payroll-disbursement-error" className={styles.error} role="alert">
              {error}
            </p>
          ) : null}
          {saveError ? (
            <p className={styles.error} role="alert">
              {saveError}
            </p>
          ) : null}

          <div className={styles.actions}>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              {t('payrollDisbursementCancel')}
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? '…' : t('payrollDisbursementSave')}
            </Button>
          </div>
        </form>
      </div>
    </>,
    document.body,
  );
}
