import type { Locale } from '@/i18n';

/** Demo reference month shown in header (May 2026). */
export function formatDashboardMonth(date: Date, locale: Locale): string {
  if (locale === 'ko') {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
    }).format(date);
  }
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
  }).format(date);
}

/** Raqamni locale bo‘yicha guruhlaydi; valyuta yozuvi `t('currency')` (won / 원) bilan qo‘shiladi. */
export function formatCurrency(amount: number, locale: Locale): string {
  const lc = locale === 'ko' ? 'ko-KR' : 'en-US';
  return new Intl.NumberFormat(lc, { maximumFractionDigits: 0 }).format(amount);
}

/** Excel eksport — chek sanasi (masalan: 12.05.2026). */
export function formatReceiptDate(iso: string, _locale: Locale): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}.${month}.${d.getFullYear()}`;
}

export function formatCompactMonthlySum(amount: number, locale: Locale): string {
  const millions = amount / 1_000_000;
  if (millions >= 1 && millions === Math.round(millions * 10) / 10) {
    return `${millions.toFixed(1)}M`;
  }
  return formatCurrency(amount, locale);
}

/** `month` — 1…12. Yil faqat kabisa/kalendar uchun kerak emas. */
export function formatCalendarMonth(
  month: number,
  locale: Locale,
  style: 'long' | 'short' = 'long',
): string {
  const safe = Math.min(12, Math.max(1, month));
  const d = new Date(2020, safe - 1, 15);
  const lc = locale === 'ko' ? 'ko-KR' : 'en-US';
  return new Intl.DateTimeFormat(lc, { month: style }).format(d);
}
