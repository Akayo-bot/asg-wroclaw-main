import { useState, useCallback, useRef } from 'react';
import { GlassConfirmDialog } from '@/components/ui/GlassConfirmDialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/contexts/I18nContext';
import { UploadCloud, Trash2, Check, X, Loader2, ZoomIn, ImagePlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import Cropper from 'react-easy-crop';
import type { Area, Point } from 'react-easy-crop';

interface AvatarUploaderProps {
    currentAvatarUrl: string | null;
    userId: string;
    onAvatarChange: (avatarPath: string | null) => void;
    displayName?: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener('load', () => resolve(image));
        image.addEventListener('error', (error) => reject(error));
        image.src = url;
    });

const getCroppedImg = async (imageSrc: string, pixelCrop: Area): Promise<Blob> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        throw new Error('No 2d context');
    }

    // Устанавливаем размер canvas
    canvas.width = 512;
    canvas.height = 512;

    // Рисуем обрезанное изображение
    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        512,
        512
    );

    // Конвертируем в blob
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) {
                resolve(blob);
            } else {
                reject(new Error('Canvas is empty'));
            }
        }, 'image/jpeg', 0.9);
    });
};

export default function AvatarUploader({ currentAvatarUrl, userId, onAvatarChange, displayName }: AvatarUploaderProps) {
    const { t } = useI18n();
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatarUrl);
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);

    const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const showErrorToast = useCallback((message: string) => {
        toast({
            title: t('common.error', 'Ошибка'),
            description: message,
            variant: 'destructive',
        });
    }, [toast, t]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            processFile(file);
        }
    };

    const processFile = (file: File) => {
        // Валидация
        if (!ALLOWED_TYPES.includes(file.type)) {
            showErrorToast(t('profile.avatar.errorInvalidType', 'Поддерживаются только форматы: JPG, PNG, WEBP'));
            return;
        }

        if (file.size > MAX_FILE_SIZE) {
            showErrorToast(t('profile.avatar.errorTooLarge', 'Размер файла не должен превышать 10MB'));
            return;
        }

        const reader = new FileReader();
        reader.addEventListener('load', () => {
            setImageSrc(reader.result as string);
        });
        reader.readAsDataURL(file);
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files[0];
        if (file) {
            processFile(file);
        }
    }, []);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleSave = async () => {
        if (!imageSrc || !croppedAreaPixels) return;

        setIsLoading(true);

        try {
            const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);

            const fileExt = 'jpg';
            const fileName = `${userId}_${Date.now()}.${fileExt}`;
            const filePath = `avatars/${fileName}`;

            // Удаляем старый аватар
            if (currentAvatarUrl && currentAvatarUrl.includes('avatars/')) {
                const oldPath = currentAvatarUrl.split('avatars/')[1]?.split('?')[0];
                if (oldPath) {
                    await supabase.storage.from('avatars').remove([`avatars/${oldPath}`]);
                }
            }

            // Загружаем новый
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, croppedImage, {
                    contentType: 'image/jpeg',
                    upsert: false,
                });

            if (uploadError) throw uploadError;

            // Получаем публичный URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            // Обновляем профиль
            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    avatar_url: publicUrl,
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId);

            if (updateError) throw updateError;

            setPreviewUrl(publicUrl);
            onAvatarChange(publicUrl);
            setImageSrc(null);
            setCrop({ x: 0, y: 0 });
            setZoom(1);

            toast({
                title: '✅ ' + t('profile.avatar.uploadSuccess', 'Аватар обновлён'),
                description: t('profile.avatar.uploadSuccess', 'Аватар успешно загружен'),
                variant: 'success',
            });
        } catch (err: any) {
            console.error('Error uploading avatar:', err);
            showErrorToast(err.message || t('profile.avatar.uploadError', 'Не удалось загрузить аватар'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemove = async () => {
        if (!currentAvatarUrl) return;

        setIsLoading(true);

        try {
            if (currentAvatarUrl.includes('avatars/')) {
                const path = currentAvatarUrl.split('avatars/')[1]?.split('?')[0];
                if (path) {
                    await supabase.storage.from('avatars').remove([`avatars/${path}`]);
                }
            }

            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    avatar_url: null,
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId);

            if (updateError) throw updateError;

            setPreviewUrl(null);
            onAvatarChange(null);

            toast({
                title: t('common.success', 'Успешно'),
                description: t('profile.avatar.removeSuccess', 'Аватар удален'),
                variant: 'success',
            });
        } catch (err: any) {
            console.error('Error removing avatar:', err);
            showErrorToast(err.message || t('profile.avatar.removeError', 'Не удалось удалить аватар'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        setImageSrc(null);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
    };

    if (imageSrc) {
        return (
            <Card className="glass-panel">
                <CardContent className="pt-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">{t('profile.avatar.cropTitle', 'Настройка аватара')}</h3>
                        <Button variant="ghost" size="icon" onClick={handleCancel} disabled={isLoading}>
                            <X className="w-4 h-4" />
                        </Button>
                    </div>

                    <div className="relative w-full h-[400px] bg-muted rounded-lg overflow-hidden">
                        <Cropper
                            image={imageSrc}
                            crop={crop}
                            zoom={zoom}
                            aspect={1}
                            cropShape="round"
                            showGrid={false}
                            onCropChange={setCrop}
                            onCropComplete={onCropComplete}
                            onZoomChange={setZoom}
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label className="flex items-center gap-2">
                                <ZoomIn className="w-4 h-4" />
                                {t('profile.avatar.zoom', 'Увеличение')}
                            </Label>
                            <span className="text-sm text-muted-foreground">{Math.round(zoom * 100)}%</span>
                        </div>
                        <Slider
                            value={[zoom]}
                            onValueChange={([value]) => setZoom(value)}
                            min={1}
                            max={3}
                            step={0.1}
                            className="cursor-target"
                        />
                    </div>

                    <div className="flex gap-2">
                        <Button
                            onClick={handleSave}
                            disabled={isLoading}
                            className="flex-1 cursor-target bg-[rgba(16,185,129,.15)] text-emerald-100 ring-1 ring-emerald-400/30 px-4 py-2.5 font-medium transition-all hover:bg-[rgba(16,185,129,.22)] hover:text-white hover:shadow-[0_0_40px_-10px_rgba(16,185,129,.6)] active:translate-y-[1px]"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    {t('profile.avatar.uploading', 'Загрузка...')}
                                </>
                            ) : (
                                <>
                                    <Check className="w-4 h-4 mr-2" />
                                    {t('profile.avatar.save', 'Сохранить')}
                                </>
                            )}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleCancel}
                            disabled={isLoading}
                            className="cursor-target"
                        >
                            {t('common.cancel', 'Отмена')}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="bg-[#04070A] border border-emerald-500/20 rounded-2xl p-6 relative overflow-hidden">
            {/* Фоновое свечение */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200px] h-[50px] bg-emerald-500/10 blur-3xl pointer-events-none" />

            <div className="flex items-start gap-6 relative z-10">
                <div className="relative group">
                    <Avatar className="w-24 h-24 border-2 border-emerald-500/30 shadow-[0_0_20px_-6px_rgba(16,185,129,0.3)]">
                        <AvatarImage src={previewUrl || undefined} alt={displayName || 'Avatar'} />
                        <AvatarFallback className="text-2xl bg-[#0a1210] text-emerald-400">
                            {displayName?.charAt(0)?.toUpperCase() || 'U'}
                        </AvatarFallback>
                    </Avatar>
                    {/* Hover overlay */}
                    <div
                        className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                        role="button"
                        tabIndex={0}
                        aria-label={t('profile.avatar.change', 'Змінити аватар')}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
                    >
                        <span className="text-2xl drop-shadow-lg">🖊</span>
                    </div>
                </div>
                <div className="flex-1 pt-1">
                    <h3 className="font-semibold text-lg mb-1 text-white">
                        {t('profile.avatar.title', 'Завантажити аватар')}
                    </h3>
                    <p className="text-sm text-gray-400">
                        {t('profile.avatar.description', 'Мінімум 256×256px, до 10MB')}
                    </p>
                </div>
            </div>

            {/* ЗОНА DRAG & DROP */}
            <div
                className={cn(
                    "mt-6 border border-dashed rounded-xl flex flex-col items-center justify-center p-8 group relative z-10 transition-all duration-300 cursor-pointer",
                    isDragging
                        ? "border-emerald-500/60 bg-emerald-500/15 shadow-[0_0_30px_-10px_rgba(16,185,129,.5)]"
                        : "border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 hover:border-emerald-500/60",
                    isLoading && "opacity-50 pointer-events-none"
                )}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                aria-label={t('profile.avatar.dropZone', 'Перетягніть зображення або натисніть для вибору')}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
            >
                <UploadCloud className="text-gray-400 group-hover:text-emerald-400 transition-colors mb-2" size={32} />
                <p className="text-sm font-bold text-gray-300 group-hover:text-white transition-colors">
                    {t('profile.avatar.dropZone', 'Перетягніть зображення або натисніть для вибору')}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                    JPG, PNG, WEBP · {t('profile.avatar.maxSize', 'До 10MB')}
                </p>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept={ALLOWED_TYPES.join(',')}
                    onChange={handleFileSelect}
                    className="hidden"
                />
            </div>

            {/* КНОПКА ВИДАЛЕННЯ */}
            {previewUrl && (
                <>
                    <button
                        type="button"
                        onClick={() => setConfirmDelete(true)}
                        disabled={isLoading}
                        className="w-full mt-4 py-3 rounded-xl text-red-400/80 font-medium bg-red-500/5 border border-red-500/15 hover:bg-red-500/15 hover:text-red-300 hover:border-red-500/30 transition-all duration-300 flex justify-center items-center gap-2 relative z-10 cursor-target disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label={t('profile.avatar.remove', 'Видалити аватар')}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                {t('common.loading', 'Завантаження...')}
                            </>
                        ) : (
                            <>
                                <Trash2 size={18} />
                                {t('profile.avatar.remove', 'Видалити аватар')}
                            </>
                        )}
                    </button>
                    <GlassConfirmDialog
                        open={confirmDelete}
                        onOpenChange={setConfirmDelete}
                        title="Видалити аватар?"
                        description="Ваш аватар буде видалено назавжди. Цю дію неможливо скасувати."
                        confirmLabel="Видалити"
                        cancelLabel="Скасувати"
                        variant="destructive"
                        onConfirm={handleRemove}
                    />
                </>
            )}
        </div>
    );
}
