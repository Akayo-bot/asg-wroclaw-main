import React, { useRef, useEffect, useState } from 'react';
import { Info, MapPin, Clock, Camera, Plus, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ImageUploader from '@/components/admin/ImageUploader';
import { Label } from '@/components/ui/label';
import { TimeWheel } from "@/components/ui/time-wheel";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { Popover, PopoverContent, PopoverTrigger, PopoverAnchor } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Calendar1 } from '@/components/Calendar1';
import { useI18n } from "@/contexts/I18nContext";
import { toast } from '@/hooks/use-toast';

// Custom date picker implementation
interface CreateEventFormProps {
    eventData: any;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { name: string; value: any } }) => void;
    onSave: () => void;
    onCancel: () => void;
    handleImageUpload: (url: string) => void;
    isEditing?: boolean;
}

const fromISOToText = (iso?: string | null) => {
    if (!iso) return "";
    // 23.11.2025, 14:30
    return new Date(iso).toLocaleString("uk-UA", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).replace(',', ''); // Remove comma if present in locale string
};

const Card = ({ title, subtitle, children, icon: Icon }: { title: string; subtitle?: string; children: React.ReactNode; icon?: any }) => (
    <div className="rounded-xl p-6 border border-white/10 bg-black/80 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-2">
            {Icon && <Icon size={24} className="text-[#46D6C8]" />}
            <h3 className="text-xl font-semibold text-white">{title}</h3>
        </div>
        {subtitle && <p className="text-sm text-gray-400 mb-6">{subtitle}</p>}
        <div className="space-y-4">{children}</div>
    </div>
);

const AutoResizeTextarea = ({ value, onChange, name, placeholder, rows = 3 }: any) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [value]);

    return (
        <textarea
            ref={textareaRef}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            rows={rows}
            className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 hover:border-[#46D6C8]/50 focus:border-[#46D6C8] focus:outline-none transition-colors resize-none overflow-hidden"
        />
    );
};

