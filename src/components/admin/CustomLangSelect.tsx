import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';

interface Language {
    code: string;
    name: string;
    display: string;
}

// 🔥 НОВЕ: Назви мов на їхній рідній мові та коди ISO
const languages: Language[] = [
    { code: 'uk', name: 'Українська', display: 'UA Українська' },
    { code: 'ru', name: 'Русский', display: 'RU Русский' },
    { code: 'pl', name: 'Polska', display: 'PL Polska' },
    { code: 'en', name: 'English', display: 'EN English' },
];

interface CustomLangSelectProps {
    value: string;
    onChange: (value: string) => void;
    label?: string;
}

export default function CustomLangSelect({ value, onChange, label }: CustomLangSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedValue, setSelectedValue] = useState(value);
    const dropdownRef = useRef<HTMLDivElement>(null);
    
    // Обновляем локальное состояние при изменении value извне
    useEffect(() => {
        setSelectedValue(value);
    }, [value]);
    
    const selectedLang = languages.find(lang => lang.code === selectedValue) || languages[0];

    // Закрываем dropdown при клике вне его
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleSelect = (langCode: string) => {
        if (langCode !== selectedValue) {
            setSelectedValue(langCode);
            onChange(langCode);
        }
        setIsOpen(false);
    };

    // 🔥 КОЛЬОРОВІ КОНСТАНТИ
    const TEAL_ACCENT = 'bg-[#46D6C8]';
    const TEAL_TEXT_ACCENT = 'text-[#46D6C8]';

    return (
        <div className="space-y-2">
            {label && (
                <label className="text-sm font-medium text-white/80 mb-2 block">
                    {label}
                </label>
            )}
            <div className="relative w-full" ref={dropdownRef}>
                {/* 1. Кнопка, что имитирует поле SELECT (Всегда показывает выбранный язык) */}
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full text-left rounded-lg px-4 py-3 
                               bg-white/5 border border-white/10 
                               text-white flex justify-between items-center 
                               focus:outline-none focus:border-[#46D6C8]/50 focus:ring-1 focus:ring-[#46D6C8]/50
                               hover:border-[#46D6C8]/30 transition-all"
                >
                    <span>{selectedLang.display}</span>
                    {/* Иконка стрелки */}
                    <ChevronDown 
                        className={`h-4 w-4 text-gray-400 transform transition-transform duration-200 ${
                            isOpen ? 'rotate-180' : 'rotate-0'
                        }`} 
                    />
                </button>

                {/* 2. Выпадающее меню (OPTIONS) */}
                {isOpen && (
                    <ul
                        className="absolute z-50 w-full mt-1 rounded-lg 
                                 border border-white/10 
                                 bg-[#04070A] shadow-xl
                                 max-h-60 overflow-y-auto"
                    >
                        {languages.map((lang) => (
                            <li
                                key={lang.code}
                                onClick={() => handleSelect(lang.code)}
                                // 🔥 ФІКС КОНТРАСТУ:
                                // Активний елемент - бірюзовий фон, ЧОРНИЙ текст (для контрасту)
                                className={`px-4 py-2 cursor-pointer transition-colors first:rounded-t-lg last:rounded-b-lg
                                            ${
                                                lang.code === selectedValue
                                                    ? `${TEAL_ACCENT} text-black font-semibold shadow-lg` // Активний: Бірюзовий фон, ЧОРНИЙ текст
                                                    : `text-white hover:bg-white/10 hover:text-white` // Неактивний
                                            }`}
                            >
                                {/* 🔥 ФІКС ТЕКСТУ: Код + Назва мови */}
                                <span className={lang.code === selectedValue ? 'text-black' : TEAL_TEXT_ACCENT}>
                                    {lang.code.toUpperCase()}
                                </span>
                                <span className={`ml-2 ${lang.code === selectedValue ? 'text-black' : 'text-white'}`}>
                                    {lang.name}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

