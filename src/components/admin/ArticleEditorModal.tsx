import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ArticlePayload } from './ArticleEditorModern';

export type ArticleEditorModalRef = {
    submit: () => void;
    saveDraft: () => void;
};

type ArticleEditorModalProps = {
    initial?: Partial<ArticlePayload>;
    onSubmit?: (data: ArticlePayload) => Promise<void> | void;
    onSaveDraft?: (data: Partial<ArticlePayload>) => Promise<void> | void;
};

const ArticleEditorModal = forwardRef<ArticleEditorModalRef, ArticleEditorModalProps>(
    ({ initial, onSubmit, onSaveDraft }, ref) => {
        const [title, setTitle] = useState(initial?.title ?? '');
        const [preview, setPreview] = useState(initial?.preview ?? '');
        const [body, setBody] = useState(initial?.body ?? '');
        const [category, setCategory] = useState(initial?.category ?? 'news');
        const [slug, setSlug] = useState(initial?.seo?.slug ?? '');
        const [meta, setMeta] = useState(initial?.seo?.metaDescription ?? '');

        const handleSubmit = () => {
            if (onSubmit) {
                onSubmit({
                    title,
                    preview,
                    body,
                    category,
                    mainImageUrl: '',
                    gallery: [],
                    seo: { slug, metaDescription: meta },
                    schedule: null,
                    video: null,
                });
            }
        };

        const handleSaveDraft = () => {
            if (onSaveDraft) {
                onSaveDraft({
                    title,
                    preview,
                    body,
                    category,
                    seo: { slug, metaDescription: meta },
                });
            }
        };

        useImperativeHandle(ref, () => ({
            submit: handleSubmit,
            saveDraft: handleSaveDraft,
        }));

        const categories = [
            { key: 'news', label: 'Новини' },
            { key: 'tactics', label: 'Тактика' },
            { key: 'equipment', label: 'Спорядження' },
            { key: 'game_reports', label: 'Звіти з ігор' },
            { key: 'rules', label: 'Правила' },
        ];

        return (
            <div className="space-y-6">
                {/* Title */}
                <div className="space-y-2">
                    <Label htmlFor="title">Заголовок</Label>
                    <Input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Введіть заголовок статті..."
                        className="bg-white/5 border-white/10"
                    />
                </div>

                {/* Preview */}
                <div className="space-y-2">
                    <Label htmlFor="preview">Превʼю</Label>
                    <Textarea
                        id="preview"
                        value={preview}
                        onChange={(e) => setPreview(e.target.value)}
                        placeholder="Короткий опис статті..."
                        rows={3}
                        className="bg-white/5 border-white/10 resize-none"
                    />
                </div>

                {/* Body */}
                <div className="space-y-2">
                    <Label htmlFor="body">Основний текст</Label>
                    <Textarea
                        id="body"
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        placeholder="Текст статті..."
                        rows={8}
                        className="bg-white/5 border-white/10 resize-none"
                    />
                </div>

                {/* Category */}
                <div className="space-y-2">
                    <Label>Категорія</Label>
                    <div className="flex flex-wrap gap-2">
                        {categories.map((cat) => (
                            <Button
                                key={cat.key}
                                type="button"
                                onClick={() => setCategory(cat.key)}
                                variant={category === cat.key ? 'default' : 'outline'}
                                className={
                                    category === cat.key
                                        ? 'bg-[#46D6C8] text-black hover:bg-[#46D6C8]/90'
                                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                                }
                            >
                                {cat.label}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* SEO */}
                <div className="space-y-4 pt-4 border-t border-white/10">
                    <h3 className="text-sm font-medium text-white">SEO</h3>
                    
                    <div className="space-y-2">
                        <Label htmlFor="slug">Slug</Label>
                        <Input
                            id="slug"
                            value={slug}
                            onChange={(e) => setSlug(e.target.value)}
                            placeholder="article-slug"
                            className="bg-white/5 border-white/10"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="meta">Meta Description</Label>
                        <Textarea
                            id="meta"
                            value={meta}
                            onChange={(e) => setMeta(e.target.value)}
                            placeholder="Опис для пошукових систем..."
                            rows={2}
                            className="bg-white/5 border-white/10 resize-none"
                        />
                    </div>
                </div>
            </div>
        );
    }
);

ArticleEditorModal.displayName = 'ArticleEditorModal';

export default ArticleEditorModal;
