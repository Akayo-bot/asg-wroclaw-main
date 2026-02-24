import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { useI18n } from '@/contexts/I18nContext';
import { ArrowRight, Eye, User, CalendarDays } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tables } from '@/integrations/supabase/types';
import LoadingScreen from '@/components/LoadingScreen';

type Article = Tables<'articles'>;

type CategoryKey = 'news' | 'tactics' | 'equipment' | 'game_reports' | 'rules';

type AuthorProfile = { display_name: string | null; avatar_url: string | null };

const CATEGORY_STYLES: Record<CategoryKey, { dot: string; glow: string; text: string }> = {
    news:         { dot: '#EF4444', glow: '0 0 8px rgba(239,68,68,0.6)',   text: '#FCA5A5' },
    tactics:      { dot: '#A855F7', glow: '0 0 8px rgba(168,85,247,0.6)',  text: '#D8B4FE' },
    equipment:    { dot: '#0EA5E9', glow: '0 0 8px rgba(14,165,233,0.6)',  text: '#BAE6FD' },
    game_reports: { dot: '#10B981', glow: '0 0 8px rgba(16,185,129,0.6)',  text: '#A7F3D0' },
    rules:        { dot: '#F59E0B', glow: '0 0 8px rgba(245,158,11,0.6)', text: '#FDE047' },
};

const CATEGORY_LABELS: Record<string, Record<CategoryKey, string>> = {
    uk: { news: 'Новини', tactics: 'Тактика', equipment: 'Спорядження', game_reports: 'Звіти з ігор', rules: 'Правила' },
    ru: { news: 'Новости', tactics: 'Тактика', equipment: 'Снаряжение', game_reports: 'Отчёты с игр', rules: 'Правила' },
    pl: { news: 'Aktualności', tactics: 'Taktyka', equipment: 'Wyposażenie', game_reports: 'Raporty z gier', rules: 'Zasady' },
    en: { news: 'News', tactics: 'Tactics', equipment: 'Equipment', game_reports: 'Game Reports', rules: 'Rules' },
};

