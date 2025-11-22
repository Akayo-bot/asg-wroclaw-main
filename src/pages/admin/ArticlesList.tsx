import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/contexts/I18nContext';
import { supabase } from '@/integrations/supabase/client';
import { Edit } from 'lucide-react';
import LoadingScreen from '@/components/LoadingScreen';
import { Tables } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';
import AdminShell from '@/components/admin/AdminShell';
import { SearchBarNeon } from '@/components/admin/SearchBarNeon';
import { StatusNeon, statusColors } from '@/components/admin/StatusNeon';
import { CategoryNeon, categoryColors } from '@/components/admin/CategoryNeon';
import { roleColors } from '@/components/admin/RolePill';
import { AnimatedDeleteButton } from '@/components/admin/AnimatedDeleteButton';

type Article = Tables<'articles'>;
type StatusOption = 'draft' | 'published' | 'scheduled';

const ArticlesList = () => {
    const { t, language } = useI18n();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<StatusOption | 'all'>('all');
    const [categoryFilter, setCategoryFilter] = useState<string | 'all'>('all');
    const [q, setQ] = useState('');

    useEffect(() => {
        fetchArticles();
    }, [statusFilter, categoryFilter]);

    const fetchArticles = async () => {
        try {
            let query = supabase
                .from('articles')
                .select('*, author:profiles!author_id(display_name, role, status)');

            if (statusFilter !== 'all') {
                query = query.eq('status', statusFilter as 'draft' | 'published');
            }

            if (categoryFilter !== 'all') {
                query = query.eq('category', categoryFilter as 'tactics' | 'equipment' | 'news' | 'game_reports' | 'rules');
            }

            query = query.order('created_at', { ascending: false });

            const { data, error } = await query;
            if (error) throw error;

            const visible = (data || []).filter((a: any) => a.author?.status !== 'hidden');
            setArticles(visible);
        } catch (error) {
            console.error('Error fetching articles:', error);
            toast({
                title: t('common.error', 'Error'),
                description: t('admin.errorFetchingArticles', 'Failed to fetch articles'),
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const deleteArticle = async (id: string) => {
        if (!confirm(t('admin.confirmDeleteArticle', 'Are you sure you want to delete this article?'))) return;

        try {
            const { error } = await supabase
                .from('articles')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setArticles(articles.filter(article => article.id !== id));
            toast({
                title: t('common.success', 'Success'),
                description: t('admin.articleDeleted', 'Article deleted successfully'),
            });
        } catch (error) {
            console.error('Error deleting article:', error);
            toast({
                title: t('common.error', 'Error'),
                description: t('admin.errorDeletingArticle', 'Failed to delete article'),
                variant: 'destructive',
            });
        }
    };

    const getTitle = (article: Article) => {
        return language === 'uk' ? article.title_uk :
            language === 'ru' ? article.title_ru :
                article.title_pl;
    };

    const getPreview = (article: Article) => {
        return language === 'uk' ? article.preview_uk :
            language === 'ru' ? article.preview_ru :
                article.preview_pl;
    };

    const categories = [
        { id: 'tactics', label: t('categories.tactics', 'Тактика') },
        { id: 'equipment', label: t('categories.equipment', 'Спорядження') },
        { id: 'news', label: t('categories.news', 'Новини') },
        { id: 'game_reports', label: t('categories.gameReports', 'Звіти з ігор') },
        { id: 'rules', label: t('categories.rules', 'Правила') },
    ];

    const filtered = useMemo(() => {
        const ql = q.trim().toLowerCase();
        return articles.filter(a => {
            const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
            const matchesCat = categoryFilter === 'all' || a.category === (categoryFilter as any);

            // Поиск по названию статьи или имени автора
            if (ql === '') {
                return matchesStatus && matchesCat;
            }

            const title = getTitle(a)?.toLowerCase() || '';
            const authorName = ((a as any).author?.display_name || '').toLowerCase();
            const matchesSearch = title.includes(ql) || authorName.includes(ql);

            return matchesStatus && matchesCat && matchesSearch;
        });
    }, [articles, statusFilter, categoryFilter, q]);

    if (loading) {
        return <LoadingScreen label="SCANNING TARGETS…" size={140} />;
    }

    return (
        <AdminShell>
            <section className="px-3 sm:px-4 lg:px-8 lg:translate-x-[-100px]">
                {/* Search */}
                <SearchBarNeon
                    value={q}
                    onChange={setQ}
                    onSubmit={() => {
                        // Search is handled by filtered useMemo
                    }}
                    placeholder={t('admin.searchPlaceholder', 'Пошук за заголовком або автором…')}
                />

                {/* Filters */}
                <div className="mx-auto max-w-3xl pb-3 sm:pb-4 mt-3 sm:mt-4">
                    {/* Mobile: Компактное расположение в 2 строки */}
                    <div className="lg:hidden space-y-2">
                        {/* Первая строка: Фильтры */}
                        <div className="grid grid-cols-2 gap-2">
                            <div className="min-w-0 w-full">
                                <StatusNeon value={statusFilter} onChange={(v) => setStatusFilter(v as any)} className="w-full" />
                            </div>
                            <div className="min-w-0 w-full">
                                <CategoryNeon
                                    value={categoryFilter}
                                    onChange={(v) => setCategoryFilter(v as any)}
                                    categories={categories}
                                />
                            </div>
                        </div>
                        {/* Вторая строка: Кнопка создания */}
                        <div className="flex justify-center mt-3">
                            <button
                                type="button"
                                onClick={() => navigate('/admin/articles/new')}
                                className="btn-glass-emerald text-sm sm:text-base px-5 sm:px-6 py-3 sm:py-3.5 hover:ring-2 hover:ring-[#46D6C8]/50 transition-all duration-200"
                            >
                                <span className="flex items-center justify-center gap-2">
                                    <span className="text-xl leading-none">+</span>
                                    <span>{t('admin.createArticle', 'Створити статтю')}</span>
                                </span>
                            </button>
                        </div>
                    </div>
                    {/* Desktop: Горизонтальное расположение */}
                    <div className="hidden lg:flex flex-wrap items-center justify-center gap-3">
                        <StatusNeon value={statusFilter} onChange={(v) => setStatusFilter(v as any)} />
                        <CategoryNeon
                            value={categoryFilter}
                            onChange={(v) => setCategoryFilter(v as any)}
                            categories={categories}
                        />
                        <button
                            type="button"
                            onClick={() => navigate('/admin/articles/new')}
                            className="btn-glass-emerald text-base px-4 py-2.5 hover:ring-2 hover:ring-[#46D6C8]/50 transition-all duration-200"
                        >
                            + {t('admin.createArticle', 'Створити статтю')}
                        </button>
                    </div>
                </div>

                {/* List / Empty */}
                <div className="mx-auto max-w-[1400px] py-4 sm:py-6 mt-4 sm:mt-6 relative">
                    {/* Мягкий radial-gradient под таблицу */}
                    <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(70,214,200,.08),transparent_70%)] opacity-50 rounded-2xl" />
                    {filtered.length === 0 ? (
                        <section className="glass-card relative rounded-2xl p-6 md:p-7">
                            {/* мягкое объемное свечение по периметру */}
                            <span className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(70%_70%_at_50%_0%,rgba(70,214,200,.12),transparent_60%)]" />

                            {/* внутренний контент */}
                            <h3 className="text-center text-slate-200 font-medium">{t('admin.noArticlesFound', 'Нічого не знайдено')}</h3>
                            <p className="text-center text-slate-400 mt-1">{t('admin.tryChangeFilters', 'Спробуйте змінити фільтри…')}</p>
                        </section>
                    ) : (
                        <>
                            {/* Счетчик найденных статей */}
                            <p className="text-xs sm:text-sm text-slate-400/80 mb-3 sm:mb-4 px-1">
                                {filtered.length === 1
                                    ? (
                                        <>
                                            {t('admin.foundOneArticle', 'Знайдено')} <span className="text-[#46D6C8] font-semibold">1</span> {t('admin.article', 'стаття')}
                                        </>
                                    )
                                    : (
                                        <>
                                            {t('admin.foundArticles', 'Знайдено')} <span className="text-[#46D6C8] font-semibold">{filtered.length}</span> {t('admin.articles', 'статей')}
                                        </>
                                    )
                                }
                            </p>
                            {/* Desktop Table */}
                            <div className="hidden lg:block overflow-x-auto rounded-xl border border-[#46D6C8]/20 bg-[#04070A]/80 backdrop-blur-sm relative">
                                <table className="min-w-[900px] w-full">
                                    <thead className="text-left text-sm text-neutral-400 border-b border-[#46D6C8]/10">
                                        <tr>
                                            <th className="px-4 py-3">{t('admin.articleTitle', 'Назва статті')}</th>
                                            <th className="px-4 py-3">{t('admin.category', 'Категорія')}</th>
                                            <th className="px-4 py-3">{t('admin.status', 'Статус')}</th>
                                            <th className="px-4 py-3">{t('admin.author', 'Автор')}</th>
                                            <th className="px-4 py-3">{t('admin.updated', 'Оновлено')}</th>
                                            <th className="px-4 py-3 text-right">{t('admin.actions', 'Дії')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#46D6C8]/10">
                                        {filtered.map((a, index) => {
                                            // Форматирование даты
                                            const formatDate = (dateString: string) => {
                                                const date = new Date(dateString);
                                                const day = date.getDate();
                                                const monthNames = [
                                                    'січня', 'лютого', 'березня', 'квітня', 'травня', 'червня',
                                                    'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня'
                                                ];
                                                const month = monthNames[date.getMonth()];
                                                const year = date.getFullYear();
                                                const hours = String(date.getHours()).padStart(2, '0');
                                                const minutes = String(date.getMinutes()).padStart(2, '0');
                                                return `${day} ${month} ${year} • ${hours}:${minutes}`;
                                            };

                                            return (
                                                <tr
                                                    key={a.id}
                                                    data-status={a.status}
                                                    className="text-sm hover:bg-[#46D6C8]/10 hover:shadow-[inset_0_0_8px_rgba(70,214,200,.15)] transition-all duration-250 motion-safe:animate-fade-in-up"
                                                    style={{ animationDelay: `${index * 0.03}s` }}
                                                >
                                                    <td className="px-4 py-3">{getTitle(a)}</td>
                                                    <td className="px-4 py-3">
                                                        <span className={categoryColors[a.category]?.text || "text-neutral-300"}>
                                                            {t(`categories.${a.category}`, a.category)}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {(() => {
                                                            const status = a.status as string;
                                                            const isPublished = status === 'published';
                                                            const isScheduled = status === 'scheduled';
                                                            return (
                                                                <span className={
                                                                    "rounded-md px-2 py-0.5 text-xs ring-1 " +
                                                                    (isPublished
                                                                        ? "bg-[#46D6C8]/20 ring-[#46D6C8]/40"
                                                                        : isScheduled
                                                                            ? "bg-amber-500/10 ring-amber-400/30"
                                                                            : "bg-neutral-800 ring-neutral-600/40") +
                                                                    " " + (statusColors[status] || "text-neutral-300")
                                                                }>
                                                                    {isPublished ? t('admin.published', 'Опубліковано') :
                                                                        isScheduled ? t('admin.scheduled', 'Заплановано') :
                                                                            t('admin.drafts', 'Чернетка')}
                                                                </span>
                                                            );
                                                        })()}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {(() => {
                                                            const authorName = (a as any).author?.display_name || a.author_id?.slice(0, 8) + '…' || t('admin.unknown', 'Невідомо');
                                                            const authorRole = (a as any).author?.role?.toLowerCase() || 'user';
                                                            const roleColor = roleColors[authorRole]?.text || 'text-neutral-400';
                                                            // Добавляем свечение для лучшей видимости на черном фоне
                                                            const glowClass = authorRole === 'superadmin'
                                                                ? 'drop-shadow-[0_0_6px_rgba(251,113,133,.8)]'
                                                                : authorRole === 'admin'
                                                                    ? 'drop-shadow-[0_0_6px_rgba(70,214,200,.8)]'
                                                                    : authorRole === 'editor'
                                                                        ? 'drop-shadow-[0_0_6px_rgba(129,140,248,.8)]'
                                                                        : '';
                                                            return (
                                                                <span className={`${roleColor} font-medium ${glowClass}`}>
                                                                    {authorName}
                                                                </span>
                                                            );
                                                        })()}
                                                    </td>
                                                    <td className="px-4 py-3 text-neutral-400">{formatDate(a.updated_at || a.created_at)}</td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex justify-end gap-2 items-center">
                                                            <button
                                                                type="button"
                                                                className="group p-1.5 rounded-md bg-sky-500/10 border border-sky-400/30 text-sky-300 hover:bg-sky-500/20 hover:shadow-[0_0_10px_rgba(56,189,248,.35)] transition-all duration-200 cursor-target"
                                                                onClick={() => navigate(`/admin/articles/edit/${a.id}`)}
                                                            >
                                                                <Edit className="h-4 w-4 motion-safe:group-hover:animate-edit-write transition-transform duration-200 group-hover:scale-110 group-hover:drop-shadow-[0_0_6px_rgba(56,189,248,.8)]" />
                                                            </button>
                                                            <AnimatedDeleteButton
                                                                onClick={() => deleteArticle(a.id)}
                                                                size="xs"
                                                            />
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            {/* Mobile Cards */}
                            <div className="lg:hidden space-y-3">
                                {filtered.map((a) => {
                                    const formatDate = (dateString: string) => {
                                        const date = new Date(dateString);
                                        const day = date.getDate();
                                        const monthNames = [
                                            'січня', 'лютого', 'березня', 'квітня', 'травня', 'червня',
                                            'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня'
                                        ];
                                        const month = monthNames[date.getMonth()];
                                        const year = date.getFullYear();
                                        const hours = String(date.getHours()).padStart(2, '0');
                                        const minutes = String(date.getMinutes()).padStart(2, '0');
                                        return `${day} ${month} ${year} • ${hours}:${minutes}`;
                                    };
                                    const status = a.status as string;
                                    const isPublished = status === 'published';
                                    const isScheduled = status === 'scheduled';
                                    const authorName = (a as any).author?.display_name || a.author_id?.slice(0, 8) + '…' || t('admin.unknown', 'Невідомо');
                                    const authorRole = (a as any).author?.role?.toLowerCase() || 'user';
                                    const roleColor = roleColors[authorRole]?.text || 'text-neutral-400';
                                    const glowClass = authorRole === 'superadmin'
                                        ? 'drop-shadow-[0_0_6px_rgba(251,113,133,.8)]'
                                        : authorRole === 'admin'
                                            ? 'drop-shadow-[0_0_6px_rgba(70,214,200,.8)]'
                                            : authorRole === 'editor'
                                                ? 'drop-shadow-[0_0_6px_rgba(129,140,248,.8)]'
                                                : '';
                                    return (
                                        <div
                                            key={a.id}
                                            data-status={a.status}
                                            className="glass-card relative rounded-xl p-4 sm:p-5 border border-[#46D6C8]/20 hover:border-[#46D6C8]/30 transition-all duration-250"
                                        >
                                            {/* Индикатор статуса слева */}
                                            {isPublished || isScheduled ? (
                                                <span
                                                    className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl pointer-events-none"
                                                    style={{
                                                        background: isPublished
                                                            ? 'linear-gradient(to bottom, #46D6C8, #46D6C8)'
                                                            : 'linear-gradient(to bottom, #f59e0b, #fbbf24)'
                                                    }}
                                                />
                                            ) : null}
                                            {/* Заголовок */}
                                            <div className="flex items-start justify-between gap-3 mb-3">
                                                <h3 className="text-base sm:text-lg font-semibold text-slate-200 pr-2 flex-1 line-clamp-2">
                                                    {getTitle(a)}
                                                </h3>
                                                <div className="flex gap-2 flex-shrink-0">
                                                    <button
                                                        type="button"
                                                        className="group h-8 w-8 flex items-center justify-center rounded-md bg-sky-500/10 border border-sky-400/30 text-sky-300 hover:bg-sky-500/20 hover:shadow-[0_0_10px_rgba(56,189,248,.35)] transition-all duration-200 cursor-target touch-manipulation"
                                                        onClick={() => navigate(`/admin/articles/edit/${a.id}`)}
                                                        aria-label={t('admin.edit', 'Редагувати')}
                                                    >
                                                        <Edit className="h-4 w-4 motion-safe:group-hover:animate-edit-write transition-transform duration-200 group-hover:scale-110 group-hover:drop-shadow-[0_0_6px_rgba(56,189,248,.8)]" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => deleteArticle(a.id)}
                                                        className="h-8 w-8 flex items-center justify-center rounded-md border-2 border-rose-700/50 bg-rose-500/10 hover:bg-rose-500/20 transition-all duration-200 hover:shadow-[0_0_10px_rgba(244,63,94,.35)] cursor-target touch-manipulation"
                                                        aria-label={t('admin.delete', 'Видалити')}
                                                    >
                                                        <svg
                                                            viewBox="0 0 24 24"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            strokeWidth="2"
                                                            className="h-4 w-4 text-rose-300"
                                                        >
                                                            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                            <line x1="10" y1="11" x2="10" y2="17" />
                                                            <line x1="14" y1="11" x2="14" y2="17" />
                                                        </svg>
                                                    </button>
                                                </div>
            </div>
                                            {/* Метаинформация */}
                                            <div className="space-y-2 text-sm">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className={`${categoryColors[a.category]?.text || "text-neutral-300"} text-xs font-medium`}>
                                                        {t(`categories.${a.category}`, a.category)}
                                                    </span>
                                                    <span className="text-slate-500">•</span>
                                                    <span className={
                                                        "rounded-md px-2 py-0.5 text-xs ring-1 " +
                                                        (isPublished
                                                            ? "bg-[#46D6C8]/20 ring-[#46D6C8]/40"
                                                            : isScheduled
                                                                ? "bg-amber-500/10 ring-amber-400/30"
                                                                : "bg-neutral-800 ring-neutral-600/40") +
                                                        " " + (statusColors[status] || "text-neutral-300")
                                                    }>
                                                        {isPublished ? t('admin.published', 'Опубліковано') :
                                                            isScheduled ? t('admin.scheduled', 'Заплановано') :
                                                                t('admin.drafts', 'Чернетка')}
                                                    </span>
            </div>
                                                <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                                                    <span className="text-slate-400">{t('admin.author', 'Автор')}:</span>
                                                    <span className={`${roleColor} font-medium ${glowClass}`}>
                                                        {authorName}
                                        </span>
                                    </div>
                                                <div className="text-xs sm:text-sm text-slate-400">
                                                    {t('admin.updated', 'Оновлено')}: {formatDate(a.updated_at || a.created_at)}
                                    </div>
                                </div>
                                </div>
                                    );
                                })}
                            </div>
                        </>
                )}
            </div>
            </section>
        </AdminShell>
    );
};

export default ArticlesList;