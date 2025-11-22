import { useState, useRef, useEffect } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ImageUploaderProps {
    label: string;
    currentUrl?: string | null;
    onUpload: (url: string) => void;
    bucket?: string;
    folder?: string;
    accept?: string;
    fileType?: 'image' | 'video';
}

export default function ImageUploader({ 
    label, 
    currentUrl, 
    onUpload, 
    bucket = 'media',
    folder = 'branding',
    accept,
    fileType = 'image'
}: ImageUploaderProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [preview, setPreview] = useState<string | null>(currentUrl || null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    // Синхронизируем preview с currentUrl при изменении
    useEffect(() => {
        setPreview(currentUrl || null);
    }, [currentUrl]);

    const handleFileSelect = async (file: File) => {
        const isImage = file.type.startsWith('image/');
        const isVideo = file.type.startsWith('video/');
        
        if (fileType === 'image' && !isImage) {
            toast({
                title: 'Помилка',
                description: 'Будь ласка, виберіть файл зображення',
                variant: 'destructive',
            });
            return;
        }
        
        if (fileType === 'video' && !isVideo) {
            toast({
                title: 'Помилка',
                description: 'Будь ласка, виберіть файл відео',
                variant: 'destructive',
            });
            return;
        }
        
        if (!isImage && !isVideo) {
            toast({
                title: 'Помилка',
                description: 'Будь ласка, виберіть файл зображення або відео',
                variant: 'destructive',
            });
            return;
        }

        setIsUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${folder}/${crypto.randomUUID()}-${Date.now()}.${fileExt}`;
            const filePath = fileName;

            // Загружаем файл
            const { error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(filePath, file, {
                    contentType: file.type,
                    upsert: false,
                });

            if (uploadError) throw uploadError;

            // Получаем публичный URL
            const { data: { publicUrl } } = supabase.storage
                .from(bucket)
                .getPublicUrl(filePath);

            setPreview(publicUrl);
            onUpload(publicUrl);

            toast({
                title: 'Успіх',
                description: fileType === 'image' ? 'Зображення завантажено успішно' : 'Відео завантажено успішно',
            });
        } catch (error: any) {
            console.error('Error uploading image:', error);
            toast({
                title: 'Помилка',
                description: error.message || 'Не вдалося завантажити зображення',
                variant: 'destructive',
            });
        } finally {
            setIsUploading(false);
        }
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const handleRemove = () => {
        setPreview(null);
        onUpload('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="space-y-2">
            <label className="text-sm font-medium text-white/80">{label}</label>
            <div className="relative">
                <input
                    ref={fileInputRef}
                    type="file"
                    accept={accept || (fileType === 'image' ? 'image/*' : fileType === 'video' ? 'video/*' : 'image/*,video/*')}
                    onChange={handleFileChange}
                    className="hidden"
                />
                
                {preview ? (
                    <div className="relative group">
                        <div className="rounded-lg border border-white/10 bg-black/40 p-4">
                            {fileType === 'image' || preview.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i) ? (
                                <img
                                    src={preview}
                                    alt={label}
                                    className="w-full h-32 object-contain rounded"
                                />
                            ) : (
                                <video
                                    src={preview}
                                    className="w-full h-32 object-contain rounded"
                                    controls={false}
                                />
                            )}
                            <button
                                type="button"
                                onClick={handleRemove}
                                className="absolute top-2 right-2 p-1 rounded-full bg-red-500/80 hover:bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={handleClick}
                        disabled={isUploading}
                        className="w-full rounded-lg border-2 border-dashed border-[#46D6C8]/30 bg-black/40 p-6 hover:border-[#46D6C8]/50 hover:bg-black/60 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <div className="flex flex-col items-center justify-center gap-2">
                            {isUploading ? (
                                <>
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#46D6C8]"></div>
                                    <span className="text-sm text-gray-400">Завантаження...</span>
                                </>
                            ) : (
                                <>
                                    <Upload className="h-8 w-8 text-[#46D6C8]" />
                                    <span className="text-sm text-gray-300">Натисніть для завантаження</span>
                                    <span className="text-xs text-gray-500">
                                        {fileType === 'image' ? 'PNG, JPG, SVG до 5MB' : fileType === 'video' ? 'MP4, MOV, WEBM до 50MB' : 'Файли до 50MB'}
                                    </span>
                                </>
                            )}
                        </div>
                    </button>
                )}
            </div>
        </div>
    );
}

