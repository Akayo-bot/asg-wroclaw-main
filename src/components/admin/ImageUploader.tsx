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
    onUploadMany,
    bucket = 'media',
    folder = 'branding',
    accept,
    fileType = 'image',
    multiple = false
}: ImageUploaderProps & { multiple?: boolean; onUploadMany?: (urls: string[]) => void }) {
    const [isUploading, setIsUploading] = useState(false);
    const [preview, setPreview] = useState<string | null>(currentUrl || null);
    const [previews, setPreviews] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    // Синхронизируем preview с currentUrl при изменении (только для одиночного режима)
    useEffect(() => {
        if (!multiple) {
            setPreview(currentUrl || null);
        }
    }, [currentUrl, multiple]);

    const uploadFile = async (file: File): Promise<string> => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${folder}/${crypto.randomUUID()}-${Date.now()}.${fileExt}`;
        const filePath = fileName;

        const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(filePath, file, {
                contentType: file.type,
                upsert: false,
            });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);
            
        return publicUrl;
    };

    const handleFileSelect = async (files: FileList | File[]) => {
        const fileArray = Array.from(files);
        const validFiles: File[] = [];

        // Валидация
        for (const file of fileArray) {
            const isImage = file.type.startsWith('image/');
            const isVideo = file.type.startsWith('video/');
            
            if (fileType === 'image' && !isImage) continue;
            if (fileType === 'video' && !isVideo) continue;
            
            validFiles.push(file);
        }

        if (validFiles.length === 0) {
            toast({
                title: 'Помилка',
                description: 'Не вибрано жодного коректного файлу',
                variant: 'destructive',
            });
            return;
        }

        setIsUploading(true);
        try {
            if (multiple) {
                // Параллельная загрузка
                const uploadPromises = validFiles.map(uploadFile);
                const urls = await Promise.all(uploadPromises);
                
                setPreviews(prev => [...prev, ...urls]);
                if (onUploadMany) {
                    // Мы не знаем предыдущие URL, если они не переданы, но здесь мы просто добавляем новые
                    // В идеале родитель должен управлять состоянием, но для простоты вернем все загруженные сейчас
                    // Или лучше: вернем ВСЕ превью? Нет, лучше только новые или все.
                    // Давайте вернем все текущие превью + новые.
                    onUploadMany([...previews, ...urls]);
                }
                
                toast({
                    title: 'Успіх',
                    description: `Завантажено файлів: ${urls.length}`,
                });
            } else {
                // Одиночная загрузка
                const url = await uploadFile(validFiles[0]);
                setPreview(url);
                onUpload(url);
                
                toast({
                    title: 'Успіх',
                    description: fileType === 'image' ? 'Зображення завантажено успішно' : 'Відео завантажено успішно',
                });
            }
        } catch (error: any) {
            console.error('Error uploading image:', error);
            toast({
                title: 'Помилка',
                description: error.message || 'Не вдалося завантажити файли',
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
        const files = e.target.files;
        if (files && files.length > 0) {
            handleFileSelect(files);
        }
    };

    const handleRemove = () => {
        setPreview(null);
        onUpload('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleRemoveItem = (index: number) => {
        const newPreviews = [...previews];
        newPreviews.splice(index, 1);
        setPreviews(newPreviews);
        if (onUploadMany) {
            onUploadMany(newPreviews);
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
                    multiple={multiple}
                />
                
                {/* Single File Mode Preview */}
                {!multiple && preview && (
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
                )}

                {/* Multiple Files Mode Preview */}
                {multiple && previews.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                        {previews.map((url, index) => (
                            <div key={index} className="relative group">
                                <div className="rounded-lg border border-white/10 bg-black/40 p-2">
                                    {fileType === 'image' || url.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i) ? (
                                        <img
                                            src={url}
                                            alt={`Uploaded ${index}`}
                                            className="w-full h-24 object-cover rounded"
                                        />
                                    ) : (
                                        <video
                                            src={url}
                                            className="w-full h-24 object-cover rounded"
                                            controls={false}
                                        />
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveItem(index)}
                                        className="absolute top-1 right-1 p-1 rounded-full bg-red-500/80 hover:bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Upload Button (Show if single mode empty OR multiple mode always) */}
                {((!multiple && !preview) || multiple) && (
                    <button
                        type="button"
                        onClick={handleClick}
                        disabled={isUploading}
                        className={`w-full rounded-lg border-2 border-dashed border-[#46D6C8]/30 bg-black/40 p-6 hover:border-[#46D6C8]/50 hover:bg-black/60 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${multiple && previews.length > 0 ? 'mt-2' : ''}`}
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
                                    <span className="text-sm text-gray-300">
                                        {multiple ? 'Додати файли' : 'Натисніть для завантаження'}
                                    </span>
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

