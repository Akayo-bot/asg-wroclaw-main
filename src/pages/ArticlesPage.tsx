import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { useI18n } from '@/contexts/I18nContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, Clock, User, Filter, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tables } from '@/integrations/supabase/types';
import LoadingScreen from '@/components/LoadingScreen';

type Article = Tables<'articles'>;

const ArticlesPage = () => {
    const { t, language } = useI18n();
    const { toast } = useToast();
    const [activeFilter, setActiveFilter] = useState('all');
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);

    const filters = [
        { key: 'all', label: t('pages.articles.categories.all', 'All') },
        { key: 'tactics', label: t('pages.articles.categories.tactics', 'Tactics') },
        { key: 'equipment', label: t('pages.articles.categories.equipment', 'Equipment') },
        { key: 'news', label: t('pages.articles.categories.news', 'News') },
        { key: 'guides', label: t('pages.articles.categories.guides', 'Guides') },
    ];

    useEffect(() => {
        fetchArticles();
    }, [activeFilter]);

    const fetchArticles = async () => {
        try {
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

            setArticles(data || []);
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

    const getTitle = (article: Article) => {
        const titles = {
            uk: article.title_uk,
            ru: article.title_ru,
            pl: article.title_pl,
            en: article.title_en,
        };
        return titles[language] || article.title_uk || 'Untitled';
    };

    const getPreview = (article: Article) => {
        const previews = {
            uk: article.preview_uk,
            ru: article.preview_ru,
            pl: article.preview_pl,
            en: article.preview_en,
        };
        return previews[language] || article.preview_uk || '';
    };

    const getCategoryLabel = (category: string) => {
        const categoryLabels = {
            uk: {
                tactics: 'Тактика',
                equipment: 'Спорядження',
                news: 'Новини',
                guides: 'Гайди'
            },
            ru: {
                tactics: 'Тактика',
                equipment: 'Снаряжение',
                news: 'Новости',
                guides: 'Гайды'
            },
            pl: {
                tactics: 'Taktyka',
                equipment: 'Wyposażenie',
                news: 'Aktualności',
                guides: 'Przewodniki'
            },
            en: {
                tactics: 'Tactics',
                equipment: 'Equipment',
                news: 'News',
                guides: 'Guides'
            }
        };
        return categoryLabels[language]?.[category as keyof typeof categoryLabels.en] || category;
    };

    const featuredArticles = articles.slice(0, 2); // First 2 as featured
    const regularArticles = articles.slice(2);

    const getCategoryColor = (category: string) => {
        const colors = {
            tactics: 'bg-blue-500/10 text-blue-500',
            equipment: 'bg-green-500/10 text-green-500',
            news: 'bg-red-500/10 text-red-500',
            guides: 'bg-purple-500/10 text-purple-500'
        };
        return colors[category as keyof typeof colors] || 'bg-gray-500/10 text-gray-500';
    };

    if (loading) {
        return <LoadingScreen label="SCANNING TARGETS…" size={140} />;
    }

    return (
        <Layout showBreadcrumbs>
            <div className="min-h-screen py-12">
                <div className="container mx-auto px-4 lg:px-8">
                    {/* Header */}
                    <div className="text-center mb-12">
                        <h1 className="font-rajdhani text-4xl md:text-5xl font-bold mb-4">
                            {t('pages.articles.title', 'Articles')}
                        </h1>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            {t('pages.articles.subtitle', 'Guides, tactics, and news')}
                        </p>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-wrap gap-2 mb-8 justify-center">
                        <Filter className="w-5 h-5 text-muted-foreground mr-2" />
                        {filters.map((filter) => (
                            <Button
                                key={filter.key}
                                variant={activeFilter === filter.key ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setActiveFilter(filter.key)}
                                className="cursor-target"
                            >
                                {filter.label}
                            </Button>
                        ))}
                    </div>

                    {/* Featured Articles */}
                    {featuredArticles.length > 0 && (
                        <div className="mb-12">
                            <h2 className="font-rajdhani text-2xl font-bold mb-6 text-primary">
                                {t('pages.articles.featured', 'Featured Articles')}
                            </h2>
                            <div className="grid md:grid-cols-2 gap-6">
                                {featuredArticles.map((article) => (
                                    <Card key={article.id} className="glass-panel tactical-lift cursor-target">
                                        <div className="aspect-video relative overflow-hidden rounded-t-lg">
                                            <img
                                                src={article.main_image_url || '/placeholder-article.jpg'}
                                                alt={getTitle(article)}
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute top-4 left-4">
                                                <Badge className={getCategoryColor(article.category)}>
                                                    {getCategoryLabel(article.category)}
                                                </Badge>
                                            </div>
                                        </div>
                                        <CardHeader>
                                            <CardTitle className="font-rajdhani text-xl">
                                                <Link
                                                    to={`/article/${article.id}`}
                                                    className="hover:text-primary transition-colors"
                                                >
                                                    {getTitle(article)}
                                                </Link>
                                            </CardTitle>
                                            <p className="text-muted-foreground text-sm">
                                                {getPreview(article)}
                                            </p>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="w-6 h-6">
                                                        <AvatarFallback className="text-xs">
                                                            A
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="text-sm text-muted-foreground">
                                                        {t('admin.common.author', 'Author')}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        {new Date(article.created_at).toLocaleDateString()}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {article.views_count || 0} {t('admin.common.views', 'views')}
                                                    </div>
                                                </div>
                                            </div>
                                            <Link
                                                to={`/article/${article.id}`}
                                                className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
                                            >
                                                {t('admin.common.readMore', 'Read More')}
                                                <ArrowRight className="w-4 h-4" />
                                            </Link>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Regular Articles */}
                    {regularArticles.length > 0 && (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                            {regularArticles.map((article) => (
                                <Card key={article.id} className="glass-panel tactical-lift cursor-target">
                                    <div className="aspect-video relative overflow-hidden rounded-t-lg">
                                        <img
                                            src={article.main_image_url || '/placeholder-article.jpg'}
                                            alt={getTitle(article)}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute top-4 left-4">
                                            <Badge className={getCategoryColor(article.category)}>
                                                {getCategoryLabel(article.category)}
                                            </Badge>
                                        </div>
                                    </div>
                                    <CardHeader>
                                        <CardTitle className="font-rajdhani text-lg">
                                            <Link
                                                to={`/article/${article.id}`}
                                                className="hover:text-primary transition-colors line-clamp-2"
                                            >
                                                {getTitle(article)}
                                            </Link>
                                        </CardTitle>
                                        <p className="text-muted-foreground text-sm line-clamp-3">
                                            {getPreview(article)}
                                        </p>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center gap-2 mb-3">
                                            <Avatar className="w-6 h-6">
                                                <AvatarFallback className="text-xs">
                                                    A
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="text-sm text-muted-foreground">
                                                {t('admin.common.author', 'Author')}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(article.created_at).toLocaleDateString()}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {article.views_count || 0} {t('admin.common.views', 'views')}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}

                    {/* Empty State */}
                    {articles.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground text-lg">
                                {t('admin.empty.noArticles', 'No articles available')}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default ArticlesPage;