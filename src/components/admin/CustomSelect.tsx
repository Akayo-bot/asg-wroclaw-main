import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';

interface CustomSelectProps {
    label: string;
    value: string | null;
    onChange: (value: string | null) => void;
    options: Array<{ value: string | null; label: string }>;
    placeholder?: string;
    required?: boolean;
}

export default function CustomSelect({
    label,
    value,
    onChange,
    options,
    placeholder = 'Виберіть опцію',
    required = false
}: CustomSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    
    const selectedOption = options.find(opt => opt.value === value) || null;
    const displayValue = selectedOption ? selectedOption.label : placeholder;
    
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
    
    return (
        <div className="space-y-2">
            <label className="text-sm font-medium text-white/80 block">
                {label}
                {required && <span className="text-[#46D6C8] ml-1">*</span>}
            </label>
            <div className="relative" ref={dropdownRef}>
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className={`w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white flex justify-between items-center focus:outline-none focus:border-[#46D6C8]/50 focus:ring-1 focus:ring-[#46D6C8]/50 hover:border-[#46D6C8]/30 transition-all ${
                        !selectedOption ? 'text-gray-400' : 'text-white'
                    }`}
                >
                    <span className="truncate text-left">{displayValue}</span>
                    <ChevronDown className={`h-4 w-4 text-gray-400 transform transition-transform duration-200 ${isOpen ? 'rotate-180' : 'rotate-0'}`} />
                </button>
                
                {isOpen && (
                    <div className="absolute z-50 w-full mt-1 rounded-lg border border-white/10 bg-[#04070A] shadow-xl max-h-60 overflow-y-auto">
                        {options.map((option) => (
                            <button
                                key={option.value || 'null'}
                                type="button"
                                onClick={() => {
                                    onChange(option.value);
                                    setIsOpen(false);
                                }}
                                className={`w-full text-left px-4 py-2 cursor-pointer transition-colors first:rounded-t-lg last:rounded-b-lg ${
                                    option.value === value
                                        ? 'bg-[#46D6C8] text-black font-semibold shadow-lg'
                                        : 'text-white hover:bg-white/10 hover:text-white'
                                }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