const CreateEventForm: React.FC<CreateEventFormProps> = ({ eventData, onChange, onSave, onCancel, handleImageUpload, isEditing = false }) => {
    
    // Time format state
    const { language } = useI18n();
    const [timeFormatMode, setTimeFormatMode] = useState<"auto" | "12" | "24">("auto");
    
    // Determine effective format
    const effective12h = React.useMemo(() => {
        if (timeFormatMode === "auto") {
            return language === "en";
        }
        return timeFormatMode === "12";
    }, [timeFormatMode, language]);

    const [isButtonHovering, setIsButtonHovering] = useState(false);
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    const [isInputFocused, setIsInputFocused] = useState(false);
    const [inputValue, setInputValue] = useState("");
    // Space added after date part for visual separation: "DD.MM.YYYY   HH:mm"
    const [inputMask, setInputMask] = useState("DD.MM.YYYY   HH:mm");

    // Sync input value with eventData.start_datetime when not focused
    useEffect(() => {
        if (!isInputFocused && eventData.start_datetime) {
            const text = fromISOToText(eventData.start_datetime);
            // Add extra spaces for display if valid
            if (text.length >= 16) {
                 // "DD.MM.YYYY HH:mm" -> "DD.MM.YYYY   HH:mm"
                 const [datePart, timePart] = text.split(' ');
                 setInputValue(`${datePart}   ${timePart}`);
            } else {
                setInputValue(text);
            }
        } else if (!isInputFocused && !eventData.start_datetime) {
            setInputValue("");
            setInputMask("DD.MM.YYYY   HH:mm");
        }
    }, [eventData.start_datetime, isInputFocused]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value;
        // Allow spaces for the gap
        
        const prevVal = inputValue;
        
        // Auto-formatting logic for DD.MM.YYYY   HH:mm
        let formatted = val;
        
        // Remove all non-digits temporarily to count
        const digitsOnly = val.replace(/[^\d]/g, '');
        
        // If user is typing (not deleting)
        if (val.length >= prevVal.length) {
            // Auto-add dots and spaces
            if (digitsOnly.length <= 2) {
                // DD
                formatted = digitsOnly;
            } else if (digitsOnly.length <= 4) {
                // DD.MM
                formatted = digitsOnly.slice(0, 2) + '.' + digitsOnly.slice(2);
            } else if (digitsOnly.length <= 8) {
                // DD.MM.YYYY
                formatted = digitsOnly.slice(0, 2) + '.' + digitsOnly.slice(2, 4) + '.' + digitsOnly.slice(4);
            } else if (digitsOnly.length <= 10) {
                // DD.MM.YYYY   HH (3 spaces)
                formatted = digitsOnly.slice(0, 2) + '.' + digitsOnly.slice(2, 4) + '.' + digitsOnly.slice(4, 8) + '   ' + digitsOnly.slice(8);
            } else {
                // DD.MM.YYYY   HH:mm
                formatted = digitsOnly.slice(0, 2) + '.' + digitsOnly.slice(2, 4) + '.' + digitsOnly.slice(4, 8) + '   ' + digitsOnly.slice(8, 10) + ':' + digitsOnly.slice(10, 12);
            }
        } else {
            // User is deleting
             // Logic to handle deletion nicely - primarily relying on raw input but maybe cleaning up trailing separators if needed
             // For now, basic handling
        }
        
        // Update input value
        setInputValue(formatted);
        
        // Update mask based on length (accounting for extra spaces)
        // Lengths: 
        // DD (2)
        // DD.MM (5)
        // DD.MM.YYYY (10)
        // DD.MM.YYYY   (13)
        // DD.MM.YYYY   HH (15)
        // DD.MM.YYYY   HH:mm (18)

        if (formatted.length === 0) setInputMask("DD.MM.YYYY   HH:mm");
        else if (formatted.length <= 2) setInputMask("  .MM.YYYY   HH:mm");
        else if (formatted.length <= 5) setInputMask("     .YYYY   HH:mm");
        else if (formatted.length <= 10) setInputMask("             HH:mm");
        else if (formatted.length <= 13) setInputMask("             HH:mm");
        else if (formatted.length <= 15) setInputMask("               :mm");
        else setInputMask("");

        
        // Try to parse complete date
        if (digitsOnly.length === 12) {
            // We have full date: DDMMYYYYHHMM
            const day = parseInt(digitsOnly.slice(0, 2));
            const month = parseInt(digitsOnly.slice(2, 4));
            const year = parseInt(digitsOnly.slice(4, 8));
            const hour = parseInt(digitsOnly.slice(8, 10));
            const minute = parseInt(digitsOnly.slice(10, 12));
            
            // Validation
            if (month < 1 || month > 12) {
                toast({ title: "Невірна дата", description: "Місяць має бути від 01 до 12", variant: "destructive" });
                return;
            }
            
            // Days in month check
            const daysInMonth = new Date(year, month, 0).getDate();
            if (day < 1 || day > daysInMonth) {
                toast({ title: "Невірна дата", description: `В цьому місяці лише ${daysInMonth} днів`, variant: "destructive" });
                return;
            }

            if (hour > 23) {
                toast({ title: "Невірний час", description: "Години мають бути від 00 до 23", variant: "destructive" });
                return;
            }
            if (minute > 59) {
                toast({ title: "Невірний час", description: "Хвилини мають бути від 00 до 59", variant: "destructive" });
                return;
            }

            const date = new Date(year, month - 1, day, hour, minute);
            
            // Check valid date object
            if (!isNaN(date.getTime())) {
                 // Check if past date (optional, based on requirements but user asked for validation)
                 // "Так же проверку даты на такую и писать что не существует такой даты" - existence check done above.
                 onChange({ target: { name: 'start_datetime', value: date.toISOString() } });
            } else {
                 toast({ title: "Помилка", description: "Некоректна дата", variant: "destructive" });
            }
        }
    };

    const handleSelectChange = (name: string, value: string) => {
        onChange({ target: { name, value } });
    };

    const handleAmenityChange = (index: number, value: string) => {
        const newAmenities = [...(eventData.amenities || [])];
        newAmenities[index] = value;
        onChange({ target: { name: 'amenities', value: newAmenities } });
    };

    const handleAddAmenity = () => {
        const newAmenities = [...(eventData.amenities || []), ''];
        onChange({ target: { name: 'amenities', value: newAmenities } });
    };

    const handleRemoveAmenity = (index: number) => {
        const newAmenities = (eventData.amenities || []).filter((_: any, i: number) => i !== index);
        onChange({ target: { name: 'amenities', value: newAmenities } });
    };

    return (
        <div className="p-6 space-y-6 max-w-3xl mx-auto">
            <h1 className="font-display text-3xl text-white">{isEditing ? 'Редагувати подію' : 'Додати подію'}</h1>

            {/* Basic Info */}
            <Card title="Основна інформація" icon={Info} subtitle="Назва та анонс">
                <div className="space-y-2">
                    <Label className="text-white">Назва події (UKR)</Label>
                    <Input 
                        name="title_uk" 
                        value={eventData.title_uk} 
                        onChange={onChange} 
                        required 
                        autoComplete="off"
                        className="bg-white/5 border-white/10 text-white hover:border-[#46D6C8]/50 focus:border-[#46D6C8] focus:ring-0 focus:outline-none transition-colors"
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-white">Короткий опис / Анонс</Label>
                    <AutoResizeTextarea
                        name="description_uk" 
                        value={eventData.description_uk} 
                        onChange={onChange} 
                        placeholder="Яскравий анонс події для залучення гравців..." 
                    />
                </div>
            </Card>

            {/* Location & Scenario */}
            <Card title="Локація та сценарій" icon={MapPin} subtitle="Критично для підготовки гравців">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label className="text-white">Назва полігона (для відображення)</Label>
                        <Input 
                            name="location_uk" 
                            value={eventData.location_uk} 
                            onChange={onChange} 
                            required 
                            autoComplete="off"
                            className="bg-white/5 border-white/10 text-white hover:border-[#46D6C8]/50 focus:border-[#46D6C8] focus:ring-0 focus:outline-none transition-colors"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-white">Google Maps URL (Клікабельна точка)</Label>
                        <Input 
                            name="map_url" 
                            value={eventData.map_url} 
                            onChange={onChange} 
                            placeholder="https://maps.app.goo.gl/..." 
                            autoComplete="off"
                            className="bg-white/5 border-white/10 text-white hover:border-[#46D6C8]/50 focus:border-[#46D6C8] focus:ring-0 focus:outline-none transition-colors"
                        />
                    </div>
                </div>

                <hr className="border-white/10 my-4" />

                <div className="space-y-2">
                    <Label className="text-white">Деталі гри / Мета</Label>
                    <AutoResizeTextarea
                        name="scenario_uk" 
                        value={eventData.scenario_uk} 
                        onChange={onChange} 
                        rows={5}
                        placeholder="Опис сценарію, елементи гри, умови перемоги..." 
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-white">Правила та техніка безпеки</Label>
                    <AutoResizeTextarea
                        name="rules_uk" 
                        value={eventData.rules_uk} 
                        onChange={onChange} 
                        rows={3}
                        placeholder="Хронометраж, захист очей, 'холодний постріл'..." 
                    />
                </div>
            </Card>

            {/* Timing & Participants */}
            <Card title="Таймінг та учасники" icon={Clock} subtitle="Чіткість та фінанси">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-[60]">
                    <div className="space-y-2">
                        <Label className="text-white">Дата та час старту</Label>
                        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                            <PopoverAnchor asChild>
                                <div className="relative flex items-center gap-2 w-full">
                                    <div className="relative flex-1">
                                        {/* Mask Overlay */}
                                        <div 
                                            className="absolute inset-0 pointer-events-none flex items-center px-3 text-muted-foreground/40 font-mono text-sm tracking-wide"
                                            aria-hidden="true"
                                        >
                                            <span className="opacity-0">{inputValue}</span>
                                            <span>{inputMask}</span>
                                        </div>
                                        
                                        <Input
                                            name="start_datetime_display"
                                            value={inputValue}
                                            onChange={handleInputChange}
                                            className="bg-white/5 border-white/10 text-white hover:border-[#46D6C8]/50 focus:border-[#46D6C8] focus:ring-0 focus:outline-none transition-colors w-full font-mono tracking-wide relative z-10 bg-transparent"
                                            onFocus={() => setIsInputFocused(true)}
                                            onBlur={() => setIsInputFocused(false)}
                                            autoComplete="off"
                                        />
                                    </div>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="backdrop-blur-md bg-[#04070A]/80 border border-white/10 shadow-[0_0_0_1px_rgba(255,255,255,0.05)] hover:bg-white/10 hover:border-[#46D6C8]/20 transition-colors h-10 w-10 p-0 hover:shadow-[0_0_16px_rgba(70,214,200,0.35)] group cursor-target relative overflow-visible active:scale-90 transition-transform duration-150 shrink-0"
                                            aria-label="Вибрати дату"
                                            onMouseEnter={() => setIsButtonHovering(true)}
                                            onMouseLeave={() => setIsButtonHovering(false)}
                                            onClick={() => setIsPopoverOpen(true)}
                                        >
                                            <div className="relative w-full h-full flex items-center justify-center pointer-events-none">
                                                <div className="absolute inset-0 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[#46D6C8]/5 blur-md" />
                                                <Calendar1
                                                    className="text-white/70 group-hover:text-[#46D6C8] transition-colors duration-300"
                                                    width={20}
                                                    height={20}
                                                    isHoveringExternal={isButtonHovering}
                                                    isFocused={isInputFocused}
                                                    isPopoverOpen={isPopoverOpen}
                                                />
                                            </div>
                                        </Button>
                                    </PopoverTrigger>
                                </div>
                            </PopoverAnchor>
                            <PopoverContent
                                className="w-auto p-0 bg-[#04070A]/80 backdrop-blur border border-[#46D6C8]/20 rounded-2xl shadow-[0_0_40px_rgba(70,214,200,0.12)]"
                                align="center"
                                side="bottom"
                                sideOffset={10}
                            >
                                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-0">
                                    <div className="p-3 md:p-4">
                                        <DayPicker
                                            mode="single"
                                            selected={eventData.start_datetime ? new Date(eventData.start_datetime) : undefined}
                                            onSelect={(day) => {
                                                if (!day) return;
                                                const cur = eventData.start_datetime ? new Date(eventData.start_datetime) : new Date();
                                                const d = new Date(day);
                                                d.setHours(cur.getHours(), cur.getMinutes(), 0, 0);
                                                onChange({ target: { name: 'start_datetime', value: d.toISOString() } });
                                            }}
                                            disabled={(day) => {
                                                const t = new Date();
                                                t.setHours(0, 0, 0, 0);
                                                return day < t;
                                            }}
                                            weekStartsOn={1}
                                            className="rsf-cal"
                                            classNames={{
                                                caption: "rsf-cal-caption",
                                                caption_label: "rsf-cal-caption-label",
                                                nav: "rsf-cal-nav",
                                                table: "rsf-cal-table",
                                                head_row: "rsf-cal-head-row",
                                                head_cell: "rsf-cal-head",
                                                row: "rsf-cal-row",
                                                cell: "rsf-cal-cell",
                                                day: "rsf-cal-day",
                                                day_selected: "rsf-cal-day rsf-cal-day--sel",
                                                day_today: "rsf-cal-day rsf-cal-day--today",
                                                day_disabled: "rsf-cal-day rsf-cal-day--dis",
                                            }}
                                            components={{
                                                IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" {...props} />,
                                                IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" {...props} />,
                                            }}
                                        />
                                    </div>
                                    <div className="px-3 md:px-4 pb-4 flex flex-col gap-3 md:gap-4">
                                        <div className="text-xs text-[#46D6C8]/70 pt-3 md:pt-4 text-center">
                                            Час події
                                        </div>
                                        <div className="flex items-end justify-center gap-4">
                                            <TimeWheel
                                                label={effective12h ? "Hours" : "Години"}
                                                value={eventData.start_datetime ? (effective12h
                                                    ? (() => {
                                                        const h = new Date(eventData.start_datetime).getHours();
                                                        return h === 0 ? 12 : h > 12 ? h - 12 : h;
                                                    })()
                                                    : new Date(eventData.start_datetime).getHours())
                                                    : undefined}
                                                onChange={(h) => {
                                                    const base = eventData.start_datetime ? new Date(eventData.start_datetime) : new Date();
                                                    if (effective12h) {
                                                        const currentH = base.getHours();
                                                        const isPM = currentH >= 12;
                                                        const newHour = h === 12
                                                            ? (isPM ? 12 : 0)
                                                            : (isPM ? h + 12 : h);
                                                        base.setHours(newHour);
                                                    } else {
                                                        base.setHours(h);
                                                    }
                                                    onChange({ target: { name: 'start_datetime', value: base.toISOString() } });
                                                }}
                                                range={effective12h ? [1, 12] : [0, 23]}
                                                pad
                                                className="w-24"
                                                key={effective12h ? `hours-12h-${eventData.start_datetime}` : `hours-24h-${eventData.start_datetime}`}
                                            />
                                            <div className="pb-8 text-[#46D6C8]/70">:</div>
                                            <TimeWheel
                                                label="Хвилини"
                                                value={eventData.start_datetime ? new Date(eventData.start_datetime).getMinutes() : 0}
                                                onChange={(m) => {
                                                    const base = eventData.start_datetime ? new Date(eventData.start_datetime) : new Date();
                                                    base.setMinutes(m);
                                                    onChange({ target: { name: 'start_datetime', value: base.toISOString() } });
                                                }}
                                                range={[0, 59]}
                                                pad
                                                className="w-24"
                                            />
                                            
                                            {effective12h && (
                                                <div className="flex flex-col items-start">
                                                    <div className="text-[11px] mb-1 text-[#46D6C8]/60">АМ/РМ</div>
                                                    <div className="inline-flex rounded-xl overflow-hidden ring-1 ring-[#46D6C8]/20">
                                                        {(["AM", "PM"] as const).map((p) => {
                                                            const curH = eventData.start_datetime ? new Date(eventData.start_datetime).getHours() : 0;
                                                            const active = (p === "AM" && curH < 12) || (p === "PM" && curH >= 12);
                                                            return (
                                                                <button
                                                                    key={p}
                                                                    onClick={() => {
                                                                        const d = eventData.start_datetime ? new Date(eventData.start_datetime) : new Date();
                                                                        const h = d.getHours();
                                                                        if (p === "AM" && h >= 12) d.setHours(h - 12);
                                                                        if (p === "PM" && h < 12) d.setHours(h + 12);
                                                                        onChange({ target: { name: 'start_datetime', value: d.toISOString() } });
                                                                    }}
                                                                    className={`px-3 py-2 text-sm transition
                                                                      ${active
                                                                            ? "bg-[#46D6C8]/20 text-[#46D6C8]"
                                                                            : "bg-white/5 text-gray-400 hover:bg-white/8 hover:text-[#46D6C8]"}
                                                                    `}
                                                                >
                                                                    {p}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        
                                        <Select
                                            value={timeFormatMode}
                                            onValueChange={(v) => setTimeFormatMode(v as "auto" | "12" | "24")}
                                        >
                                            <SelectTrigger className="h-10 sm:h-9 w-full border-[#46D6C8]/30 text-sm sm:text-base cursor-target bg-white/5 text-white hover:bg-white/10 transition-colors focus:ring-0 focus:ring-offset-0">
                                                <SelectValue placeholder="Години">
                                                    {timeFormatMode === "auto"
                                                        ? (effective12h ? "12h (Авто)" : "24h (Авто)")
                                                        : timeFormatMode === "12"
                                                            ? "12h"
                                                            : "24h"}
                                                </SelectValue>
                                            </SelectTrigger>
                                            <SelectContent className="bg-[#04070A] border-[#46D6C8]/20 text-white">
                                                <SelectItem value="auto" className="focus:bg-[#46D6C8]/20 focus:text-[#46D6C8]">Авто ({language === "en" ? "12h" : "24h"})</SelectItem>
                                                <SelectItem value="12" className="focus:bg-[#46D6C8]/20 focus:text-[#46D6C8]">12h (AM/PM)</SelectItem>
                                                <SelectItem value="24" className="focus:bg-[#46D6C8]/20 focus:text-[#46D6C8]">24h</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>

                <hr className="border-white/10 my-4" />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <Label className="text-white">Ліміт учасників</Label>
                        <Input 
                            name="max_players" 
                            type="number" 
                            value={eventData.max_players} 
                            onChange={onChange} 
                            placeholder="100" 
                            autoComplete="off"
                            className="bg-white/5 border-white/10 text-white hover:border-[#46D6C8]/50 focus:border-[#46D6C8] focus:ring-0 focus:outline-none transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-white">Ціна</Label>
                        <Input 
                            name="price_amount" 
                            type="number" 
                            value={eventData.price_amount} 
                            onChange={onChange} 
                            placeholder="400" 
                            autoComplete="off"
                            className="bg-white/5 border-white/10 text-white hover:border-[#46D6C8]/50 focus:border-[#46D6C8] focus:ring-0 focus:outline-none transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-white">Валюта</Label>
                        <Select value={eventData.price_currency} onValueChange={(v) => handleSelectChange('price_currency', v)}>
                            <SelectTrigger className="bg-white/5 border-white/10 text-white hover:border-[#46D6C8]/50 focus:border-[#46D6C8] focus:ring-0 focus:outline-none transition-colors">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-neutral-900 border-white/10">
                                <SelectItem value="UAH" className="text-white focus:bg-white/10 focus:text-white">UAH</SelectItem>
                                <SelectItem value="PLN" className="text-white focus:bg-white/10 focus:text-white">PLN</SelectItem>
                                <SelectItem value="EUR" className="text-white focus:bg-white/10 focus:text-white">EUR</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </Card>

            {/* Visualization & Amenities */}
            <Card title="Візуалізація та зручності" icon={Camera} subtitle="Маркетинг та логістика">
                <div className="space-y-2">
                    <ImageUploader 
                        label="Фото полігону"
                        currentUrl={eventData.main_image_url} 
                        onUpload={handleImageUpload} 
                    />
                </div>

                <div className="space-y-3 pt-4 border-t border-white/10">
                    <div className="flex items-center justify-between">
                        <Label className="text-white">Зручності на місці</Label>
                        <button
                            type="button"
                            onClick={handleAddAmenity}
                            className="flex items-center gap-1 px-3 py-1 rounded-lg bg-[#46D6C8]/20 text-[#46D6C8] hover:bg-[#46D6C8]/30 transition-colors"
                        >
                            <Plus size={16} />
                            <span className="text-sm">Додати</span>
                        </button>
                    </div>
                    <div className="space-y-2">
                        {(eventData.amenities || []).map((amenity: string, index: number) => (
                            <div key={index} className="flex items-center gap-2">
                                <Input
                                    value={amenity}
                                    onChange={(e) => handleAmenityChange(index, e.target.value)}
                                    placeholder="Наприклад: Гарячі напої, Парковка..."
                                    autoComplete="off"
                                    className="bg-white/5 border-white/10 text-white hover:border-[#46D6C8]/50 focus:border-[#46D6C8] focus:ring-0 focus:outline-none transition-colors"
                                />
                                <button
                                    type="button"
                                    onClick={() => handleRemoveAmenity(index)}
                                    className="p-2 rounded-lg text-red-400 hover:bg-red-400/10 transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </Card>

            <div className="flex justify-end gap-4 pt-4 pb-16">
                <button onClick={onCancel} className="px-4 py-2 rounded-lg text-white hover:bg-white/10 transition-colors">
                    Скасувати
                </button>
                <button onClick={onSave} className="px-6 py-2 rounded-lg bg-[#46D6C8] text-black font-semibold hover:bg-[#3bc2b5] transition-colors shadow-[0_0_15px_rgba(70,214,200,0.3)]">
                    {isEditing ? 'Зберегти зміни' : 'Зберегти подію'}
                </button>
            </div>
        </div>
    );
};

export default CreateEventForm;
