import { useState, useEffect, useRef } from 'react';
import { Palette } from 'lucide-react';

interface ColorPickerProps {
    label: string;
    hex: string;
    onChange: (hex: string) => void;
}

// Конвертация HSL в HEX
function hslToHex(hsl: string): string {
    // Формат: hsl(122, 39%, 49%) или hsl(122 39% 49%)
    const match = hsl.match(/(\d+(?:\.\d+)?)\s*[,\s]\s*(\d+(?:\.\d+)?)%\s*[,\s]\s*(\d+(?:\.\d+)?)%/);
    if (!match) return '#46D6C8'; // Default Teal
    
    const h = parseFloat(match[1]) / 360;
    const s = parseFloat(match[2]) / 100;
    const l = parseFloat(match[3]) / 100;

    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h * 6) % 2 - 1));
    const m = l - c / 2;

    let r = 0, g = 0, b = 0;

    if (0 <= h && h < 1/6) {
        r = c; g = x; b = 0;
    } else if (1/6 <= h && h < 2/6) {
        r = x; g = c; b = 0;
    } else if (2/6 <= h && h < 3/6) {
        r = 0; g = c; b = x;
    } else if (3/6 <= h && h < 4/6) {
        r = 0; g = x; b = c;
    } else if (4/6 <= h && h < 5/6) {
        r = x; g = 0; b = c;
    } else if (5/6 <= h && h < 1) {
        r = c; g = 0; b = x;
    }

    r = Math.round((r + m) * 255);
    g = Math.round((g + m) * 255);
    b = Math.round((b + m) * 255);

    return `#${[r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('')}`;
}

// Конвертация HEX в HSL
function hexToHsl(hex: string): string {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }

    h = Math.round(h * 360);
    s = Math.round(s * 100);
    l = Math.round(l * 100);

    return `hsl(${h}, ${s}%, ${l}%)`;
}

export default function ColorPicker({ label, hex, onChange }: ColorPickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const pickerRef = useRef<HTMLDivElement>(null);
    
    // Конвертируем HSL в HEX для отображения
    const displayHex = hex.startsWith('#') ? hex : hslToHex(hex);
    
    // Закрываем при клике вне компонента
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
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
    
    // Предустановленные цвета
    const presetColors = [
        '#46D6C8', // Teal
        '#00FF00', // Green
        '#FF7F3B', // Orange
        '#A020F0', // Purple
        '#FF0000', // Red
        '#FFFF00', // Yellow
        '#0000FF', // Blue
        '#FFFFFF', // White
        '#000000', // Black
    ];

    const handleHexChange = (newHex: string) => {
        // Конвертируем HEX в HSL для сохранения
        const hsl = hexToHsl(newHex);
        onChange(hsl);
    };

    return (
        <div className="space-y-2" ref={pickerRef}>
            <label className="text-sm font-medium text-gray-300">{label}</label>
            <div className="flex items-center gap-3">
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setIsOpen(!isOpen)}
                        className="w-12 h-12 rounded-lg border-2 border-white/20 bg-black/40 cursor-pointer hover:border-[#46D6C8]/50 transition-all"
                        style={{ backgroundColor: displayHex }}
                    >
                        <span className="sr-only">Выбрать цвет</span>
                    </button>
                    
                    {isOpen && (
                        <div className="absolute top-full left-0 mt-2 p-4 rounded-lg border border-[#46D6C8]/20 bg-black/90 backdrop-blur-sm z-10 shadow-[0_0_20px_rgba(70,214,200,0.3)]">
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs text-gray-400 mb-1 block">HEX</label>
                                    <input
                                        type="text"
                                        value={displayHex}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            if (/^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                                                if (value.length === 7) {
                                                    handleHexChange(value);
                                                }
                                            }
                                        }}
                                        className="w-24 px-2 py-1 rounded bg-black/40 border border-white/10 text-white text-sm"
                                        placeholder="#46D6C8"
                                    />
                                </div>
                                
                                <div>
                                    <label className="text-xs text-gray-400 mb-2 block">Палитра</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {presetColors.map((color) => (
                                            <button
                                                key={color}
                                                type="button"
                                                onClick={() => handleHexChange(color)}
                                                className="w-8 h-8 rounded border-2 border-white/20 hover:border-[#46D6C8]/50 transition-all"
                                                style={{ backgroundColor: color }}
                                            />
                                        ))}
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="text-xs text-gray-400 mb-2 block">Выбор цвета</label>
                                    <input
                                        type="color"
                                        value={displayHex}
                                        onChange={(e) => handleHexChange(e.target.value)}
                                        className="w-full h-10 rounded cursor-pointer"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                
                <input
                    type="text"
                    value={displayHex}
                    onChange={(e) => {
                        const value = e.target.value;
                        if (/^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                            if (value.length === 7) {
                                handleHexChange(value);
                            }
                        }
                    }}
                    className="flex-1 px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[#46D6C8]/50 focus:ring-1 focus:ring-[#46D6C8]/50 transition-all"
                    placeholder="#46D6C8"
                />
            </div>
        </div>
    );
}

