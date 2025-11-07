import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useI18n } from '@/contexts/I18nContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import AdminShell from '@/components/admin/AdminShell';
import ArticleEditorModern, { ArticlePayload } from '@/components/admin/ArticleEditorModern';
import { Tables } from '@/integrations/supabase/types';
import { logActivity } from '@/utils/activityLogger';

type Article = Tables<'articles'>;

const ArticleEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [isEdit, setIsEdit] = useState(!!id);
  const [initialData, setInitialData] = useState<Partial<ArticlePayload> | undefined>();

  useEffect(() => {
    if (id) {
      fetchArticle();
    }
  }, [id]);

  const fetchArticle = async () => {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        setInitialData({
          title: data.title_uk || '',
          preview: data.preview_uk || '',
          body: data.content_uk || '',
          category: data.category || 'news',
          mainImageUrl: data.main_image_url || undefined,
          gallery: [], // TODO: добавить поддержку галереи в БД
          seo: {
            slug: data.seo_title_uk || '',
            metaDescription: data.seo_description_uk || undefined,
          },
          schedule: null, // TODO: добавить поддержку расписания
          video: null, // TODO: добавить поддержку видео
        });
      }
    } catch (error) {
      console.error('Error fetching article:', error);
      toast({
        title: t('common.error', 'Error'),
        description: t('admin.errorFetchingArticle', 'Failed to fetch article'),
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (payload: ArticlePayload) => {
    if (!user) return;

    setLoading(true);
    try {
      const articleData = {
        title_uk: payload.title || '',
        title_ru: payload.title || '', // Используем title_uk как fallback
        title_pl: payload.title || '', // Используем title_uk как fallback
        preview_uk: payload.preview || '',
        preview_ru: payload.preview || '', // Используем preview_uk как fallback
        preview_pl: payload.preview || '', // Используем preview_uk как fallback
        content_uk: payload.body || '',
        content_ru: payload.body || '', // Используем content_uk как fallback
        content_pl: payload.body || '', // Используем content_uk как fallback
        category: payload.category as 'tactics' | 'equipment' | 'news' | 'game_reports' | 'rules',
        main_image_url: payload.mainImageUrl || null,
        seo_title_uk: payload.seo.slug || null,
        seo_description_uk: payload.seo.metaDescription || null,
        status: 'published' as const,
        author_id: user.id,
      };

      let articleId = id;
      
      if (isEdit && id) {
        const { error } = await supabase
          .from('articles')
          .update(articleData)
          .eq('id', id);

        if (error) throw error;
        
        // Логируем обновление статьи
        await logActivity('ARTICLE_UPDATE', {
          articleId: id,
          title: payload.title,
        });
      } else {
        const { data, error } = await supabase
          .from('articles')
          .insert(articleData)
          .select('id')
          .single();

        if (error) throw error;
        
        articleId = data.id;
        
        // Логируем создание статьи
        await logActivity('ARTICLE_CREATE', {
          articleId: data.id,
          title: payload.title,
        });
        
        // Логируем публикацию статьи
        await logActivity('ARTICLE_PUBLISH', {
          articleId: data.id,
          title: payload.title,
        });
      }

      toast({
        title: t('common.success', 'Success'),
        description: isEdit ? t('admin.articleUpdated', 'Article updated') : t('admin.articleCreated', 'Article created'),
      });

      navigate('/admin/articles');
    } catch (error) {
      console.error('Error saving article:', error);
      toast({
        title: t('common.error', 'Error'),
        description: t('admin.errorSavingArticle', 'Failed to save article'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async (payload: Partial<ArticlePayload>) => {
    if (!user) return;

    setLoading(true);
    try {
      const articleData = {
        title_uk: payload.title || '',
        title_ru: payload.title || '', // Используем title_uk как fallback
        title_pl: payload.title || '', // Используем title_uk как fallback
        preview_uk: payload.preview || '',
        preview_ru: payload.preview || '', // Используем preview_uk как fallback
        preview_pl: payload.preview || '', // Используем preview_uk как fallback
        content_uk: payload.body || '',
        content_ru: payload.body || '', // Используем content_uk как fallback
        content_pl: payload.body || '', // Используем content_uk как fallback
        category: (payload.category || 'news') as 'tactics' | 'equipment' | 'news' | 'game_reports' | 'rules',
        main_image_url: payload.mainImageUrl || null,
        seo_title_uk: payload.seo?.slug || null,
        seo_description_uk: payload.seo?.metaDescription || null,
        status: 'draft' as const,
        author_id: user.id,
      };

      let articleId = id;
      
      if (isEdit && id) {
        const { error } = await supabase
          .from('articles')
          .update(articleData)
          .eq('id', id);

        if (error) throw error;
        
        // Логируем обновление черновика
        await logActivity('ARTICLE_UPDATE', {
          articleId: id,
          title: payload.title,
        });
      } else {
        const { data, error } = await supabase
          .from('articles')
          .insert(articleData)
          .select('id')
          .single();

        if (error) throw error;
        
        articleId = data.id;
        
        // Логируем создание черновика
        await logActivity('ARTICLE_CREATE', {
          articleId: data.id,
          title: payload.title,
        });
      }

      toast({
        title: t('common.success', 'Success'),
        description: t('admin.draftSaved', 'Draft saved'),
      });
    } catch (error) {
      console.error('Error saving draft:', error);
      toast({
        title: t('common.error', 'Error'),
        description: t('admin.errorSavingDraft', 'Failed to save draft'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminShell>
      <ArticleEditorModern
        initial={initialData}
        onSubmit={handleSubmit}
        onSaveDraft={handleSaveDraft}
      />
    </AdminShell>
  );
};

export default ArticleEditor;