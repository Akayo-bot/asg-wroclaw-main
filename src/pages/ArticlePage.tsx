import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { useI18n } from '@/contexts/I18nContext';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import LoadingScreen from '@/components/LoadingScreen';
import { ArrowLeft, Eye, User, CalendarDays } from 'lucide-react';

type Article = Tables<'articles'>;

type CategoryKey = 'news' | 'tactics' | 'equipment' | 'game_reports' | 'rules';

const CATEGORY_DOT: Record<CategoryKey, { color: string; glow: string; text: string }> = {
    news:         { color: '#EF4444', glow: '0 0 8px rgba(239,68,68,0.6)',   text: '#FCA5A5' },
    tactics:      { color: '#A855F7', glow: '0 0 8px rgba(168,85,247,0.6)',  text: '#D8B4FE' },
    equipment:    { color: '#0EA5E9', glow: '0 0 8px rgba(14,165,233,0.6)',  text: '#BAE6FD' },
    game_reports: { color: '#10B981', glow: '0 0 8px rgba(16,185,129,0.6)',  text: '#A7F3D0' },
    rules:        { color: '#F59E0B', glow: '0 0 8px rgba(245,158,11,0.6)', text: '#FDE047' },
};

const CATEGORY_LABELS: Record<string, Record<CategoryKey, string>> = {
    uk: { news: 'Новини', tactics: 'Тактика', equipment: 'Спорядження', game_reports: 'Звіти з ігор', rules: 'Правила' },
    ru: { news: 'Новости', tactics: 'Тактика', equipment: 'Снаряжение', game_reports: 'Отчёты с игр', rules: 'Правила' },
    pl: { news: 'Aktualności', tactics: 'Taktyka', equipment: 'Wyposażenie', game_reports: 'Raporty z gier', rules: 'Zasady' },
    en: { news: 'News', tactics: 'Tactics', equipment: 'Equipment', game_reports: 'Game Reports', rules: 'Rules' },
};

const ArticlePage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { t, language } = useI18n();
    const viewIncremented = useRef(false);

    const [article, setArticle] = useState<Article | null>(null);
    const [authorName, setAuthorName] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        viewIncremented.current = false;
        fetchArticle(id);
    }, [id]);

    const fetchArticle = async (articleId: string) => {
        try {
            setLoading(true);

            const { data, error } = await supabase
                .from('articles')
                .select('*')
                .eq('id', articleId)
                .eq('status', 'published')
                .single();

            if (error || !data) {
                navigate('/articles', { replace: true });
                return;
            }

            setArticle(data);

            if (!viewIncremented.current) {
                viewIncremented.current = true;
                await supabase
                    .from('articles')
                    .update({ views_count: (data.views_count || 0) + 1 })
                    .eq('id', articleId);
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('display_name')
                .eq('id', data.author_id)
                .single();

            setAuthorName(profile?.display_name || t('common.unknown_author', 'Автор'));
        } catch (err) {
            console.error('Error fetching article:', err);
            navigate('/articles', { replace: true });
        } finally {
            setLoading(false);
        }
    };

    const getTitle = (a: Article): string => {
        const map: Record<string, string | null> = {
            uk: a.title_uk, ru: a.title_ru, pl: a.title_pl, en: a.title_en,
        };
        return map[language] || a.title_uk || 'Untitled';
    };

    const getContent = (a: Article): string => {
        const map: Record<string, string | null> = {
            uk: a.content_uk, ru: a.content_ru, pl: a.content_pl, en: a.content_en,
        };
        return map[language] || a.content_uk || '';
    };

    const getCategoryLabel = (category: string): string =>
        CATEGORY_LABELS[language]?.[category as CategoryKey] || category;

    const getDotStyle = (category: string) =>
        CATEGORY_DOT[category as CategoryKey] || { color: '#9CA3AF', glow: 'none', text: '#D1D5DB' };

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

    if (!article) return null;

    const title = getTitle(article);
    const content = getContent(article);
    const displayViews = (article.views_count || 0) + 1;

    return (
        <Layout>
            <div className="min-h-screen py-8 md:py-14">
                <div className="mx-auto max-w-[800px] px-5 sm:px-6">

                    {/* Back */}
                    <Link
                        to="/articles"
                        className="inline-flex items-center gap-2 text-[#46D6C8] hover:text-[#46D6C8]/80 transition-colors mb-10 text-sm font-medium group cursor-target"
                        tabIndex={0}
                        aria-label={t('pages.article.back', 'Назад до статей')}
                    >
                        <ArrowLeft size={16} className="transition-transform duration-200 group-hover:-translate-x-1" />
                        {t('pages.article.back', 'Назад до статей')}
                    </Link>

                    {/* Hero Image */}
                    {article.main_image_url && (
                        <div className="rounded-xl overflow-hidden mb-8 aspect-[21/9]">
                            <img
                                src={article.main_image_url}
                                alt={title}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}

                    {/* Title */}
                    <h1 className="font-rajdhani text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-5 leading-tight">
                        {title}
                    </h1>

                    {/* Metadata */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm mb-10 pb-8 border-b border-white/[0.06]">
                        <span className="inline-flex items-center gap-1.5">
                            <span
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: getDotStyle(article.category).color, boxShadow: getDotStyle(article.category).glow }}
                            />
                            <span style={{ color: getDotStyle(article.category).text }}>
                                {getCategoryLabel(article.category)}
                            </span>
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-white font-medium">
                            <User size={14} className="text-gray-500 shrink-0" aria-hidden="true" />
                            {authorName}
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-[#9CA3AF]">
                            <CalendarDays size={14} className="text-gray-500 shrink-0" aria-hidden="true" />
                            {formatDate(article.created_at)}
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-[#9CA3AF] leading-none">
                            <Eye size={14} className="text-gray-500 shrink-0" aria-hidden="true" />
                            {displayViews} {t('pages.article.views', 'переглядів')}
                        </span>
                    </div>

                    {/* Article Content */}
                    <div
                        className="article-content"
                        dangerouslySetInnerHTML={{ __html: content }}
                    />
                </div>
            </div>
        </Layout>
    );
};

export default ArticlePage;
