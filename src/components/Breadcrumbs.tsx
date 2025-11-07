import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';

export const Breadcrumbs = () => {
    const location = useLocation();
    const { t } = useI18n();

    const pathnames = location.pathname.split('/').filter(x => x);

    if (pathnames.length === 0) return null;

    const getBreadcrumbName = (segment: string, index: number) => {
        // Map path segments to translated names
        const pathMap: Record<string, string> = {
            games: t('nav.games', 'Games'),
            team: t('nav.team', 'Team'),
            gallery: t('nav.gallery', 'Gallery'),
            articles: t('nav.articles', 'Articles'),
            contacts: t('nav.contacts', 'Contacts'),
            about: t('nav.about', 'About'),
            search: t('nav.search', 'Search'),
            subscribe: t('nav.subscribe', 'Subscribe'),
            event: t('common.event', 'Event'),
            article: t('common.article', 'Article'),
            category: t('common.category', 'Category'),
            test: t('common.test', 'Test')
        };

        return pathMap[segment] || segment;
    };

    return (
        <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Link
                to="/"
                className="flex items-center hover:text-primary transition-colors cursor-target"
            >
                <Home className="w-4 h-4" />
                <span className="ml-1">{t('common.home', 'Home')}</span>
            </Link>

            {pathnames.map((segment, index) => {
                const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
                const isLast = index === pathnames.length - 1;

                return (
                    <div key={routeTo} className="flex items-center">
                        <ChevronRight className="w-4 h-4 mx-2" />
                        {isLast ? (
                            <span className="text-foreground font-medium">
                                {getBreadcrumbName(segment, index)}
                            </span>
                        ) : (
                            <Link
                                to={routeTo}
                                className="hover:text-primary transition-colors cursor-target"
                            >
                                {getBreadcrumbName(segment, index)}
                            </Link>
                        )}
                    </div>
                );
            })}
        </nav>
    );
};