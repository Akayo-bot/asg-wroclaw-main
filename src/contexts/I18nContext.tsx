import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language } from '@/types/i18n';
import { supabase } from '@/integrations/supabase/client';

interface I18nContextType {
    language: Language;
    setLanguage: (language: Language) => void;
    t: (key: string, fallback?: string) => string;
    loading: boolean;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const STORAGE_KEY = 'raven-strike-language';

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setCurrentLanguage] = useState<Language>('uk');
    const [strings, setStrings] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(true);

    // Determine initial language from localStorage
    useEffect(() => {
        let initialLanguage: Language = 'uk';

        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored && ['uk', 'ru', 'pl', 'en'].includes(stored)) {
            initialLanguage = stored as Language;
        }

        setCurrentLanguage(initialLanguage);
        document.documentElement.lang = initialLanguage;
    }, []);

    // Fetch UI strings from database
    const fetchUIStrings = async () => {
        try {
            const { data, error } = await supabase
                .from('ui_strings')
                .select('*');

            if (error) {
                console.warn('Error fetching UI strings:', error);
                // Set default strings if table doesn't exist
                setStrings({
                    'nav.games': { uk: 'Ігри', ru: 'Игры', pl: 'Gry', en: 'Games' },
                    'nav.team': { uk: 'Команда', ru: 'Команда', pl: 'Zespół', en: 'Team' },
                    'nav.gallery': { uk: 'Галерея', ru: 'Галерея', pl: 'Galeria', en: 'Gallery' },
                    'nav.articles': { uk: 'Статті', ru: 'Статьи', pl: 'Artykuły', en: 'Articles' },
                    'nav.contacts': { uk: 'Контакти', ru: 'Контакты', pl: 'Kontakt', en: 'Contacts' },
                    'brand.tagline': { uk: 'Страйкбол - це більше ніж гра', ru: 'Страйкбол - это больше чем игра', pl: 'Airsoft to więcej niż gra', en: 'Airsoft is more than a game' }
                });
            } else {
                const stringMap: Record<string, any> = {};
                data?.forEach((item) => {
                    stringMap[item.key] = {
                        uk: item.text_uk,
                        ru: item.text_ru,
                        pl: item.text_pl,
                        en: item.text_en,
                    };
                });
                setStrings(stringMap);
            }
        } catch (error) {
            console.warn('Error fetching UI strings:', error);
            // Set default strings on error
            setStrings({
                'nav.games': { uk: 'Ігри', ru: 'Игры', pl: 'Gry', en: 'Games' },
                'nav.team': { uk: 'Команда', ru: 'Команда', pl: 'Zespół', en: 'Team' },
                'nav.gallery': { uk: 'Галерея', ru: 'Галерея', pl: 'Galeria', en: 'Gallery' },
                'nav.articles': { uk: 'Статті', ru: 'Статьи', pl: 'Artykuły', en: 'Articles' },
                'nav.contacts': { uk: 'Контакти', ru: 'Контакты', pl: 'Kontakt', en: 'Contacts' },
                'brand.tagline': { uk: 'Страйкбол - це більше ніж гра', ru: 'Страйкбол - это больше чем игра', pl: 'Airsoft to więcej niż gra', en: 'Airsoft is more than a game' }
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUIStrings();
    }, []);

    const setLanguage = (newLanguage: Language) => {
        setCurrentLanguage(newLanguage);
        localStorage.setItem(STORAGE_KEY, newLanguage);
        document.documentElement.lang = newLanguage;
    };

    const t = (key: string, fallback?: string): string => {
        const stringEntry = strings[key];
        if (stringEntry && stringEntry[language]) {
            return stringEntry[language];
        }

        // Fallback to English if current language not available
        if (stringEntry && stringEntry.en) {
            return stringEntry.en;
        }

        return fallback || key;
    };

    return (
        <I18nContext.Provider value={{ language, setLanguage, t, loading }}>
            {children}
        </I18nContext.Provider>
    );
};

export const useI18n = () => {
    const context = useContext(I18nContext);
    if (context === undefined) {
        throw new Error('useI18n must be used within an I18nProvider');
    }
    return context;
};