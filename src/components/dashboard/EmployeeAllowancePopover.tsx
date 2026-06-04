import { FormEvent, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useI18n } from '@/app/providers/I18nProvider';
import { Button } from '@/components/common/Button';
import { parseWonAmountInput } from '@/utils/payrollDisbursement';
import styles from './PayrollDisbursementPopover.module.scss';

type Props = {
  open: boolean;
  anchorRect: DOMRect | null;
  employeeName: string;
  initialBaseAmount: number;
  initialExtraAmount: number;
  initialReason: string;
  saving?: boolean;
  saveError?: string;
  /** Oylik ovqat puli sahifasi: faqat asosiy summa maydoni. */
  baseOnly?: boolean;
  onSave: (payload: {
    baseAmount: number;
    extraAmount: number;
    reason: string;
  }) => void | Promise<void>;
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

export function EmployeeAllowancePopover({
  open,
  anchorRect,
  employeeName,
  initialBaseAmount,
  initialExtraAmount,
  initialReason,
  saving = false,
  saveError = '',
  baseOnly = false,
  onSave,
  onClose,
}: Props) {
  const { t } = useI18n();
  const popoverRef = useRef<HTMLDivElement>(null);
  const baseInputRef = useRef<HTMLInputElement>(null);
  const [baseAmount, setBaseAmount] = useState('');
  const [extraAmount, setExtraAmount] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!open) return;
    setBaseAmount(String(initialBaseAmount));
    setExtraAmount(String(initialExtraAmount));
    setReason(initialReason);
    setError('');
  }, [open, initialBaseAmount, initialExtraAmount, initialReason]);

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
  }, [open, anchorRect, baseAmount, extraAmount, reason, error, saveError, baseOnly]);

  useEffect(() => {
    if (!open) return;
    const id = window.requestAnimationFrame(() => {
      baseInputRef.current?.focus();
      baseInputRef.current?.select();
    });
    return () => window.cancelAnimationFrame(id);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const parsedBase = parseWonAmountInput(baseAmount);
  const parsedExtra = parseWonAmountInput(extraAmount || '0');
  const previewTotal = useMemo(() => {
    if (parsedBase === null || parsedExtra === null) return null;
    return parsedBase + parsedExtra;
  }, [parsedBase, parsedExtra]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (saving) return;

    if (parsedBase === null) {
      setError(t('employeeAllowanceBaseInvalid'));
      return;
    }

    if (baseOnly) {
      await onSave({
        baseAmount: parsedBase,
        extraAmount: 0,
        reason: '',
      });
      return;
    }

    const extra = parseWonAmountInput(extraAmount || '0');
    if (extra === null) {
      setError(t('employeeAllowanceExtraInvalid'));
      return;
    }

    await onSave({
      baseAmount: parsedBase,
      extraAmount: extra,
      reason: reason.trim(),
    });
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
        style={{ top: position.top, left: position.left, width: 'min(360px, calc(100vw - 32px))' }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="employee-allowance-title"
      >
        <form className={styles.form} onSubmit={handleSubmit}>
          <p id="employee-allowance-title" className={styles.title}>
            {t('employeeAllowanceTitle', { name: employeeName })}
          </p>
          <p className={styles.subtitle}>
            {baseOnly ? t('payrollDisbursementPromptShort') : t('employeeAllowancePrompt')}
          </p>

          <label className={styles.fieldLabel} htmlFor="employee-allowance-base">
            {t('employeeAllowanceBaseLabel')}
          </label>
          <div className={`${styles.inputWrap} ${error ? styles.inputWrapError : ''}`.trim()}>
            <input
              ref={baseInputRef}
              id="employee-allowance-base"
              className={styles.input}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={baseAmount}
              onChange={(event) => {
                setBaseAmount(event.target.value);
                if (error) setError('');
              }}
            />
            <span className={styles.suffix}>{t('currency')}</span>
          </div>

          {!baseOnly ? (
            <>
              <label className={styles.fieldLabel} htmlFor="employee-allowance-extra">
                {t('employeeAllowanceExtraLabel')}
              </label>
              <div className={styles.inputWrap}>
                <input
                  id="employee-allowance-extra"
                  className={styles.input}
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  value={extraAmount}
                  onChange={(event) => setExtraAmount(event.target.value)}
                />
                <span className={styles.suffix}>{t('currency')}</span>
              </div>

              <label className={styles.fieldLabel} htmlFor="employee-allowance-reason">
                {t('employeeAllowanceReasonLabel')}
              </label>
              <textarea
                id="employee-allowance-reason"
                className={styles.textarea}
                rows={2}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder={t('employeeAllowanceReasonPlaceholder')}
              />

              {previewTotal !== null ? (
                <p className={styles.previewTotal}>
                  {t('employeeAllowanceTotalLabel')}: {previewTotal.toLocaleString()} {t('currency')}
                </p>
              ) : null}
            </>
          ) : null}

          {error ? (
            <p className={styles.error} role="alert">
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
