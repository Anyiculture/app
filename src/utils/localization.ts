export const localizationUtils = {
  formatDate(date: string | Date, locale = 'en-US', options?: Intl.DateTimeFormatOptions): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...options,
    };

    return new Intl.DateTimeFormat(locale, defaultOptions).format(dateObj);
  },

  formatTime(date: string | Date, locale = 'en-US', options?: Intl.DateTimeFormatOptions): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    const defaultOptions: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      ...options,
    };

    return new Intl.DateTimeFormat(locale, defaultOptions).format(dateObj);
  },

  formatDateTime(date: string | Date, locale = 'en-US'): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(dateObj);
  },

  formatRelativeTime(date: string | Date, locale = 'en-US'): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

    if (diffInSeconds < 60) {
      return rtf.format(-diffInSeconds, 'second');
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return rtf.format(-diffInMinutes, 'minute');
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return rtf.format(-diffInHours, 'hour');
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
      return rtf.format(-diffInDays, 'day');
    }

    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
      return rtf.format(-diffInMonths, 'month');
    }

    const diffInYears = Math.floor(diffInMonths / 12);
    return rtf.format(-diffInYears, 'year');
  },

  formatCurrency(
    amount: number,
    currency = 'USD',
    locale = 'en-US',
    options?: Intl.NumberFormatOptions
  ): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      ...options,
    }).format(amount);
  },

  formatNumber(
    value: number,
    locale = 'en-US',
    options?: Intl.NumberFormatOptions
  ): string {
    return new Intl.NumberFormat(locale, options).format(value);
  },

  formatPercentage(value: number, locale = 'en-US', decimals = 0): string {
    return new Intl.NumberFormat(locale, {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value / 100);
  },

  getCurrencySymbol(currency = 'USD', locale = 'en-US'): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
    })
      .formatToParts(0)
      .find((part) => part.type === 'currency')?.value || currency;
  },

  getLocaleCurrencies(): Record<string, string> {
    return {
      'en-US': 'USD',
      'en-GB': 'GBP',
      'en-CA': 'CAD',
      'en-AU': 'AUD',
      'en-NG': 'NGN',
      'zh-CN': 'CNY',
      'zh-TW': 'TWD',
      'zh-HK': 'HKD',
    };
  },

  detectUserCurrency(locale?: string): string {
    const userLocale = locale || navigator.language;
    return this.getLocaleCurrencies()[userLocale] || 'USD';
  },

  formatDateRange(
    startDate: string | Date,
    endDate: string | Date,
    locale = 'en-US'
  ): string {
    const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
    const end = typeof endDate === 'string' ? new Date(endDate) : endDate;

    const formatter = new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    if (start.getFullYear() === end.getFullYear()) {
      if (start.getMonth() === end.getMonth()) {
        return `${formatter.format(start)} - ${end.getDate()}`;
      }
      return `${formatter.format(start)} - ${formatter.format(end)}`;
    }

    return `${formatter.format(start)} - ${formatter.format(end)}`;
  },

  parseLocalizedNumber(value: string, locale = 'en-US'): number {
    const parts = new Intl.NumberFormat(locale).formatToParts(12345.6);
    const numerals = [...new Intl.NumberFormat(locale, { useGrouping: false }).format(9876543210)].reverse();
    const index = new Map(numerals.map((d, i) => [d, i]));

    const group = new RegExp(`[${parts.find((d) => d.type === 'group')?.value}]`, 'g');
    const decimal = new RegExp(`[${parts.find((d) => d.type === 'decimal')?.value}]`);
    const numeral = new RegExp(`[${numerals.join('')}]`, 'g');

    const normalized = value
      .trim()
      .replace(group, '')
      .replace(decimal, '.')
      .replace(numeral, (d) => index.get(d)!.toString());

    return parseFloat(normalized);
  },

  getWeekdays(locale = 'en-US', format: 'long' | 'short' | 'narrow' = 'long'): string[] {
    const formatter = new Intl.DateTimeFormat(locale, { weekday: format });
    const weekdays: string[] = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(2024, 0, i + 1);
      weekdays.push(formatter.format(date));
    }

    return weekdays;
  },

  getMonths(locale = 'en-US', format: 'long' | 'short' | 'narrow' = 'long'): string[] {
    const formatter = new Intl.DateTimeFormat(locale, { month: format });
    const months: string[] = [];

    for (let i = 0; i < 12; i++) {
      const date = new Date(2024, i, 1);
      months.push(formatter.format(date));
    }

    return months;
  },

  getTimeZone(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  },

  convertTimeZone(date: string | Date, targetTimeZone: string): Date {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: targetTimeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    const parts = formatter.formatToParts(dateObj);
    const getValue = (type: string) => parts.find((p) => p.type === type)?.value || '0';

    return new Date(
      parseInt(getValue('year')),
      parseInt(getValue('month')) - 1,
      parseInt(getValue('day')),
      parseInt(getValue('hour')),
      parseInt(getValue('minute')),
      parseInt(getValue('second'))
    );
  },
};

export default localizationUtils;
