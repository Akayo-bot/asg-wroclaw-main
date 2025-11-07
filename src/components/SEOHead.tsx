import { useEffect } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { useBranding } from '@/contexts/BrandingContext';
import { useLocation } from 'react-router-dom';

interface SEOHeadProps {
    title?: string;
    description?: string;
    image?: string;
    type?: string;
}

export const SEOHead = ({ title, description, image, type = 'website' }: SEOHeadProps) => {
    const { t, language } = useI18n();
    const { settings } = useBranding();
    const location = useLocation();

    useEffect(() => {
        if (!settings) return;

        const siteName = settings.site_name;
        const siteTagline = t('brand.tagline', settings.tagline_base || 'Airsoft is more than a game');

        const finalTitle = title ? `${title} | ${siteName}` : `${siteName} | ${siteTagline}`;
        const finalDescription = description || siteTagline;
        const finalImage = image || settings.og_image_url || '/og-image.png';

        // Update document title and language
        document.title = finalTitle;
        document.documentElement.lang = language;

        // Update meta tags
        const updateMeta = (name: string, content: string) => {
            let meta = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`) as HTMLMetaElement;
            if (!meta) {
                meta = document.createElement('meta');
                if (name.startsWith('og:') || name.startsWith('twitter:')) {
                    meta.setAttribute('property', name);
                } else {
                    meta.setAttribute('name', name);
                }
                document.head.appendChild(meta);
            }
            meta.setAttribute('content', content);
        };

        updateMeta('description', finalDescription);
        updateMeta('og:title', finalTitle);
        updateMeta('og:description', finalDescription);
        updateMeta('og:type', type);
        updateMeta('og:image', finalImage);
        updateMeta('og:url', `${window.location.origin}${location.pathname}`);
        updateMeta('twitter:card', 'summary_large_image');
        updateMeta('twitter:image', finalImage);
        updateMeta('twitter:title', finalTitle);
        updateMeta('twitter:description', finalDescription);

        // Update canonical link
        let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
        if (!canonical) {
            canonical = document.createElement('link');
            canonical.rel = 'canonical';
            document.head.appendChild(canonical);
        }
        canonical.href = `${window.location.origin}${location.pathname}`;

    }, [title, description, image, type, settings, language, location.pathname, t]);

    return null;
};