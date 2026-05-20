import { useEffect, useRef, useState } from 'react';
import { useI18n } from '@/app/providers/I18nProvider';
import { formatCalendarMonth } from '@/utils/format';
import {
  DEMO_CALENDAR_YEARS,
  MONTH_INDEXES,
} from '@/utils/receiptMonthFilter';
import styles from './YearMonthToolbar.module.scss';

type Props = {
  selectedYear: number;
  selectedMonth: number;
  onYearChange: (year: number) => void;
  onMonthChange: (month: number) => void;
  countsByMonth?: number[];
  className?: string;
};

export function YearMonthToolbar({
  selectedYear,
  selectedMonth,
  onYearChange,
  onMonthChange,
  countsByMonth,
  className,
}: Props) {
  const { t, locale } = useI18n();
  const [yearMenuOpen, setYearMenuOpen] = useState(false);
  const yearPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!yearMenuOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (yearPickerRef.current && !yearPickerRef.current.contains(e.target as Node)) {
        setYearMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [yearMenuOpen]);

  const handleYearPick = (year: number) => {
    onYearChange(year);
    setYearMenuOpen(false);
  };

  const rootClass = className ? `${styles.toolbar} ${className}`.trim() : styles.toolbar;

  return (
    <div className={rootClass}>
      <div className={styles.yearPickerWrap} ref={yearPickerRef}>
        <button
          type="button"
          className={`${styles.yearPickerBtn} ${yearMenuOpen ? styles.yearPickerBtnOpen : ''}`.trim()}
          aria-expanded={yearMenuOpen}
          aria-haspopup="listbox"
          aria-label={t('receiptsYearPickerAria')}
          onClick={() => setYearMenuOpen((open) => !open)}
        >
          <span className={styles.yearPickerLabel}>
            {t('receiptsYearLabel', { year: selectedYear })}
          </span>
          <span className={styles.yearPickerChevron} aria-hidden>
            {yearMenuOpen ? '▴' : '▾'}
          </span>
        </button>

        {yearMenuOpen ? (
          <div
            className={styles.yearMenu}
            role="listbox"
            aria-label={t('receiptsYearPickerAria')}
          >
            {DEMO_CALENDAR_YEARS.map((year) => {
              const active = year === selectedYear;
              return (
                <button
                  key={year}
                  type="button"
                  role="option"
                  aria-selected={active}
                  className={`${styles.yearOption} ${active ? styles.yearOptionActive : ''}`.trim()}
                  onClick={() => handleYearPick(year)}
                >
                  {t('receiptsYearLabel', { year })}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      <div className={styles.monthStrip} role="tablist" aria-label={t('receiptsMonthPickerAria')}>
        {MONTH_INDEXES.map((m) => {
          const count = countsByMonth?.[m - 1] ?? 0;
          const active = selectedMonth === m;
          return (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={active}
              className={`${styles.monthBtn} ${active ? styles.monthBtnActive : ''}`}
              onClick={() => onMonthChange(m)}
            >
              <span className={styles.monthBtnLabel}>
                {formatCalendarMonth(m, locale, 'short')}
              </span>
              {count > 0 ? (
                <span className={styles.monthBtnBadge} aria-hidden>
                  {count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
