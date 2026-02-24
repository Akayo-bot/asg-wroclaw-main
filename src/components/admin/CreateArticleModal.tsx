import React, { useState, useRef } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { logActivity } from '@/utils/activityLogger';
import ArticleEditorModern, { ArticleEditorRef, ArticlePayload } from '@/components/admin/ArticleEditorModern';
import { useAuth } from '@/contexts/AuthContext';
import { getGlassToastClassName, getGlassToastVariant } from '@/lib/glass-toast';

interface CreateArticleModalProps {
    isOpen: boolean;
    onClose: () => void;
    article?: any;
    onArticleCreated?: () => void;
}

const CreateArticleModal: React.FC<CreateArticleModalProps> = ({ isOpen, onClose, onArticleCreated, article }) => {
    const { t } = useI18n();
    const { toast } = useToast();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const editorRef = useRef<ArticleEditorRef>(null);

    type ArticleWriteData = {
        title_uk: string;
        title_ru: string;
        title_pl: string;
        preview_uk: string;
        preview_ru: string;
        preview_pl: string;
        content_uk: string;
        content_ru: string;
        content_pl: string;
        category: 'tactics' | 'equipment' | 'news' | 'game_reports' | 'rules';
        main_image_url: string | null;
        seo_title_uk: string | null;
        seo_description_uk: string | null;
        status: 'published' | 'draft';
        author_id: string;
        gallery: string[] | null;
    };

    const getErrorMessage = (error: unknown) => {
        if (typeof error === "string") return error;
        if (error instanceof Error) return error.message;
        if (
            typeof error === "object" &&
            error !== null &&
            "message" in error &&
            typeof (error as { message?: unknown }).message === "string"
        ) {
            return (error as { message: string }).message;
        }
        return "";
    };

    const getReadableArticleErrorMessage = (error: unknown, fallback: string) => {
        const rawMessage = getErrorMessage(error);

        if (/could not find the 'gallery' column of 'articles'/i.test(rawMessage)) {
            return "У таблиці articles відсутнє поле gallery. Оновіть схему БД або вимкніть збереження галереї.";
        }

        return rawMessage || fallback;
    };

    const isMissingGalleryColumnError = (error: unknown) =>
        /could not find the 'gallery' column of 'articles'/i.test(getErrorMessage(error));

    const buildArticleData = (
        payload: Partial<ArticlePayload>,
        status: 'published' | 'draft',
    ): ArticleWriteData => ({
        title_uk: payload.title || '',
        title_ru: payload.title || '',
        title_pl: payload.title || '',
        preview_uk: payload.preview || '',
        preview_ru: payload.preview || '',
        preview_pl: payload.preview || '',
        content_uk: payload.body || '',
        content_ru: payload.body || '',
        content_pl: payload.body || '',
        category: (payload.category || 'news') as 'tactics' | 'equipment' | 'news' | 'game_reports' | 'rules',
        main_image_url: payload.mainImageUrl || null,
        seo_title_uk: payload.seo?.slug || null,
        seo_description_uk: payload.seo?.metaDescription || null,
        status,
        author_id: user!.id,
        gallery: payload.gallery?.length ? payload.gallery : null,
    });

    const mutateArticleWithGalleryFallback = async <T,>(
        articleData: ArticleWriteData,
        mutate: (data: ArticleWriteData | Omit<ArticleWriteData, 'gallery'>) => Promise<{ data?: T | null; error: unknown }>,
    ) => {
        let response = await mutate(articleData);
        let skippedGallery = false;

        if (response.error && isMissingGalleryColumnError(response.error)) {
            const { gallery: _gallery, ...articleDataWithoutGallery } = articleData;
            response = await mutate(articleDataWithoutGallery);
            skippedGallery = !response.error;
        }

        return {
            data: response.data ?? null,
            error: response.error,
            skippedGallery,
        };
    };


    // Prepare initial data for editor if editing
    const initialData = React.useMemo(() => {
        if (!article) return undefined;
        return {
            title: article.title_uk || article.title_ru || article.title_pl || '',
            preview: article.preview_uk || article.preview_ru || article.preview_pl || '',
            body: article.content_uk || article.content_ru || article.content_pl || '',
            category: article.category || 'news',
            mainImageUrl: article.main_image_url,
            // Note: Gallery and Video fields mapping depends on DB structure which isn't fully visible, 
            // but we pass what we can. If fields exist in article object they should be mapped here.
            gallery: article.gallery || [],
            seo: { 
                slug: article.seo_title_uk || '', 
                metaDescription: article.seo_description_uk || '' 
            },
            schedule: null, // Reset schedule for editing unless we map it
            video: null // Map if video columns exist
        } as ArticlePayload;
    }, [article]);

    const handleSubmit = async (payload: ArticlePayload) => {
        if (!user) return;

        setLoading(true);
        try {
            const articleData = buildArticleData(payload, 'published');
            let skippedGallery = false;

            if (article?.id) {
                // UPDATE
                const { error, skippedGallery: usedFallback } = await mutateArticleWithGalleryFallback(
                    articleData,
                    async (data) => {
                        const { error } = await supabase
                            .from('articles')
                            .update(data)
                            .eq('id', article.id);
                        return { error };
                    },
                );

                if (error) throw error;
                skippedGallery = usedFallback;

                await logActivity('ARTICLE_UPDATE', {
                    articleId: article.id,
                    title: payload.title,
                });
            } else {
                // CREATE
                const { data, error, skippedGallery: usedFallback } = await mutateArticleWithGalleryFallback(
                    articleData,
                    async (data) =>
                        supabase
                            .from('articles')
                            .insert(data)
                            .select('id')
                            .single(),
                );

                if (error) throw error;
                skippedGallery = usedFallback;

                await logActivity('ARTICLE_CREATE', {
                    articleId: data?.id,
                    title: payload.title,
                });

                await logActivity('ARTICLE_PUBLISH', {
                    articleId: data?.id,
                    title: payload.title,
                });
            }

            toast({
                title: skippedGallery ? 'Увага' : t('common.success', 'Success'),
                description: skippedGallery
                    ? 'Статтю збережено, але галерею пропущено: у БД відсутнє поле gallery.'
                    : article?.id
                        ? 'Статтю оновлено'
                        : t('admin.articleCreated', 'Article created'),
                variant: getGlassToastVariant(skippedGallery ? 'warning' : 'success'),
                className: getGlassToastClassName(skippedGallery ? 'warning' : 'success'),
                duration: 5000,
            });

            onClose();
            if (onArticleCreated) onArticleCreated();
            
            window.location.reload(); 

        } catch (error: any) {
            console.error('Error saving article:', error);
            toast({
                title: t('common.error', 'Error'),
                description: getReadableArticleErrorMessage(
                    error,
                    t('admin.errorCreatingArticle', 'Failed to save article'),
                ),
                variant: getGlassToastVariant('error'),
                className: getGlassToastClassName('error'),
                duration: 5000,
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSaveDraft = async (payload: Partial<ArticlePayload>) => {
        if (!user) return;

        setLoading(true);
        try {
            const articleData = buildArticleData(payload, 'draft');
            let skippedGallery = false;

            if (article?.id) {
                // UPDATE DRAFT
                const { error, skippedGallery: usedFallback } = await mutateArticleWithGalleryFallback(
                    articleData,
                    async (data) => {
                        const { error } = await supabase
                            .from('articles')
                            .update(data)
                            .eq('id', article.id);
                        return { error };
                    },
                );

                if (error) throw error;
                skippedGallery = usedFallback;
            } else {
                // CREATE DRAFT
                const { error, skippedGallery: usedFallback } = await mutateArticleWithGalleryFallback(
                    articleData,
                    async (data) =>
                        supabase
                            .from('articles')
                            .insert(data)
                            .select('id')
                            .single(),
                );

                if (error) throw error;
                skippedGallery = usedFallback;
                
                await logActivity('ARTICLE_CREATE', { title: payload.title || 'Draft' });
            }

            toast({
                title: skippedGallery ? 'Увага' : t('common.success', 'Success'),
                description: skippedGallery
                    ? 'Чернетку збережено, але галерею пропущено: у БД відсутнє поле gallery.'
                    : t('admin.draftSaved', 'Draft saved'),
                variant: getGlassToastVariant(skippedGallery ? 'warning' : 'success'),
                className: getGlassToastClassName(skippedGallery ? 'warning' : 'success'),
                duration: 5000,
            });
            
            onClose();
            if (onArticleCreated) onArticleCreated();
            window.location.reload();

        } catch (error: any) {
            console.error('Error saving draft:', error);
            toast({
                title: t('common.error', 'Error'),
                description: getReadableArticleErrorMessage(
                    error,
                    t('admin.errorSavingDraft', 'Failed to save draft'),
                ),
                variant: getGlassToastVariant('error'),
                className: getGlassToastClassName('error'),
                duration: 5000,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={() => !loading && onClose()}>
            <DialogContent 
                onOpenAutoFocus={(e) => e.preventDefault()}
                className="flex flex-col p-0 gap-0 max-w-6xl max-h-[90vh] bg-[#04070A]/90 border-white/10 backdrop-blur-md shadow-[0_0_50px_rgba(70,214,200,0.15)] overflow-hidden"
            >
                {/* Header */}
                <DialogHeader className="px-6 py-4 bg-[#04070A] relative z-50 shrink-0">
                    <DialogTitle className="text-xl font-display text-white">
                        {article ? 'Редагувати статтю' : 'Створити статтю'}
                    </DialogTitle>
                    {/* Bottom Gradient */}
                    <div className="absolute left-0 right-0 top-full -translate-y-2 h-16 bg-gradient-to-b from-[#04070A] via-[#04070A]/90 to-transparent pointer-events-none z-50" />
                </DialogHeader>

                {/* Content */}
                <div className="overflow-y-auto flex-1 neon-scrollbar px-6 pb-6 pt-10 relative z-0">
                    <div className="pb-4">
                        <ArticleEditorModern
                                ref={editorRef}
                                initial={initialData}
                                onSubmit={handleSubmit}
                                onSaveDraft={handleSaveDraft}
                                isModal={true}
                                uploadImage={async (file) => {
                                    // Placeholder upload function if needed, or real one
                                    return URL.createObjectURL(file);
                                }}
                                uploadVideo={async (file) => {
                                     return URL.createObjectURL(file);
                                }}
                            />
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 pt-2 pb-4 bg-[#04070A] flex justify-end gap-3 rounded-b-lg relative z-50 shrink-0">
                    {/* Gradient above footer */}
                    <div className="absolute -top-12 translate-y-px left-0 right-0 h-12 bg-gradient-to-t from-[#04070A] via-[#04070A]/80 to-transparent pointer-events-none" />
                    
                    <div className="flex w-full justify-end gap-3 z-10 relative">
                        <button
                            type="button"
                            onClick={() => editorRef.current?.saveDraft()}
                            disabled={loading}
                            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Зберегти чернетку
                        </button>
                        <button
                            type="button"
                            onClick={() => editorRef.current?.submit()}
                            disabled={loading}
                            className="px-4 py-2 rounded-lg bg-[#46D6C8] text-black font-semibold hover:opacity-90 hover:shadow-[0_0_30px_rgba(70,214,200,0.8)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Публікація...' : 'Опублікувати'}
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default CreateArticleModal;
