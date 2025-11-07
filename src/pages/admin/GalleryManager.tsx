import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '@/contexts/I18nContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, Eye, Image, Video, Search, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import LoadingScreen from '@/components/LoadingScreen';
import { Tables } from '@/integrations/supabase/types';

type GalleryItem = Tables<'gallery_items'>;

interface GalleryForm {
    title_uk: string;
    title_ru: string;
    title_pl: string;
    description_uk: string;
    description_ru: string;
    description_pl: string;
    file_url: string;
    file_type: string;
    thumbnail_url: string;
}

const GalleryManager = () => {
    const { t, language } = useI18n();
    const { toast } = useToast();
    const [items, setItems] = useState<GalleryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<'all' | 'image' | 'video'>('all');
    const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [formData, setFormData] = useState<GalleryForm>({
        title_uk: '',
        title_ru: '',
        title_pl: '',
        description_uk: '',
        description_ru: '',
        description_pl: '',
        file_url: '',
        file_type: 'image',
        thumbnail_url: '',
    });

    useEffect(() => {
        fetchItems();
    }, [typeFilter]);

    const fetchItems = async () => {
        try {
            let query = supabase.from('gallery_items').select('*');

            if (typeFilter !== 'all') {
                query = query.ilike('file_type', `${typeFilter}%`);
            }

            query = query.order('created_at', { ascending: false });

            const { data, error } = await query;
            if (error) throw error;

            setItems(data || []);
        } catch (error) {
            console.error('Error fetching gallery items:', error);
            toast({
                title: t('common.error', 'Error'),
                description: t('gallery.fetch_error', 'Failed to fetch gallery items'),
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (editingItem) {
                const { error } = await supabase
                    .from('gallery_items')
                    .update({
                        ...formData,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', editingItem.id);

                if (error) throw error;

                toast({
                    title: t('common.success', 'Success'),
                    description: t('gallery.updated', 'Gallery item updated successfully'),
                });
            } else {
                const { error } = await supabase
                    .from('gallery_items')
                    .insert({
                        ...formData,
                        uploaded_by: (await supabase.auth.getUser()).data.user?.id || '',
                    });

                if (error) throw error;

                toast({
                    title: t('common.success', 'Success'),
                    description: t('gallery.created', 'Gallery item created successfully'),
                });
            }

            resetForm();
            fetchItems();
        } catch (error) {
            console.error('Error saving gallery item:', error);
            toast({
                title: t('common.error', 'Error'),
                description: t('gallery.save_error', 'Failed to save gallery item'),
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const deleteItem = async (id: string) => {
        if (!confirm(t('gallery.confirm_delete', 'Are you sure you want to delete this item?'))) return;

        try {
            const { error } = await supabase
                .from('gallery_items')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setItems(items.filter(item => item.id !== id));
            toast({
                title: t('common.success', 'Success'),
                description: t('gallery.deleted', 'Gallery item deleted successfully'),
            });
        } catch (error) {
            console.error('Error deleting gallery item:', error);
            toast({
                title: t('common.error', 'Error'),
                description: t('gallery.delete_error', 'Failed to delete gallery item'),
                variant: 'destructive',
            });
        }
    };

    const resetForm = () => {
        setFormData({
            title_uk: '',
            title_ru: '',
            title_pl: '',
            description_uk: '',
            description_ru: '',
            description_pl: '',
            file_url: '',
            file_type: 'image',
            thumbnail_url: '',
        });
        setEditingItem(null);
        setIsDialogOpen(false);
    };

    const editItem = (item: GalleryItem) => {
        setEditingItem(item);
        setFormData({
            title_uk: item.title_uk || '',
            title_ru: item.title_ru || '',
            title_pl: item.title_pl || '',
            description_uk: item.description_uk || '',
            description_ru: item.description_ru || '',
            description_pl: item.description_pl || '',
            file_url: item.file_url,
            file_type: item.file_type,
            thumbnail_url: item.thumbnail_url || '',
        });
        setIsDialogOpen(true);
    };

    const getTitle = (item: GalleryItem) => {
        const titles = {
            uk: item.title_uk,
            ru: item.title_ru,
            pl: item.title_pl,
            en: item.title_uk, // fallback
        };
        return titles[language] || item.title_uk || 'Untitled';
    };

    const filteredItems = items.filter(item => {
        if (searchTerm) {
            const title = getTitle(item).toLowerCase();
            if (!title.includes(searchTerm.toLowerCase())) return false;
        }
        return true;
    });

    if (loading && items.length === 0) {
        return <LoadingScreen label="SCANNING TARGETS…" size={140} />;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">{t('gallery.title', 'Gallery Management')}</h1>
                    <p className="text-muted-foreground">{t('gallery.description', 'Manage your gallery images and videos')}</p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
                            <Plus className="h-4 w-4 mr-2" />
                            {t('gallery.add_item', 'Add Item')}
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>
                                {editingItem ? t('gallery.edit_item', 'Edit Gallery Item') : t('gallery.add_item', 'Add Gallery Item')}
                            </DialogTitle>
                        </DialogHeader>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="file_url">{t('gallery.file_url', 'File URL')}</Label>
                                    <Input
                                        id="file_url"
                                        value={formData.file_url}
                                        onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
                                        placeholder="https://example.com/image.jpg"
                                        required
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="file_type">{t('gallery.file_type', 'File Type')}</Label>
                                    <Select value={formData.file_type} onValueChange={(value) => setFormData({ ...formData, file_type: value })}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="image">Image</SelectItem>
                                            <SelectItem value="video">Video</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="md:col-span-2">
                                    <Label htmlFor="thumbnail_url">{t('gallery.thumbnail_url', 'Thumbnail URL (optional)')}</Label>
                                    <Input
                                        id="thumbnail_url"
                                        value={formData.thumbnail_url}
                                        onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                                        placeholder="https://example.com/thumbnail.jpg"
                                    />
                                </div>
                            </div>

                            <Tabs defaultValue="uk" className="space-y-4">
                                <TabsList>
                                    <TabsTrigger value="uk">🇺🇦 Українська</TabsTrigger>
                                    <TabsTrigger value="ru">🇷🇺 Русский</TabsTrigger>
                                    <TabsTrigger value="pl">🇵🇱 Polski</TabsTrigger>
                                    <TabsTrigger value="en">🇺🇸 English</TabsTrigger>
                                </TabsList>

                                {['uk', 'ru', 'pl', 'en'].map((lang) => (
                                    <TabsContent key={lang} value={lang} className="space-y-4">
                                        <div>
                                            <Label htmlFor={`title_${lang}`}>{t('gallery.title_field', 'Title')}</Label>
                                            <Input
                                                id={`title_${lang}`}
                                                value={formData[`title_${lang}` as keyof GalleryForm]}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    [`title_${lang}`]: e.target.value
                                                })}
                                                placeholder={t('gallery.title_placeholder', 'Enter title')}
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor={`description_${lang}`}>{t('gallery.description_field', 'Description')}</Label>
                                            <Textarea
                                                id={`description_${lang}`}
                                                value={formData[`description_${lang}` as keyof GalleryForm]}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    [`description_${lang}`]: e.target.value
                                                })}
                                                placeholder={t('gallery.description_placeholder', 'Enter description')}
                                                rows={3}
                                            />
                                        </div>
                                    </TabsContent>
                                ))}
                            </Tabs>

                            <div className="flex justify-end gap-2">
                                <Button type="button" variant="outline" onClick={resetForm}>
                                    {t('common.cancel', 'Cancel')}
                                </Button>
                                <Button type="submit" disabled={loading}>
                                    {loading ? t('common.loading', 'Loading...') : t('common.save', 'Save')}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={t('gallery.search_placeholder', 'Search gallery items...')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>

                <Select value={typeFilter} onValueChange={(value: any) => setTypeFilter(value)}>
                    <SelectTrigger className="w-48">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t('gallery.all_types', 'All Types')}</SelectItem>
                        <SelectItem value="image">{t('gallery.images', 'Images')}</SelectItem>
                        <SelectItem value="video">{t('gallery.videos', 'Videos')}</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredItems.map((item) => (
                    <Card key={item.id}>
                        <CardHeader className="pb-2">
                            <div className="relative aspect-video bg-muted rounded-md overflow-hidden">
                                {item.file_type.startsWith('image') ? (
                                    <img
                                        src={item.thumbnail_url || item.file_url}
                                        alt={getTitle(item)}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full">
                                        <Video className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                )}
                                <Badge className="absolute top-2 right-2" variant="secondary">
                                    {item.file_type.startsWith('image') ? (
                                        <><Image className="h-3 w-3 mr-1" />Image</>
                                    ) : (
                                        <><Video className="h-3 w-3 mr-1" />Video</>
                                    )}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <CardTitle className="text-lg mb-2">{getTitle(item)}</CardTitle>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">
                                    {new Date(item.created_at).toLocaleDateString()}
                                </span>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={() => editItem(item)}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => deleteItem(item.id)}
                                        className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {filteredItems.length === 0 && (
                <Card>
                    <CardContent className="py-8 text-center">
                        <p className="text-muted-foreground">{t('gallery.no_items', 'No gallery items found')}</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default GalleryManager;