import React, { useState } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import CreateEventForm from '@/components/admin/CreateEventForm';
import { useToast } from "@/components/ui/use-toast";
import { ToastAction } from "@/components/ui/toast";

interface EventForm {
    title_uk: string;
    title_ru: string;
    title_pl: string;
    title_en: string;
    description_uk: string;
    description_ru: string;
    description_pl: string;
    description_en: string;
    location_uk: string;
    location_ru: string;
    location_pl: string;
    location_en: string;
    rules_uk: string;
    rules_ru: string;
    rules_pl: string;
    rules_en: string;
    scenario_uk: string;
    scenario_ru: string;
    scenario_pl: string;
    scenario_en: string;
    start_datetime: string;
    registration_deadline: string;
    price_amount: string;
    price_currency: string;
    min_players: string;
    max_players: string;
    limit_mode: string;
    status: string;
    status_registration: string;
    main_image_url: string;
    cover_url: string;
    map_url: string;
    amenities: string[];
    gathering_time: string;
    duration: string;
}

interface EventModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (formData: EventForm) => Promise<void>;
    editingEvent?: any | null;
    formData: EventForm;
    setFormData: (data: EventForm) => void;
    loading: boolean;
}

const EventModal: React.FC<EventModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    editingEvent,
    formData,
    setFormData,
    loading
}) => {
    const { t } = useI18n();



    const handleImageUpload = (url: string) => {
        setFormData({ ...formData, main_image_url: url });
    };

    const { toast } = useToast();
    const [errors, setErrors] = useState<Record<string, boolean>>({});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { name: string; value: any } }) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        
        // Clear error if exists
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };


    const handleSave = async () => {
        // Validation
        const newErrors: Record<string, boolean> = {};
        const missingFields = [];

        if (!formData.title_uk?.trim()) { newErrors['title_uk'] = true; missingFields.push("Назва події"); }
        if (!formData.location_uk?.trim()) { newErrors['location_uk'] = true; missingFields.push("Назва полігону"); }
        if (!formData.map_url?.trim()) { newErrors['map_url'] = true; missingFields.push("Google Maps URL"); }
        if (!formData.scenario_uk?.trim()) { newErrors['scenario_uk'] = true; missingFields.push("Деталі гри / Мета"); }
        if (!formData.rules_uk?.trim()) { newErrors['rules_uk'] = true; missingFields.push("Правила та техніка безпеки"); }
        if (!formData.start_datetime) { newErrors['start_datetime'] = true; missingFields.push("Дата та час старту"); }
        if (!formData.duration?.trim()) { newErrors['duration'] = true; missingFields.push("Тривалість гри"); }
        if (!formData.price_amount) { newErrors['price_amount'] = true; missingFields.push("Ціна"); }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            toast({
                variant: "destructive",
                title: "Помилка валидації",
                description: `Будь ласка, заповніть наступні поля: ${missingFields.join(", ")}`,
                className: "bg-[#1a0505]/95 backdrop-blur-md border border-red-500/30 text-red-100 shadow-[0_0_30px_rgba(220,38,38,0.25)] rounded-2xl",
                duration: 5000,
            })
            return;
        }

        await onSubmit(formData);
    };
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent
                onOpenAutoFocus={(e) => e.preventDefault()}
                className="flex flex-col p-0 gap-0 max-w-3xl bg-[#04070A]/90 border-white/10 backdrop-blur-md shadow-[0_0_50px_rgba(70,214,200,0.15)] overflow-hidden"
            >
                {/* Header */}
                <DialogHeader className="px-6 py-4 bg-[#04070A] relative z-50 shrink-0">
                    <DialogTitle className="text-xl font-display text-white">
                        {editingEvent ? 'Редагувати подію' : 'Додати подію'}
                    </DialogTitle>
                    {/* Top Gradient */}
                    <div className="absolute left-0 right-0 top-full -translate-y-2 h-16 bg-gradient-to-b from-[#04070A] via-[#04070A]/90 to-transparent pointer-events-none z-50" />
                </DialogHeader>

                {/* Content */}
                <div className="overflow-y-auto flex-1 neon-scrollbar px-6 pb-6 pt-10 relative z-0">
                    <div className="pb-4">
                        <CreateEventForm
                            eventData={formData}
                            onChange={handleChange}
                            handleImageUpload={handleImageUpload}
                            isEditing={!!editingEvent}
                            loading={loading}
                            errors={errors}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 pt-2 pb-4 bg-[#04070A] flex justify-end gap-3 rounded-b-lg relative z-50">
                    {/* Gradient above footer */}
                    <div className="absolute -top-12 translate-y-px left-0 right-0 h-12 bg-gradient-to-t from-[#04070A] via-[#04070A]/80 to-transparent pointer-events-none" />
                    
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all"
                    >
                        {t('common.cancel', 'Скасувати')}
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={loading}
                        className="px-4 py-2 rounded-lg bg-[#46D6C8] text-black font-semibold hover:opacity-90 hover:shadow-[0_0_30px_rgba(70,214,200,0.8)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? t('common.loading', 'Завантаження...') : (editingEvent ? 'Зберегти зміни' : 'Зберегти подію')}
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default EventModal;