import React, { useRef, useEffect } from 'react';
import { Info, MapPin, Clock, Camera, Plus, X, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ImageUploader from '@/components/admin/ImageUploader';
import { Label } from '@/components/ui/label';
import { TimeWheel } from "@/components/ui/time-wheel";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { Popover, PopoverContent, PopoverTrigger, PopoverAnchor } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar1 } from '@/components/Calendar1';
import { useI18n } from "@/contexts/I18nContext";
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { NeonPopoverList } from '@/components/admin/NeonPopoverList';

// ── Хелперы для динамических подсказок ──────────────────────────────────────
type SegKey = "DD" | "MM" | "YYYY" | "HH" | "mm" | "AMPM";

/** 0..1 прогресс заполнения каждого сегмента */
function segmentProgress(text: string, is12h: boolean): Record<SegKey, number> {
    const zero: Record<SegKey, number> = { DD: 0, MM: 0, YYYY: 0, HH: 0, mm: 0, AMPM: 0 };
    const t = (text || "").trim();
    if (!t) return zero;

    if (is12h) {
        // MM/DD/YYYY hh:mm (AM|PM)?
        const m = t.match(/^\s*(\d{0,2})\/?(\d{0,2})\/?(\d{0,4})(?:\s+(\d{0,2})(?::(\d{0,2}))?(?:\s*(AM|PM))?)?/i);
        if (!m) return zero;
        const [, MM, DD, YYYY, HH, mm, AP] = m;
        return {
            DD: Math.min((DD || "").length / 2, 1),
            MM: Math.min((MM || "").length / 2, 1),
            YYYY: Math.min((YYYY || "").length / 4, 1),
            HH: Math.min((HH || "").length / 2, 1),
            mm: Math.min((mm || "").length / 2, 1),
            AMPM: AP ? 1 : 0,
        };
    } else {
        // DD.MM.YYYY HH:mm
        const m = t.match(/^\s*(\d{0,2})\.?(\d{0,2})\.?(\d{0,4})(?:\s+(\d{0,2})(?::(\d{0,2}))?)?/);
        if (!m) return zero;
        const [, DD, MM, YYYY, HH, mm] = m;
        return {
            DD: Math.min((DD || "").length / 2, 1),
            MM: Math.min((MM || "").length / 2, 1),
            YYYY: Math.min((YYYY || "").length / 4, 1),
            HH: Math.min((HH || "").length / 2, 1),
            mm: Math.min((mm || "").length / 2, 1),
            AMPM: 0,
        };
    }
}

/** Общий «прогресс заполнения» 0..1 — можно использовать для общей прозрачности */
function overallProgress(text: string, is12h: boolean) {
    const s = segmentProgress(text, is12h);
    const keys: SegKey[] = is12h ? ["MM", "DD", "YYYY", "HH", "mm", "AMPM"] : ["DD", "MM", "YYYY", "HH", "mm"];
    return keys.reduce((a, k) => a + s[k], 0) / keys.length;
}

interface CreateEventFormProps {
    eventData: any;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { name: string; value: any } }) => void;
    handleImageUpload: (url: string) => void;
    isEditing?: boolean;
    loading?: boolean;
    errors?: Record<string, boolean>;
}

const AutoResizeTextarea = ({ value, onChange, name, placeholder, rows = 3, hasError }: any) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const baseInputClasses = "w-full px-3 py-2 rounded-lg bg-white/5 border text-white placeholder:text-gray-600 focus:outline-none focus:border-[#46D6C8]/50 focus:ring-1 focus:ring-[#46D6C8]/50 hover:border-[#46D6C8]/30 transition-all hover:shadow-[0_0_15px_rgba(70,214,200,0.1)]";
    const errorClasses = "border-red-500/50 shadow-[0_0_10px_rgba(220,38,38,0.2)]";
    const normalClasses = "border-white/10";

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
            className={`${baseInputClasses} ${hasError ? errorClasses : normalClasses} resize-none overflow-hidden`}
        />
    );
};

const fromISOToText = (iso?: string | null) => {
    if (!iso) return "";
    return new Date(iso).toLocaleString("uk-UA", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).replace(", ", "        ");
};

// Manual input handler
const handleManualDateInput = (value: string, currentIso: string | null, onChange: (iso: string) => void) => {
    // If empty, clear
    if (!value.trim()) {
        onChange("");
        return;
    }

    // If valid ISO date, just use it
    const d = new Date(value);
    if (!isNaN(d.getTime()) && value.includes('T')) {
        onChange(d.toISOString());
        return;
    }

    // Regex for DD.MM.YYYY HH:mm
    const ddmmyyyy = value.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})\s+(\d{1,2}):(\d{1,2})$/);
    if (ddmmyyyy) {
        const [_, day, month, year, hour, minute] = ddmmyyyy;
        const date = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));
        if (!isNaN(date.getTime())) {
            onChange(date.toISOString());
        }
    }
};

