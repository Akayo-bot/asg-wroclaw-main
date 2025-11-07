export const formatCurrency = (
  amount: number | null, 
  currency: string = 'PLN', 
  language: string = 'uk'
): string => {
  if (amount === null || amount === undefined) {
    const freeLabels = {
      uk: 'Безкоштовно',
      ru: 'Бесплатно', 
      pl: 'Bezpłatnie',
      en: 'Free'
    };
    return freeLabels[language as keyof typeof freeLabels] || 'Free';
  }

  try {
    const localeMap = {
      uk: 'uk-UA',
      ru: 'ru-RU',
      pl: 'pl-PL', 
      en: 'en-US'
    };

    const locale = localeMap[language as keyof typeof localeMap] || 'en-US';
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  } catch (error) {
    console.warn('Error formatting currency:', error);
    // Fallback with currency symbols
    const symbols: Record<string, string> = {
      PLN: 'zł',
      USD: '$',
      EUR: '€',
      UAH: '₴'
    };
    const symbol = symbols[currency] || currency;
    return `${amount} ${symbol}`;
  }
};

export const formatPlayerLimits = (
  limitMode: string | null,
  minPlayers: number | null,
  maxPlayers: number | null,
  currentPlayers: number = 0,
  language: string = 'uk'
): string => {
  const unlimitedLabels = {
    uk: 'Необмежено',
    ru: 'Неограничено',
    pl: 'Nieograniczone', 
    en: 'Unlimited'
  };

  if (limitMode === 'unlimited' || !limitMode) {
    return unlimitedLabels[language as keyof typeof unlimitedLabels] || 'Unlimited';
  }

  if (limitMode === 'ranged' && maxPlayers) {
    return `${currentPlayers} / ${maxPlayers}`;
  }

  return unlimitedLabels[language as keyof typeof unlimitedLabels] || 'Unlimited';
};

export const formatDateTime = (
  dateTime: string | Date,
  language: string = 'uk',
  options: Intl.DateTimeFormatOptions = {}
): string => {
  const localeMap = {
    uk: 'uk-UA',
    ru: 'ru-RU', 
    pl: 'pl-PL',
    en: 'en-US'
  };

  const locale = localeMap[language as keyof typeof localeMap] || 'uk-UA';
  const date = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;

  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options
  }).format(date);
};