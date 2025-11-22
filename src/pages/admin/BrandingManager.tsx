import { useState, FormEvent, useEffect } from 'react';
import LoadingScreen from '@/components/LoadingScreen';
import { useToast } from '@/hooks/use-toast';
import { useBranding } from '@/contexts/BrandingContext';
import { useI18n } from '@/contexts/I18nContext';
import { useAuth } from '@/contexts/AuthContext';
import { Palette, Image as ImageIcon, Globe, Type, AlertTriangle, Shield } from 'lucide-react';
import ImageUploader from '@/components/admin/ImageUploader';
import CustomLangSelect from '@/components/admin/CustomLangSelect';

// Компонент Card в киберпанк-стиле
const Card = ({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) => (
    <div className="rounded-xl p-6 border border-[#46D6C8]/20 bg-black/80 backdrop-blur-sm shadow-[0_0_20px_rgba(70,214,200,0.1)]">
        <h3 className="text-xl font-semibold text-white mb-1">{title}</h3>
        <p className="text-sm text-gray-400 mb-6">{subtitle}</p>
        <div className="space-y-4">
            {children}
        </div>
    </div>
);

const BrandingManager = () => {
    const { settings, updateSettings, loading } = useBranding();
    const { t } = useI18n();
    const { toast } = useToast();
    const { profile } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Проверка доступа: только superadmin может управлять брендингом
    const isSuperAdmin = profile?.role?.toLowerCase() === 'superadmin';
    
    // Локальное состояние для изображений
    const [logoUrl, setLogoUrl] = useState(settings?.logo_url || '');
    const [faviconUrl, setFaviconUrl] = useState(settings?.favicon_url || '');
    const [ogImageUrl, setOgImageUrl] = useState(settings?.og_image_url || '');
    
    // Локальное состояние для слоганов
    const [taglineUK, setTaglineUK] = useState(settings?.tagline_base || '');
    const [taglineEN, setTaglineEN] = useState('');
    const [taglinePL, setTaglinePL] = useState('');
    
    // Локальное состояние для языка
    const [defaultLanguage, setDefaultLanguage] = useState(settings?.default_language || 'uk');
    
    // Обновляем локальное состояние при изменении settings (только при первой загрузке или при изменении извне)
    useEffect(() => {
        if (settings) {
            console.log('[BrandingManager] Settings changed, updating local state:', settings);
            console.log('[BrandingManager] Current defaultLanguage state:', defaultLanguage);
            console.log('[BrandingManager] Settings default_language:', settings.default_language);
            
            // Обновляем только если значение отличается от текущего локального состояния
            // Это предотвращает перезапись после сохранения
            if (settings.default_language && settings.default_language !== defaultLanguage) {
                console.log('[BrandingManager] Updating defaultLanguage from settings');
                setDefaultLanguage(settings.default_language);
            }
            
            setLogoUrl(settings.logo_url || '');
            setFaviconUrl(settings.favicon_url || '');
            setOgImageUrl(settings.og_image_url || '');
            setTaglineUK(settings.tagline_base || '');
        }
    }, [settings?.id, settings?.default_language]); // Обновляем только при изменении id или default_language

    const handleSave = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!settings) return;

        setIsSubmitting(true);
        try {
            const formData = new FormData(e.currentTarget);
            const updates = {
                site_name: formData.get('site_name') as string,
                tagline_base: taglineUK, // Используем украинский как базовый
                logo_url: logoUrl,
                favicon_url: faviconUrl,
                og_image_url: ogImageUrl,
                // Кольори бренду змінюються через CSS-змінні, не через UI
                primary_color: settings.primary_color,
                accent_color: settings.accent_color,
                default_language: defaultLanguage, // Используем локальное состояние
            };

            console.log('[BrandingManager] Saving updates:', updates);
            console.log('[BrandingManager] Current defaultLanguage:', defaultLanguage);
            console.log('[BrandingManager] User role:', profile?.role);
            console.log('[BrandingManager] Is superadmin:', isSuperAdmin);
            
            await updateSettings(updates);
            
            console.log('[BrandingManager] Settings updated successfully');
            console.log('[BrandingManager] Updated defaultLanguage:', updates.default_language);
            
            // Обновляем локальное состояние после успешного сохранения
            // Это гарантирует, что значения синхронизированы с базой данных
            setDefaultLanguage(updates.default_language || defaultLanguage);

            toast({
                title: t('common.success', 'Успіх'),
                description: t('admin.branding.saved', 'Налаштування брендингу збережено успішно'),
            });
        } catch (error) {
            console.error('Error saving branding settings:', error);
            toast({
                title: t('common.error', 'Помилка'),
                description: t('admin.branding.error', 'Не вдалося зберегти налаштування брендингу'),
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading || !settings) {
        return <LoadingScreen label="SCANNING TARGETS…" size={140} />;
    }

    // Показываем сообщение о недостаточных правах для не-superadmin пользователей
    if (!isSuperAdmin) {
        return (
            <div className="p-8">
                <div className="rounded-xl p-8 border border-red-500/20 bg-black/80 backdrop-blur-sm shadow-[0_0_20px_rgba(255,0,0,0.1)] text-center">
                    <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-semibold text-white mb-2">Доступ заборонено</h2>
                    <p className="text-gray-400 mb-4">
                        Управління брендингом доступне тільки для користувачів з роллю <span className="text-[#46D6C8] font-semibold">SuperAdmin</span>.
                    </p>
                    <p className="text-sm text-gray-500">
                        Ваша поточна роль: <span className="text-white font-semibold">{profile?.role || 'Невідома'}</span>
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8">
            <h1 className="font-display text-3xl text-white mb-2">Управління брендом</h1>
            <p className="text-gray-400 mb-8">
                Налаштування брендингу та зовнішнього вигляду сайту.
            </p>

            <form onSubmit={handleSave} className="flex flex-col gap-8">
                {/* КАРТКА 1: ОСНОВНА ІНФОРМАЦІЯ */}
                <Card 
                    title="Основна інформація" 
                    subtitle="Назва сайту та базовий слоган"
                >
                    <div>
                        <label htmlFor="site_name" className="text-sm font-medium text-white/80 mb-2 block">
                            Назва сайту
                        </label>
                        <input
                            id="site_name"
                            name="site_name"
                            type="text"
                            defaultValue={settings.site_name}
                            placeholder="Raven Strike Force"
                            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:border-[#46D6C8]/50 focus:ring-1 focus:ring-[#46D6C8]/50 transition-all"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            💡 <strong>Використовується:</strong> Відображається у шапці сайту, на вкладці браузера та у мета-даних.
                        </p>
                    </div>

                    <div>
                        <label htmlFor="tagline_uk" className="text-sm font-medium text-white/80 mb-2 block">
                            Базовий слоган (UKR)
                        </label>
                        <textarea
                            id="tagline_uk"
                            name="tagline_uk"
                            value={taglineUK}
                            onChange={(e) => setTaglineUK(e.target.value)}
                            placeholder="Airsoft is more than a game"
                            rows={3}
                            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:border-[#46D6C8]/50 focus:ring-1 focus:ring-[#46D6C8]/50 transition-all resize-none"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            💡 <strong>Використовується:</strong> Відображається на головній сторінці під назвою сайту.
                        </p>
                    </div>

                    <div>
                        <label htmlFor="tagline_en" className="text-sm font-medium text-white/80 mb-2 block">
                            Базовий слоган (ENG)
                        </label>
                        <textarea
                            id="tagline_en"
                            name="tagline_en"
                            value={taglineEN}
                            onChange={(e) => setTaglineEN(e.target.value)}
                            placeholder="Airsoft is more than a game"
                            rows={3}
                            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:border-[#46D6C8]/50 focus:ring-1 focus:ring-[#46D6C8]/50 transition-all resize-none"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            💡 <strong>Використовується:</strong> Відображається на головній сторінці для англомовних користувачів.
                        </p>
                    </div>

                    <div>
                        <label htmlFor="tagline_pl" className="text-sm font-medium text-white/80 mb-2 block">
                            Базовий слоган (PL)
                        </label>
                        <textarea
                            id="tagline_pl"
                            name="tagline_pl"
                            value={taglinePL}
                            onChange={(e) => setTaglinePL(e.target.value)}
                            placeholder="Airsoft to więcej niż gra"
                            rows={3}
                            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:border-[#46D6C8]/50 focus:ring-1 focus:ring-[#46D6C8]/50 transition-all resize-none"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            💡 <strong>Використовується:</strong> Відображається на головній сторінці для польськомовних користувачів.
                        </p>
                    </div>
                </Card>

                {/* КАРТКА 2: ВІЗУАЛЬНІ РЕСУРСИ */}
                <Card 
                    title="Візуальні ресурси" 
                    subtitle="Логотипи, фавікон та зображення для соцмереж"
                >
                    <div>
                        <ImageUploader
                            label="Логотип (Світлий)"
                            currentUrl={logoUrl}
                            onUpload={setLogoUrl}
                            bucket="media"
                            folder="branding/logos"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            💡 <strong>Використовується:</strong> У шапці сайту на світлому фоні або у футері.
                        </p>
                    </div>

                    <div>
                        <ImageUploader
                            label="Фавікон"
                            currentUrl={faviconUrl}
                            onUpload={setFaviconUrl}
                            bucket="media"
                            folder="branding/favicons"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            💡 <strong>Використовується:</strong> Іконка у вкладці браузера (16x16px або 32x32px).
                        </p>
                    </div>

                    <div>
                        <ImageUploader
                            label="Зображення для соцмереж (OG Image)"
                            currentUrl={ogImageUrl}
                            onUpload={setOgImageUrl}
                            bucket="media"
                            folder="branding/social"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            💡 <strong>Використовується:</strong> Показується, коли посиланням діляться у Telegram, Facebook, X (Twitter).
                        </p>
                    </div>
                </Card>

                {/* КАРТКА 3: КОЛЬОРИ БРЕНДУ - Приховано для захисту даних */}
                {/* Кольори бренду змінюються через CSS-змінні, не через UI */}

                {/* КАРТКА 4: НАЛАШТУВАННЯ */}
                <Card 
                    title="Налаштування" 
                    subtitle="Глобальні налаштування сайту"
                >
                    <div>
                        <CustomLangSelect
                            value={defaultLanguage}
                            onChange={(value) => {
                                setDefaultLanguage(value);
                            }}
                            label="Мова за замовчуванням"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            💡 <strong>Використовується:</strong> Мова, яка відображається для нових користувачів за замовчуванням.
                        </p>
                    </div>
                </Card>

                {/* КНОПКА ЗБЕРЕЖЕННЯ */}
                <div className="mt-4 text-center">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-8 py-3 rounded-lg text-lg font-semibold bg-[#46D6C8] text-black shadow-[0_0_20px_rgba(70,214,200,0.6)] transition-all duration-200 hover:opacity-90 hover:shadow-[0_0_30px_rgba(70,214,200,0.8)] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? t('common.loading', 'Завантаження...') : t('common.save', 'Зберегти')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default BrandingManager;
