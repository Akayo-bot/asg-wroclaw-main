import { useState, useCallback, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/contexts/I18nContext';
import { UploadCloud, Trash2, Check, X, Loader2, AlertCircle, ZoomIn, ImagePlus } from 'lucide-react';
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
    const [error, setError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            processFile(file);
        }
    };

    const processFile = (file: File) => {
        // Валидация
        if (!ALLOWED_TYPES.includes(file.type)) {
            setError(t('profile.avatar.errorInvalidType', 'Поддерживаются только форматы: JPG, PNG, WEBP'));
            return;
        }

        if (file.size > MAX_FILE_SIZE) {
            setError(t('profile.avatar.errorTooLarge', 'Размер файла не должен превышать 10MB'));
            return;
        }

        setError(null);

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
        setError(null);

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
            });
        } catch (err: any) {
            console.error('Error uploading avatar:', err);
            setError(err.message || t('profile.avatar.uploadError', 'Не удалось загрузить аватар'));
            toast({
                title: t('common.error', 'Ошибка'),
                description: err.message || t('profile.avatar.uploadError', 'Не удалось загрузить аватар'),
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemove = async () => {
        if (!currentAvatarUrl) return;

        setIsLoading(true);
        setError(null);

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
            });
        } catch (err: any) {
            console.error('Error removing avatar:', err);
            setError(err.message || t('profile.avatar.removeError', 'Не удалось удалить аватар'));
            toast({
                title: t('common.error', 'Ошибка'),
                description: err.message || t('profile.avatar.removeError', 'Не удалось удалить аватар'),
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        setImageSrc(null);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setError(null);
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

                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <div className="flex gap-2">
                        <Button
                            onClick={handleSave}
                            disabled={isLoading}
                            className="flex-1 cursor-target"
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
        <Card className="glass-panel">
            <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <Avatar className="w-24 h-24 border-4 border-primary/20">
                            <AvatarImage src={previewUrl || undefined} alt={displayName || 'Avatar'} />
                            <AvatarFallback className="text-2xl">
                                {displayName?.charAt(0)?.toUpperCase() || 'U'}
                            </AvatarFallback>
                        </Avatar>
                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center cursor-pointer group-hover:scale-105 transition-transform"
                            onClick={() => fileInputRef.current?.click()}>
                            <span className="text-2xl">🖊</span>
                        </div>
                    </div>
                    <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">
                            {t('profile.avatar.title', 'Загрузить аватар')}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            {t('profile.avatar.description', 'Минимум 256×256px, до 10MB')}
                        </p>
                    </div>
                </div>

                <div
                    className={cn(
                        "border border-dashed rounded-xl p-8 text-center transition-all cursor-pointer",
                        isDragging
                            ? "border-emerald-500/50 bg-emerald-500/10 shadow-[0_0_30px_-10px_rgba(16,185,129,.5)]"
                            : "border-emerald-500/30 bg-neutral-900/55 hover:border-emerald-400/45 hover:shadow-[0_0_30px_-10px_rgba(16,185,129,.5)]",
                        isLoading && "opacity-50 pointer-events-none"
                    )}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <div className="relative inline-flex">
                        <UploadCloud className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        <ImagePlus className="w-6 h-6 absolute -bottom-1 right-0 text-primary" />
                    </div>
                    <p className="text-sm font-medium mb-1">
                        {t('profile.avatar.dropZone', 'Перетащите изображение или нажмите для выбора')}
                    </p>
                    <p className="text-xs text-muted-foreground">
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

                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {previewUrl && (
                    <button
                        type="button"
                        onClick={handleRemove}
                        disabled={isLoading}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[rgba(239,68,68,.08)] text-red-300 ring-1 ring-red-400/25 px-4 py-2 text-sm transition-all hover:bg-[rgba(239,68,68,.12)] hover:text-red-200 hover:ring-red-400/40 hover:shadow-[0_0_18px_-6px_rgba(239,68,68,.5)] active:translate-y-[1px] cursor-target"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                {t('common.loading', 'Загрузка...')}
                            </>
                        ) : (
                            <>
                                <Trash2 className="w-4 h-4" />
                                {t('profile.avatar.remove', 'Удалить аватар')}
                            </>
                        )}
                    </button>
                )}
            </CardContent>
        </Card>
    );
}
