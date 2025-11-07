import { format } from 'date-fns';
import { uk, ru, pl, enUS } from 'date-fns/locale';
import { Language } from '@/types/i18n';

const localeMap = {
  uk,
  ru, 
  pl,
  en: enUS
};

export const formatDate = (date: Date | string, formatStr: string, language: Language): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const locale = localeMap[language];
  
  return format(dateObj, formatStr, { locale });
};

export const getLocalizedTimeUnit = (unit: string, language: Language): string => {
  const units = {
    uk: {
      min: 'хв',
      mins: 'хв',
      minutes: 'хвилин',
      hour: 'год',
      hours: 'годин',
      day: 'день',
      days: 'днів',
      week: 'тиждень',
      weeks: 'тижнів',
      month: 'місяць',
      months: 'місяців',
      year: 'рік',
      years: 'років'
    },
    ru: {
      min: 'мин',
      mins: 'мин',
      minutes: 'минут',
      hour: 'час',
      hours: 'часов',
      day: 'день',
      days: 'дней',
      week: 'неделя',
      weeks: 'недель',
      month: 'месяц',
      months: 'месяцев',
      year: 'год',
      years: 'лет'
    },
    pl: {
      min: 'min',
      mins: 'min',
      minutes: 'minut',
      hour: 'godz',
      hours: 'godzin',
      day: 'dzień',
      days: 'dni',
      week: 'tydzień',
      weeks: 'tygodni',
      month: 'miesiąc',
      months: 'miesięcy',
      year: 'rok',
      years: 'lat'
    },
    en: {
      min: 'min',
      mins: 'mins',
      minutes: 'minutes',
      hour: 'hour',
      hours: 'hours',
      day: 'day',
      days: 'days',
      week: 'week',
      weeks: 'weeks',
      month: 'month',
      months: 'months',
      year: 'year',
      years: 'years'
    }
  };

  return units[language][unit] || unit;
};