const CreateEventForm: React.FC<CreateEventFormProps> = ({ eventData, onChange, handleImageUpload, isEditing = false, loading = false, errors = {} }) => {

    // Time format state
    const { language } = useI18n();
    const [timeFormatMode, setTimeFormatMode] = React.useState<"auto" | "12" | "24">("auto");

    // Determine effective format
    const effective12h = React.useMemo(() => {
        if (timeFormatMode === "auto") {
            return language === "en";
        }
        return timeFormatMode === "12";
    }, [timeFormatMode, language]);

    const [isButtonHovering, setIsButtonHovering] = React.useState(false);
    const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);
    const [isInputFocused, setIsInputFocused] = React.useState(false);
    const [inputValue, setInputValue] = React.useState("");

    // Sync input value with eventData.start_datetime
    // Sync input value with eventData.start_datetime
    useEffect(() => {
        if (!isInputFocused && eventData.start_datetime) {
            const d = new Date(eventData.start_datetime);
            if (effective12h) {
                // MM/DD/YYYY      hh:mm   AM/PM
                const MM = (d.getMonth() + 1).toString().padStart(2, '0');
                const DD = d.getDate().toString().padStart(2, '0');
                const YYYY = d.getFullYear();
                let HH = d.getHours();
                const mm = d.getMinutes().toString().padStart(2, '0');
                const amp = HH >= 12 ? 'PM' : 'AM';
                if (HH > 12) HH -= 12;
                if (HH === 0) HH = 12;
                const hhStr = HH.toString().padStart(2, '0');
                
                setInputValue(`${MM}/${DD}/${YYYY}   ${hhStr}:${mm}      ${amp}`);
            } else {
                // DD.MM.YYYY        HH:mm
                const DD = d.getDate().toString().padStart(2, '0');
                const MM = (d.getMonth() + 1).toString().padStart(2, '0');
                const YYYY = d.getFullYear();
                const HH = d.getHours().toString().padStart(2, '0');
                const mm = d.getMinutes().toString().padStart(2, '0');
                
                setInputValue(`${DD}.${MM}.${YYYY}        ${HH}:${mm}`);
            }
        } else if (!isInputFocused && !eventData.start_datetime) {
            setInputValue("");
        }
    }, [eventData.start_datetime, isInputFocused, effective12h]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        const prevVal = inputValue;

        // Auto-formatting logic
        let formatted = val;
        
        // Allow digits and A/P/M characters if 12h mode
        const cleanVal = effective12h 
            ? val.replace(/[^0-9a-zA-Z]/g, '') 
            : val.replace(/[^\d]/g, '');

        if (val.length >= prevVal.length) {
            if (effective12h) {
                // Custom formatting for 12h to prevent "clumping" and allow AM/PM
                // Expected format: MM/DD/YYYY      hh:mm   AM/PM
                // We construct it step by step
                const digits = cleanVal.replace(/[^\d]/g, '');
                const letters = cleanVal.replace(/[^a-zA-Z]/g, '').toUpperCase();
                
                if (digits.length <= 2) formatted = digits;
                else if (digits.length <= 4) formatted = digits.slice(0, 2) + '/' + digits.slice(2);
                else if (digits.length <= 8) formatted = digits.slice(0, 2) + '/' + digits.slice(2, 4) + '/' + digits.slice(4);
                else if (digits.length <= 10) formatted = digits.slice(0, 2) + '/' + digits.slice(2, 4) + '/' + digits.slice(4, 8) + '   ' + digits.slice(8);
                else formatted = digits.slice(0, 2) + '/' + digits.slice(2, 4) + '/' + digits.slice(4, 8) + '   ' + digits.slice(8, 10) + ':' + digits.slice(10, 12);
                
                // Append AM/PM if we have minutes and letters
                if (digits.length >= 12 && letters.length > 0) {
                     const ap = letters.startsWith('A') ? 'AM' : letters.startsWith('P') ? 'PM' : '';
                     if (ap) formatted += '      ' + ap; // 6 spaces
                }
            } else {
                // Standard 24h
                const digitsOnly = cleanVal.replace(/[^\d]/g, '');
                if (digitsOnly.length <= 2) formatted = digitsOnly;
                else if (digitsOnly.length <= 4) formatted = digitsOnly.slice(0, 2) + '.' + digitsOnly.slice(2);
                else if (digitsOnly.length <= 8) formatted = digitsOnly.slice(0, 2) + '.' + digitsOnly.slice(2, 4) + '.' + digitsOnly.slice(4);
                else if (digitsOnly.length <= 10) formatted = digitsOnly.slice(0, 2) + '.' + digitsOnly.slice(2, 4) + '.' + digitsOnly.slice(4, 8) + '        ' + digitsOnly.slice(8);
                else formatted = digitsOnly.slice(0, 2) + '.' + digitsOnly.slice(2, 4) + '.' + digitsOnly.slice(4, 8) + '        ' + digitsOnly.slice(8, 10) + ':' + digitsOnly.slice(10, 12);
            }
        } else {
            formatted = val;
        }

        setInputValue(formatted);

        // Parse complete date
        // Note: simplified basic check, robust parsing handled by Date.parse usually
        const d = new Date(formatted);
        if (!isNaN(d.getTime()) && formatted.length >= 16) { // Rough check for completeness
             onChange({ target: { name: 'start_datetime', value: d.toISOString() } });
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

    const handleGatheringTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.replace(/[^\d]/g, '');
        if (val.length > 4) val = val.slice(0, 4);
        
        if (val.length > 2) {
            val = val.slice(0, 2) + ':' + val.slice(2);
        }
        
        onChange({ target: { name: 'gathering_time', value: val } });
    };

    const baseInputClasses = "w-full px-3 py-2 rounded-lg bg-white/5 border text-white placeholder:text-gray-600 focus:outline-none focus:border-[#46D6C8]/50 focus:ring-1 focus:ring-[#46D6C8]/50 hover:border-[#46D6C8]/30 transition-all hover:shadow-[0_0_15px_rgba(70,214,200,0.1)]";
    const labelClasses = "text-sm font-medium text-white/80";

    const getInputClass = (fieldName: string) => {
        const hasError = errors[fieldName];
        const errorClasses = "border-red-500/50 shadow-[0_0_10px_rgba(220,38,38,0.2)]";
        const normalClasses = "border-white/10";
        return `${baseInputClasses} ${hasError ? errorClasses : normalClasses}`;
    };

    const handleDurationBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const val = e.target.value.trim();
        if (val && !isNaN(Number(val))) {
            onChange({ target: { name: 'duration', value: `${val} hours` } });
        }
    };

    return (
        <div className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-[#46D6C8] flex items-center gap-2">
                    <Info size={20} className="text-[#46D6C8]" />
                    Основна інформація
                </h3>
                <div className="space-y-2">
                    <Label className={labelClasses}>Назва події (UKR)</Label>
                    <Input
                        name="title_uk"
                        value={eventData.title_uk}
                        onChange={onChange}
                        required
                        required
                        autoComplete="off"
                        className={getInputClass('title_uk')}
                    />
                </div>
                <div className="space-y-2">
                    <Label className={labelClasses}>Короткий опис / Анонс</Label>
                    <AutoResizeTextarea
                        name="description_uk"
                        value={eventData.description_uk}
                        onChange={onChange}
                        placeholder="Яскравий анонс події для залучення гравців..."
                    />
                </div>
            </div>

            <div className="border-b border-white/10" />

            {/* Location & Scenario */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-[#46D6C8] flex items-center gap-2">
                    <MapPin size={20} className="text-[#46D6C8]" />
                    Локація та сценарій
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label className={labelClasses}>Назва полігона (для відображення)</Label>
                        <Input
                            name="location_uk"
                            value={eventData.location_uk}
                            onChange={onChange}
                            required
                            required
                            autoComplete="off"
                            className={getInputClass('location_uk')}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className={labelClasses}>Google Maps URL (Клікабельна точка)</Label>
                        <Input
                            name="map_url"
                            value={eventData.map_url}
                            onChange={onChange}
                            placeholder="https://maps.app.goo.gl/..."
                            autoComplete="off"
                            className={getInputClass('map_url')}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label className={labelClasses}>Деталі гри / Мета</Label>
                    <AutoResizeTextarea
                        name="scenario_uk"
                        value={eventData.scenario_uk}
                        onChange={onChange}
                        rows={5}
                        placeholder="Опис сценарію, елементи гри, умови перемоги..."
                        hasError={errors['scenario_uk']}
                    />
                </div>
                <div className="space-y-2">
                    <Label className={labelClasses}>Правила та техніка безпеки</Label>
                    <AutoResizeTextarea
                        name="rules_uk"
                        value={eventData.rules_uk}
                        onChange={onChange}
                        rows={3}
                        placeholder="Хронометраж, захист очей, 'холодний постріл'..."
                        hasError={errors['rules_uk']}
                    />
                </div>
            </div>

            <div className="border-b border-white/10" />

            {/* Timing & Participants */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-[#46D6C8] flex items-center gap-2">
                    <Clock size={20} className="text-[#46D6C8]" />
                    Таймінг та учасники
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label className={labelClasses}>Час збору</Label>
                        <Input
                            name="gathering_time"
                            value={eventData.gathering_time}
                            onChange={handleGatheringTimeChange}
                            placeholder="09:00"
                            className={getInputClass('gathering_time')}
                            maxLength={5}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className={labelClasses}>Тривалість гри</Label>
                        <Input
                            name="duration"
                            value={eventData.duration}
                            onChange={onChange}
                            placeholder="4 години"
                            className={getInputClass('duration')}
                            onBlur={handleDurationBlur}
                            autoComplete="off"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label className={labelClasses}>Дата та час старту</Label>
                    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                        <PopoverAnchor asChild>
                            <div className="relative flex items-center gap-2 w-full">
                                {/* Overlay hints */}
                                <div
                                    aria-hidden
                                    className="pointer-events-none absolute inset-0 z-[10] flex items-center px-3 text-base font-medium font-mono select-none tracking-wider"
                                    style={{ opacity: 0.78 - overallProgress(inputValue, effective12h) * 0.58 }}
                                >
                                    {effective12h ? (
                                        <div className="flex items-center text-gray-600 whitespace-pre">
                                            <span style={{ opacity: 1 - segmentProgress(inputValue, true).MM }}>mm</span>
                                            <span style={{ opacity: 1 - segmentProgress(inputValue, true).MM }}>/</span>
                                            <span style={{ opacity: 1 - segmentProgress(inputValue, true).DD }}>dd</span>
                                            <span style={{ opacity: 1 - segmentProgress(inputValue, true).DD }}>/</span>
                                            <span style={{ opacity: 1 - segmentProgress(inputValue, true).YYYY }}>yyyy</span>
                                            <span style={{ opacity: 1 - segmentProgress(inputValue, true).YYYY }}>   </span>
                                            <span style={{ opacity: 1 - segmentProgress(inputValue, true).HH }}>hh</span>
                                            <span style={{ opacity: 1 - segmentProgress(inputValue, true).HH }}>:</span>
                                            <span style={{ opacity: 1 - segmentProgress(inputValue, true).mm }}>mm</span>
                                            <span style={{ opacity: 1 - segmentProgress(inputValue, true).mm }}>      </span>
                                            <span style={{ opacity: 1 - segmentProgress(inputValue, true).AMPM }}>am/pm</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center text-gray-600 whitespace-pre">
                                            <span style={{ opacity: 1 - segmentProgress(inputValue, false).DD }}>дд</span>
                                            <span style={{ opacity: 1 - segmentProgress(inputValue, false).DD }}>.</span>
                                            <span style={{ opacity: 1 - segmentProgress(inputValue, false).MM }}>мм</span>
                                            <span style={{ opacity: 1 - segmentProgress(inputValue, false).MM }}>.</span>
                                            <span style={{ opacity: 1 - segmentProgress(inputValue, false).YYYY }}>рррр</span>
                                            <span style={{ opacity: 1 - segmentProgress(inputValue, false).YYYY }}>   </span>
                                            <span style={{ opacity: 1 - segmentProgress(inputValue, false).HH }}>гг</span>
                                            <span style={{ opacity: 1 - segmentProgress(inputValue, false).HH }}>:</span>
                                            <span style={{ opacity: 1 - segmentProgress(inputValue, false).mm }}>хх</span>
                                        </div>
                                    )}
                                </div>
                                <Input
                                    name="start_datetime_display"
                                    value={inputValue}
                                    onChange={handleInputChange}
                                    placeholder=""
                                    className={`${getInputClass('start_datetime')} flex-1 font-mono tracking-wider z-[20] relative text-base`}
                                    onFocus={() => setIsInputFocused(true)}
                                    onBlur={() => setIsInputFocused(false)}
                                    autoComplete="off"
                                />
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="backdrop-blur-md bg-[#04070A]/80 border border-white/10 shadow-[0_0_0_1px_rgba(255,255,255,0.05)] hover:bg-white/10 hover:border-[#46D6C8]/20 transition-colors h-11 w-12 p-0 hover:shadow-[0_0_16px_rgba(70,214,200,0.35)] group cursor-target relative overflow-visible active:scale-90 transition-transform duration-150 shrink-0"
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
                                            nav: "rsf-cal-nav cursor-target",
                                            table: "rsf-cal-table",
                                            head_row: "rsf-cal-head-row",
                                            head_cell: "rsf-cal-head",
                                            row: "rsf-cal-row",
                                            cell: "rsf-cal-cell",
                                            day: "rsf-cal-day cursor-target",
                                            day_selected: "rsf-cal-day rsf-cal-day--sel cursor-target",
                                            day_today: "rsf-cal-day rsf-cal-day--today cursor-target",
                                            day_disabled: "rsf-cal-day rsf-cal-day--dis",
                                        }}
                                        components={{
                                            IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" {...props} />,
                                            IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" {...props} />,
                                        }}
                                    />
                                </div>
                                <div className="px-4 pb-4 flex flex-col gap-2 pt-10">
                                    <div className="text-sm font-medium text-[#46D6C8] text-center mb-2">
                                        Час події
                                    </div>
                                    <div className="flex items-start justify-center gap-2">
                                        {/* Hours Column */}
                                        <div className="flex flex-col items-center gap-3">
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
                                            />
                                    </div>

                                        <div className="pt-6 text-2xl font-bold text-[#46D6C8]/70">:</div>

                                        {/* Minutes Column */}
                                        <div className="flex flex-col items-center">
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
                                        </div>
                                    </div>


                                    <div className="mt-2 text-xs w-[180px] flex flex-col gap-2">
                                         <NeonPopoverList
                                            value={timeFormatMode}
                                            onChange={(v) => setTimeFormatMode(v as "auto" | "12" | "24")}
                                            width={0}
                                            minW={110}
                                            className="w-full text-base h-12 bg-white/5 border border-[#46D6C8]/20"
                                            color="teal"
                                            options={[
                                                { id: "auto", label: "Авто", textColor: "text-neutral-300", hoverColor: "teal" },
                                                { id: "12", label: "12h", textColor: "text-neutral-300", hoverColor: "teal" },
                                                { id: "24", label: "24h", textColor: "text-neutral-300", hoverColor: "teal" }
                                            ]}
                                        />
                                        
                                        {/* AM/PM Switcher moved here */}
                                        {effective12h && (
                                            <div className="inline-flex rounded-lg overflow-hidden ring-1 ring-[#46D6C8]/20 bg-white/5 p-0.5 h-9 items-center w-fit">
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
                                                            className={`px-2 h-full text-xs font-semibold transition rounded-md flex items-center
                                                              ${active
                                                                    ? "bg-[#46D6C8] text-[#04070A]"
                                                                    : "text-gray-400 hover:text-white hover:bg-white/10"}
                                                            `}
                                                        >
                                                            {p}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <Label className={labelClasses}>Ліміт учасників</Label>
                        <Input
                            name="max_players"
                            type="number"
                            value={eventData.max_players}
                            onChange={onChange}
                            placeholder="100"
                            autoComplete="off"
                            className={`${getInputClass('max_players')} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className={labelClasses}>Ціна</Label>
                        <Input
                            name="price_amount"
                            type="number"
                            value={eventData.price_amount}
                            onChange={onChange}
                            placeholder="400"
                            autoComplete="off"
                            className={`${getInputClass('price_amount')} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className={labelClasses}>Валюта</Label>
                        <NeonPopoverList
                            value={eventData.price_currency}
                            onChange={(v) => handleSelectChange('price_currency', v)}
                            width={0}
                            minW={0}
                            className="flex w-full lg:w-full h-10"
                            color="teal"
                            options={[
                                { id: "UAH", label: "UAH", textColor: "text-neutral-300", hoverColor: "teal" },
                                { id: "PLN", label: "PLN", textColor: "text-neutral-300", hoverColor: "teal" },
                                { id: "EUR", label: "EUR", textColor: "text-neutral-300", hoverColor: "teal" }
                            ]}
                        />
                    </div>
                </div>
            </div>

            <div className="border-b border-white/10" />

            {/* Visualization & Amenities */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-[#46D6C8] flex items-center gap-2">
                    <Camera size={20} className="text-[#46D6C8]" />
                    Візуалізація та зручності
                </h3>
                <div className="space-y-2">
                    <ImageUploader
                        label="Фото полігону"
                        currentUrl={eventData.main_image_url}
                        onUpload={handleImageUpload}
                    />
                </div>

                <div className="space-y-3 pt-4 border-t border-white/10">
                    <div className="flex items-center justify-between">
                        <Label className={labelClasses}>Зручності на місці</Label>
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
                                    className={getInputClass('amenities')}
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
            </div>
        </div>
    );
};

export default CreateEventForm;