const ArticlesPage = () => {
    const { t, language } = useI18n();
    const { toast } = useToast();
    const [activeFilter, setActiveFilter] = useState('all');
    const [articles, setArticles] = useState<Article[]>([]);
    const [authors, setAuthors] = useState<Map<string, AuthorProfile>>(new Map());
    const [loading, setLoading] = useState(true);

    const getCategoryLabel = (category: string): string =>
        CATEGORY_LABELS[language]?.[category as CategoryKey] || category;

    const getCategoryStyle = (category: string) =>
        CATEGORY_STYLES[category as CategoryKey] || { dot: '#9CA3AF', glow: 'none', text: '#D1D5DB' };

    const filters = [
        { key: 'all', label: t('pages.articles.categories.all', 'Усі') },
        { key: 'news', label: getCategoryLabel('news') },
        { key: 'tactics', label: getCategoryLabel('tactics') },
        { key: 'equipment', label: getCategoryLabel('equipment') },
        { key: 'game_reports', label: getCategoryLabel('game_reports') },
        { key: 'rules', label: getCategoryLabel('rules') },
    ];

    useEffect(() => {
        fetchArticles();
    }, [activeFilter]);

    const fetchArticles = async () => {
        try {
            setLoading(true);

            let query = supabase
                .from('articles')
                .select('*')
                .eq('status', 'published');

            if (activeFilter !== 'all') {
                query = query.eq('category', activeFilter as any);
            }

            query = query.order('created_at', { ascending: false });

            const { data, error } = await query;
            if (error) throw error;

            const fetched = data || [];
            setArticles(fetched);

            const authorIds = [...new Set(fetched.map(a => a.author_id))];
            if (authorIds.length > 0) {
                const { data: profiles } = await supabase
                    .from('profiles')
                    .select('id, display_name, avatar_url')
                    .in('id', authorIds);
                const map = new Map<string, AuthorProfile>();
                profiles?.forEach(p => map.set(p.id, p));
                setAuthors(map);
            }
        } catch (error) {
            console.error('Error fetching articles:', error);
            toast({
                title: t('common.error', 'Error'),
                description: t('pages.articles.errorLoading', 'Failed to load articles'),
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const getTitle = (article: Article): string => {
        const titles: Record<string, string | null> = {
            uk: article.title_uk,
            ru: article.title_ru,
            pl: article.title_pl,
            en: article.title_en,
        };
        return titles[language] || article.title_uk || 'Untitled';
    };

    const getPreview = (article: Article): string => {
        const previews: Record<string, string | null> = {
            uk: article.preview_uk,
            ru: article.preview_ru,
            pl: article.preview_pl,
            en: article.preview_en,
        };
        return previews[language] || article.preview_uk || '';
    };

    const getAuthorName = (authorId: string): string => {
        const profile = authors.get(authorId);
        return profile?.display_name || t('common.unknown_author', 'Автор');
    };

    const formatDate = (dateStr: string): string => {
        const localeMap: Record<string, string> = { uk: 'uk-UA', ru: 'ru-RU', pl: 'pl-PL', en: 'en-US' };
        return new Date(dateStr).toLocaleDateString(localeMap[language] || 'uk-UA', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    if (loading) {
        return <LoadingScreen label="SCANNING TARGETS…" size={140} />;
    }

    return (
        <Layout>
            <div className="min-h-screen py-12 md:py-16">
                <div className="container mx-auto px-4 lg:px-8 max-w-6xl">

                    {/* Header */}
                    <div className="text-center mb-10">
                        <h1 className="font-rajdhani text-5xl md:text-6xl font-bold text-white mb-4">
                            {t('pages.articles.title', 'Статті')}
                        </h1>
                        <p className="text-lg text-gray-400 max-w-xl mx-auto">
                            {t('pages.articles.subtitle', 'Гайди, тактики та новини')}
                        </p>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-wrap gap-2 mb-10 justify-center">
                        {filters.map((filter) => {
                            const isActive = activeFilter === filter.key;
                            const filterStyle = filter.key === 'all' ? null : getCategoryStyle(filter.key);
                            return (
                                <button
                                    key={filter.key}
                                    onClick={() => setActiveFilter(filter.key)}
                                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all duration-200 cursor-target ${
                                        isActive
                                            ? 'border-[#46D6C8]/50 text-[#46D6C8] bg-[#46D6C8]/5'
                                            : 'border-white/10 text-gray-400 bg-white/[0.03] hover:bg-white/[0.06] hover:text-gray-300'
                                    }`}
                                    aria-label={filter.label}
                                    tabIndex={0}
                                >
                                    {filterStyle ? (
                                        <span
                                            className="w-2 h-2 rounded-full shrink-0"
                                            style={{ backgroundColor: filterStyle.dot, boxShadow: filterStyle.glow }}
                                        />
                                    ) : filter.key === 'all' ? (
                                        <span
                                            className="w-2 h-2 rounded-full shrink-0"
                                            style={{ backgroundColor: '#46D6C8', boxShadow: '0 0 8px rgba(70,214,200,0.5)' }}
                                        />
                                    ) : null}
                                    {filter.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Articles Grid */}
                    {articles.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {articles.map((article) => {
                                const title = getTitle(article);
                                const preview = getPreview(article);
                                const catStyle = getCategoryStyle(article.category);
                                const authorName = getAuthorName(article.author_id);

                                return (
                                    <article
                                        key={article.id}
                                        className="group bg-[#0d1117] border border-white/[0.06] rounded-xl overflow-hidden transition-all duration-300 hover:border-white/[0.12] hover:shadow-[0_4px_40px_rgba(0,0,0,0.5)] flex flex-col"
                                    >
                                        {/* Cover */}
                                        <Link
                                            to={`/article/${article.id}`}
                                            className="block aspect-video relative overflow-hidden"
                                            tabIndex={-1}
                                            aria-hidden="true"
                                        >
                                            <img
                                                src={article.main_image_url || '/placeholder-article.jpg'}
                                                alt={title}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                loading="lazy"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-[#0d1117]/60 via-transparent to-transparent" />
                                            <div className="absolute top-3 left-3">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-black/[0.85] backdrop-blur-sm border border-white/[0.08]">
                                                    <span
                                                        className="w-1.5 h-1.5 rounded-full shrink-0"
                                                        style={{ backgroundColor: catStyle.dot, boxShadow: catStyle.glow }}
                                                    />
                                                    <span style={{ color: catStyle.text }}>{getCategoryLabel(article.category)}</span>
                                                </span>
                                            </div>
                                        </Link>

                                        {/* Content */}
                                        <div className="p-5 flex flex-col flex-1">
                                            <Link
                                                to={`/article/${article.id}`}
                                                tabIndex={0}
                                                aria-label={title}
                                            >
                                                <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2 group-hover:text-[#46D6C8] transition-colors duration-200">
                                                    {title}
                                                </h3>
                                            </Link>

                                            {preview && (
                                                <p className="text-sm text-gray-400 line-clamp-3 mb-4">{preview}</p>
                                            )}

                                            <div className="mt-auto">
                                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs mb-4">
                                                    <span className="inline-flex items-center gap-1.5 text-white font-medium truncate max-w-[140px]">
                                                        <User size={12} className="text-gray-500 shrink-0" aria-hidden="true" />
                                                        {authorName}
                                                    </span>
                                                    <span className="inline-flex items-center gap-1.5 text-[#9CA3AF]">
                                                        <CalendarDays size={12} className="text-gray-500 shrink-0" aria-hidden="true" />
                                                        {formatDate(article.created_at)}
                                                    </span>
                                                    <span className="inline-flex items-center gap-1.5 text-[#9CA3AF] leading-none">
                                                        <Eye size={12} className="text-gray-500 shrink-0" aria-hidden="true" />
                                                        {article.views_count || 0}
                                                    </span>
                                                </div>

                                                <Link
                                                    to={`/article/${article.id}`}
                                                    className="inline-flex items-center gap-1.5 text-sm text-[#46D6C8] hover:text-[#46D6C8]/80 transition-colors group/link"
                                                    tabIndex={0}
                                                    aria-label={`${t('pages.articles.readMore', 'Читати далі')} — ${title}`}
                                                >
                                                    {t('pages.articles.readMore', 'Читати далі')}
                                                    <ArrowRight
                                                        size={14}
                                                        className="transition-transform duration-200 group-hover/link:translate-x-1"
                                                    />
                                                </Link>
                                            </div>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <p className="text-gray-500 text-lg">
                                {t('pages.articles.empty', 'Статей поки немає')}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default ArticlesPage;
