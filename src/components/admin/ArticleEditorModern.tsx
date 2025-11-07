import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";
import { motion } from "framer-motion";
import * as Lucide from "lucide-react";
import { Calendar1 } from "@/components/Calendar1";

// Icons (local import to avoid CDN fetch)
const {
    Image: ImageIcon,
    Upload,
    Video,
    Link: LinkIcon,
    X,
    Calendar,
    Eye,
    Save,
    SendHorizonal,
    Bold,
    Italic,
    Underline,
    Strikethrough,
    Quote,
    List,
    ListOrdered,
    Link2,
    Undo,
    Redo,
    Heading1,
    Heading2,
    Sparkles,
    ArrowLeft,
    FileText,
    Image,
    Film,
    Settings2,
    Circle,
    ChevronLeft,
    ChevronRight,
    Type,
    BookOpen,
} = Lucide;

// shadcn/ui
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import slugify from "slugify";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { HoloToggleSwitch } from "@/components/admin/HoloToggleSwitch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { NeonPopoverList, NeonOption } from "@/components/admin/NeonPopoverList";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { supabase } from "@/integrations/supabase/client";
import NeonButton from "@/components/NeonButton";
import { useI18n } from "@/contexts/I18nContext";
import OptimizedLottie from "@/components/OptimizedLottie";
import "./AdminNavbarButtons.css";

export type ArticlePayload = {
    title: string;
    preview: string;
    body: string; // HTML string
    category: string;
    mainImageUrl?: string;
    gallery: string[];
    seo: { slug: string; metaDescription?: string };
    schedule?: string | null;
    video?: { kind: "url" | "file"; url?: string; fileUrl?: string } | null;
};

export type ArticleEditorModernProps = {
    initial?: Partial<ArticlePayload>;
    onSubmit?: (data: ArticlePayload) => Promise<void> | void;
    uploadImage?: (file: File) => Promise<string>;
    uploadVideo?: (file: File) => Promise<string>;
    onSaveDraft?: (data: Partial<ArticlePayload>) => Promise<void> | void;
};

function slugifyLocal(input: string) {
    return input
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
}

// Admin panel style
const adminCardStyle =
    "relative overflow-hidden rounded-xl pointer-events-auto touch-auto transform-gpu bg-[#121816]/90 backdrop-blur ring-1 ring-emerald-400/25 animate-fade-in";

const adminCardContent = "relative z-10 p-3 sm:p-4";

const glass =
    "backdrop-blur-md bg-[#0c1111]/60 border border-white/12 " +
    "shadow-[0_0_0_1px_rgba(255,255,255,0.05)] hover:bg-white/8 transition-colors";

const glassInput =
    "cursor-target w-full rounded-xl text-emerald-50 px-3 py-2 outline-none transition-all duration-300 ease-out placeholder:text-emerald-300/40 " +
    "bg-[#0b0f0e]/40 border border-emerald-500/20 " +
    "hover:border-emerald-400/50 hover:bg-[#0f1513]/60 hover:shadow-[0_0_6px_rgba(0,255,180,0.3)] " +
    "focus:border-emerald-400 focus:bg-[#0f1513]/80 focus:shadow-[0_0_10px_rgba(0,255,180,0.45)] focus:outline-none";

// ──────────────────────────────────────────────────────────────────────────────
// IconButtonTip - универсальная обёртка для иконок с подсказкой
// ──────────────────────────────────────────────────────────────────────────────
type IconButtonTipProps = {
    label: string;
    kbd?: string;
    onClick?: (e: React.MouseEvent) => void;
    onMouseDown?: (e: React.MouseEvent) => void;
    children: React.ReactNode;
    disabled?: boolean;
    className?: string;
    ariaLabel?: string;
    isActive?: boolean;
};

function IconButtonTip({
    label,
    kbd,
    onClick,
    onMouseDown,
    children,
    disabled,
    className,
    ariaLabel,
    isActive = false,
}: IconButtonTipProps) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <button
                    type="button"
                    aria-label={ariaLabel ?? label}
                    title={label}
                    onMouseDown={(e) => {
                        e.preventDefault();
                        if (onMouseDown) {
                            onMouseDown(e);
                        } else {
                            onClick?.(e);
                        }
                    }}
                    disabled={disabled}
                    className={`
                        inline-flex h-8 items-center justify-center rounded-lg px-2 
                        border transition-all cursor-target
                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/40
                        disabled:opacity-50 disabled:cursor-not-allowed
                        ${isActive 
                            ? "bg-emerald-500/20 border-emerald-400/40 text-emerald-300" 
                            : "border-emerald-500/25 bg-[#0e1513]/60 text-emerald-100/90 hover:bg-[#121b18] hover:border-emerald-400/45"
                        }
                        ${className ?? ""}
                    `}
                >
                    {children}
                </button>
            </TooltipTrigger>
            <TooltipContent
                side="top"
                className="select-none bg-[#0b0f0e] text-emerald-100 border border-emerald-400/30 shadow-[0_0_20px_rgba(0,255,180,.15)]"
            >
                <div className="flex items-center gap-2">
                    <span>{label}</span>
                    {kbd && (
                        <kbd className="rounded bg-black/40 px-1.5 py-0.5 text-[11px] leading-none text-emerald-200/80 border border-emerald-400/20">
                            {kbd}
                        </kbd>
                    )}
                </div>
            </TooltipContent>
        </Tooltip>
    );
}

// ──────────────────────────────────────────────────────────────────────────────
// Simple Rich Text Editor (contentEditable + execCommand)
// ──────────────────────────────────────────────────────────────────────────────
function RichTextEditor({ value, onChange, onFocus, onBlur }: {
    value: string;
    onChange: (html: string) => void;
    onFocus?: () => void;
    onBlur?: (e: React.FocusEvent<HTMLDivElement>) => void;
}) {
    const ref = useRef<HTMLDivElement | null>(null);
    const blurTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const savedRange = useRef<Range | null>(null);
    const [activeCommands, setActiveCommands] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (ref.current && ref.current.innerHTML !== value) ref.current.innerHTML = value || "";
    }, [value]);

    // Cleanup timeout при размонтировании
    useEffect(() => {
        return () => {
            if (blurTimeoutRef.current) {
                clearTimeout(blurTimeoutRef.current);
            }
        };
    }, []);

    // ——— helpers для выделения и каретки
    const editorRef = ref; // просто читается удобнее

    const inEditor = (node: Node | null) =>
        !!(node && editorRef.current && editorRef.current.contains(node));

    const saveSelection = () => {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0 && inEditor(sel.anchorNode)) {
            savedRange.current = sel.getRangeAt(0).cloneRange();
        }
    };

    const restoreSelection = () => {
        const sel = window.getSelection();
        if (!sel) return;
        
        if (savedRange.current) {
            try {
                // Проверяем, что range все еще валиден
                const range = savedRange.current;
                if (range.startContainer && 
                    editorRef.current &&
                    (editorRef.current.contains(range.startContainer) || range.startContainer === editorRef.current) &&
                    (range.startContainer.nodeType === Node.TEXT_NODE || 
                     range.startContainer.nodeType === Node.ELEMENT_NODE)) {
                    sel.removeAllRanges();
                    sel.addRange(range);
                    return;
                }
            } catch (e) {
                // Range невалиден, создаем новый
                savedRange.current = null;
            }
        }
        
        // Если нет сохраненного выделения или оно невалидно, НЕ создаем курсор в конце
        // Это позволяет сохранить текущее положение курсора
    };

    const focusEditor = () => editorRef.current?.focus();

    const setCaretInto = (el: Node, toEnd = false) => {
        const range = document.createRange();
        const sel = window.getSelection();
        let target: Node = el;
        if ((el as HTMLElement).firstChild) target = (toEnd ? el.lastChild! : el.firstChild!) as Node;
        if (target.nodeType === 3) {
            const len = (target as Text).length;
            range.setStart(target, toEnd ? len : 0);
        } else {
            range.setStart(target, 0);
        }
        range.collapse(true);
        sel?.removeAllRanges();
        sel?.addRange(range);
        savedRange.current = range;
    };

    // Проверка активных команд форматирования
    const updateActiveCommands = () => {
        if (!ref.current) return;
        
        // Небольшая задержка для точного определения состояния команд
        setTimeout(() => {
            if (!ref.current) return;
            
            const commands = new Set<string>();
            const commandsToCheck = ['bold', 'italic', 'underline', 'strikeThrough'];
            
            commandsToCheck.forEach(cmd => {
                try {
                    // Проверяем состояние команды только если редактор в фокусе
                    if (document.activeElement === ref.current) {
                        if (document.queryCommandState(cmd)) {
                            commands.add(cmd);
                        }
                    }
                } catch (e) {
                    // Игнорируем ошибки для некоторых команд
                }
            });

            // Проверка текущего блока
            try {
                if (document.activeElement === ref.current) {
                    const blockTag = document.queryCommandValue('formatBlock')?.toUpperCase();
                    if (blockTag === 'H1' || blockTag === 'H2' || blockTag === 'BLOCKQUOTE') {
                        commands.add(`block-${blockTag}`);
                    } else if (blockTag === 'P' || blockTag === 'DIV' || !blockTag) {
                        // Если это параграф или нет специального блока, не добавляем ничего
                        // Это означает, что ни один блок не активен
                    }
                }
            } catch (e) {
                // Игнорируем ошибки
            }

            setActiveCommands(commands);
        }, 10);
    };

    // Обновление активных команд при изменении выделения
    useEffect(() => {
        const handleSelectionChange = () => {
            if (ref.current && document.activeElement === ref.current) {
                updateActiveCommands();
                saveSelection();
            }
        };

        document.addEventListener('selectionchange', handleSelectionChange);
        return () => document.removeEventListener('selectionchange', handleSelectionChange);
    }, []);

    // Вызываем при любом вводе/клике внутри редактора
    const handleInput = () => {
        onChange(editorRef.current?.innerHTML || "");
        saveSelection();
    };

    // UL/OL: «умный» toggle с фоллбеком
    const toggleList = (kind: "ul" | "ol") => {
        if (!editorRef.current) return;
        
        // Сохраняем текущее выделение ПЕРЕД фокусировкой
        const sel = window.getSelection();
        let currentRange: Range | null = null;
        let selectedText = '';
        let selectedContents: DocumentFragment | null = null;
        
        if (sel && sel.rangeCount > 0 && inEditor(sel.anchorNode)) {
            currentRange = sel.getRangeAt(0).cloneRange();
            const hasSelection = !currentRange.collapsed && currentRange.toString().trim();
            
            if (hasSelection) {
                try {
                    selectedContents = currentRange.cloneContents();
                    selectedText = currentRange.toString();
                } catch (e) {
                    selectedText = currentRange.toString();
                }
            }
            
            // Сохраняем в savedRange
            savedRange.current = currentRange;
        }
        
        // Фокусируем редактор
        focusEditor();
        
        // Небольшая задержка для установки фокуса
        setTimeout(() => {
            if (!editorRef.current) return;
            
            // Восстанавливаем выделение
            if (currentRange) {
                const restoreSel = window.getSelection();
                if (restoreSel) {
                    try {
                        restoreSel.removeAllRanges();
                        restoreSel.addRange(currentRange);
                    } catch (e) {
                        // Если не удалось восстановить, используем текущее выделение
                    }
                }
            }
            
            // Получаем текущее выделение
            const sel = window.getSelection();
            if (!sel || sel.rangeCount === 0) {
                // Если нет выделения, используем сохраненное
                if (currentRange) {
                    try {
                        sel?.removeAllRanges();
                        sel?.addRange(currentRange);
                    } catch (e) {
                        // Игнорируем ошибки
                    }
                }
            }
            
            // Получаем range для работы
            const range = sel && sel.rangeCount > 0 ? sel.getRangeAt(0) : null;
            if (!range) return;
            
            const hasSelection = !range.collapsed && range.toString().trim();
            
            const cmd = kind === "ul" ? "insertUnorderedList" : "insertOrderedList";
            
            // Выполняем команду
            document.execCommand(cmd, false);
            
            // Проверяем результат
            const newSel = window.getSelection();
            
            // Проверяем, попали ли мы внутрь <li>
            let node: Node | null = null;
            if (newSel && newSel.anchorNode) {
                node = newSel.anchorNode;
                if (node.nodeType === 3) node = node.parentNode;
            }
            const li = (node as Element | null)?.closest?.("li");
            
            if (!li || !inEditor(newSel?.anchorNode)) {
                // Если execCommand не создал список, создаем вручную
                // Восстанавливаем исходное выделение
                if (currentRange) {
                    const restoreSel = window.getSelection();
                    if (restoreSel) {
                        try {
                            restoreSel.removeAllRanges();
                            restoreSel.addRange(currentRange);
                        } catch (e) {
                            // Игнорируем ошибки
                        }
                    }
                }
                
                const manualSel = window.getSelection();
                if (manualSel && manualSel.rangeCount > 0) {
                    const manualRange = manualSel.getRangeAt(0);
                    const listItem = document.createElement('li');
                    
                    // Если был выделенный текст, вставляем его
                    if (hasSelection && selectedContents) {
                        listItem.appendChild(selectedContents);
                    } else if (hasSelection && selectedText) {
                        listItem.textContent = selectedText;
                    } else {
                        listItem.innerHTML = '<br>';
                    }
                    
                    const list = document.createElement(kind);
                    list.appendChild(listItem);
                    
                    // Если было выделение, заменяем его списком
                    if (hasSelection) {
                        manualRange.deleteContents();
                        manualRange.insertNode(list);
                    } else {
                        manualRange.insertNode(list);
                    }
                    
                    // Курсор внутрь нового LI
                    setCaretInto(listItem, false);
                }
            } else {
                // Если список создан успешно, сохраняем выделение
                saveSelection();
            }

            onChange(editorRef.current.innerHTML || "");
            saveSelection();
            setTimeout(updateActiveCommands, 0);
        }, 0);
    };

    // Цитата: toggle с unwrap + вставка пустой при курсоре (современный DOM API, без execCommand)
    const toggleQuoteModern = () => {
        // 1) Сначала фокус, затем восстановление сохранённого выделения
        focusEditor();
        restoreSelection();

        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0 || !savedRange.current) return;

        // Работаем с сохранённым диапазоном — он надёжнее в нашем редакторе
        const range: Range = savedRange.current;
        let container: Node = range.commonAncestorContainer;
        if (container.nodeType === 3) {
            container = (container.parentNode as Node);
        }

        // Убеждаемся, что курсор/выделение внутри редактора
        if (!inEditor(container)) return;

        const existing = (container as Element).closest?.("blockquote");

        // Сценарий 1: внутри цитаты — делаем unwrap
        if (existing && inEditor(existing)) {
            const firstChild = existing.firstChild;
            const lastChild = existing.lastChild;

            const frag = document.createDocumentFragment();
            while (existing.firstChild) {
                frag.appendChild(existing.firstChild);
            }
            existing.replaceWith(frag);

            // Восстанавливаем выделение вокруг бывшего содержимого цитаты
            if (firstChild && lastChild) {
                const newRange = document.createRange();
                newRange.setStartBefore(firstChild);
                newRange.setEndAfter(lastChild);
                sel.removeAllRanges();
                sel.addRange(newRange);
                savedRange.current = newRange;
            }

            onChange(editorRef.current?.innerHTML || "");
            saveSelection();
            setTimeout(updateActiveCommands, 0);
            return;
        }

        // Сценарий 2: вне цитаты — добавляем цитату
        if (!range.collapsed) {
            try {
                const blockquote = document.createElement("blockquote");
                // Оборачиваем текущее выделение в <blockquote>
                range.surroundContents(blockquote);
                // Обновляем и сохраняем новое выделение
                const afterSel = window.getSelection();
                if (afterSel) {
                    const newRange = document.createRange();
                    newRange.selectNodeContents(blockquote);
                    afterSel.removeAllRanges();
                    afterSel.addRange(newRange);
                    savedRange.current = newRange;
                }
                onChange(editorRef.current?.innerHTML || "");
                saveSelection();
            } catch (e) {
                // Может не сработать на "рваном" выделении (пересекает несколько блоков)
                console.error("Не удалось обернуть выделение в blockquote:", e);
            }
            setTimeout(updateActiveCommands, 0);
            return;
        }

        // Курсор без выделения — вставляем пустую цитату и ставим курсор внутрь
        const blockquote = document.createElement("blockquote");
        const p = document.createElement("p");
        const br = document.createElement("br");
        p.appendChild(br);
        blockquote.appendChild(p);
        range.insertNode(blockquote);

        setCaretInto(p, false);
        onChange(editorRef.current?.innerHTML || "");
        saveSelection();
        setTimeout(updateActiveCommands, 0);
    };

    // Вставка изображения: URL или локальный файл (data URL)
    const insertImage = () => {
        if (!ref.current) return;
        focusEditor();
        restoreSelection();

        // Предложим 2 варианта: URL или локальный файл
        const choice = window.prompt("Вставити зображення:\n1) Вставте URL і натисніть OK\n2) Або залиште порожнім, щоб вибрати файл");

        const insertImgNode = (src: string) => {
            if (!ref.current) return;
            const sel = window.getSelection();
            if (!sel || sel.rangeCount === 0) {
                const endRange = document.createRange();
                endRange.selectNodeContents(ref.current);
                endRange.collapse(false);
                sel?.removeAllRanges();
                sel?.addRange(endRange);
            }
            const range = sel!.getRangeAt(0);

            const img = document.createElement('img');
            img.src = src;
            img.alt = '';
            img.style.maxWidth = '100%';
            img.style.display = 'inline-block';

            // Вставляем изображение в текущее место каретки
            range.insertNode(img);

            // Переносим каретку ПОСЛЕ изображения
            const after = document.createRange();
            after.setStartAfter(img);
            after.collapse(true);
            sel!.removeAllRanges();
            sel!.addRange(after);

            onChange(ref.current.innerHTML || "");
            saveSelection();
            setTimeout(updateActiveCommands, 0);
        };

        // Если введен URL — используем его сразу
        if (choice && choice.trim()) {
            insertImgNode(choice.trim());
            return;
        }

        // Иначе откроем выбор файла
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = () => {
            const file = input.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => {
                const dataUrl = reader.result as string;
                insertImgNode(dataUrl);
            };
            reader.readAsDataURL(file);
        };
        // Триггерим выбор файла не теряя фокус редактора
        input.click();
    };

    // Безопасная обёртка над execCommand — перед выполнением возвращаем выделение
    const exec = (command: string, valueArg?: string) => {
        if (!ref.current) return;
        
        // Убеждаемся, что редактор в фокусе
        ref.current.focus();
        
        // Небольшая задержка для установки фокуса
        setTimeout(() => {
            if (!ref.current) return;
            
            // Для команд списков используем специальную функцию
            if (command === 'insertUnorderedList' || command === 'insertOrderedList') {
                const kind = command === 'insertUnorderedList' ? 'ul' : 'ol';
                toggleList(kind);
                setTimeout(updateActiveCommands, 0);
                return;
            }
            
            // Для остальных команд восстанавливаем выделение перед выполнением
            restoreSelection();
            
            // Убеждаемся, что выделение валидно
            const sel = window.getSelection();
            if (!sel || sel.rangeCount === 0) {
                // Если нет выделения, создаем курсор в конце
                const range = document.createRange();
                range.selectNodeContents(ref.current);
                range.collapse(false);
                sel?.removeAllRanges();
                sel?.addRange(range);
            } else {
                // Убеждаемся, что выделение внутри редактора
                const range = sel.getRangeAt(0);
                if (!ref.current.contains(range.commonAncestorContainer)) {
                    const newRange = document.createRange();
                    newRange.selectNodeContents(ref.current);
                    newRange.collapse(false);
                    sel.removeAllRanges();
                    sel.addRange(newRange);
                }
            }
            
            // Специальная обработка для removeFormat
            if (command === 'removeFormat') {
                // Сначала очищаем все содержимое поля
                if (ref.current) {
                    ref.current.innerHTML = '';
                    onChange('');
                }
                
                // Снимаем все форматирование
                const formatCommands = ['bold', 'italic', 'underline', 'strikeThrough'];
                formatCommands.forEach(cmd => {
                    try {
                        if (document.queryCommandState(cmd)) {
                            document.execCommand(cmd, false);
                        }
                    } catch (e) {
                        // Игнорируем ошибки
                    }
                });
                
                // Затем снимаем форматирование блока
                try {
                    const formats = ['p', '<p>', 'P'];
                    for (const format of formats) {
                        try {
                            document.execCommand('formatBlock', false, format);
                            break;
                        } catch (e) {
                            continue;
                        }
                    }
                } catch (e) {
                    // Игнорируем ошибки
                }
                
                // Затем выполняем removeFormat для полной очистки
                try {
                    document.execCommand('removeFormat', false);
                } catch (e) {
                    // Игнорируем ошибки
                }
                
                // Явно очищаем все активные команды
                setActiveCommands(new Set());
                
                // Сохраняем выделение
                saveSelection();
            } else {
                // Выполняем команду
                let success = false;
                try {
                    success = document.execCommand(command, false, valueArg);
                } catch (e) {
                    console.warn(`Command ${command} threw error:`, e);
                }
                
                if (!success) {
                    console.warn(`Command ${command} failed with valueArg: ${valueArg}`);
                }
            }
            
            // Обновляем содержимое (для removeFormat уже обновлено выше)
            if (command !== 'removeFormat') {
                onChange(ref.current.innerHTML || "");
            }
            
            // Сохраняем новое выделение
            saveSelection();
            
            // Восстанавливаем фокус
            ref.current.focus();
            
            // Обновляем активные команды с задержкой для removeFormat
            const delay = command === 'removeFormat' ? 50 : 0;
            setTimeout(() => {
                updateActiveCommands();
            }, delay);
        }, 0);
    };

    const setBlock = (tag: "H1" | "H2" | "BLOCKQUOTE" | "P") => {
        if (tag === 'BLOCKQUOTE') {
            toggleBlockquote();
            setTimeout(updateActiveCommands, 0);
            return;
        }
        
        if (!ref.current) return;
        
        // Убеждаемся, что редактор в фокусе
        ref.current.focus();
        
        // Небольшая задержка для установки фокуса
        setTimeout(() => {
            if (!ref.current) return;
            
            // Восстанавливаем выделение
            restoreSelection();
            
            // Проверяем выделение
            const sel = window.getSelection();
            if (!sel || sel.rangeCount === 0) {
                // Если нет выделения, создаем курсор в конце
                const range = document.createRange();
                range.selectNodeContents(ref.current);
                range.collapse(false);
                sel?.removeAllRanges();
                sel?.addRange(range);
            }
            
            // Проверяем текущий блок - если уже установлен этот же блок, снимаем его (toggle)
            try {
                const currentBlock = document.queryCommandValue('formatBlock')?.toUpperCase();
                const tagUpper = tag.toUpperCase();
                
                // Если текущий блок совпадает с тем, что хотим установить, снимаем форматирование
                if (currentBlock === tagUpper || currentBlock === `<${tagUpper}>`) {
                    // Снимаем форматирование, устанавливая параграф
                    const tagLower = 'p';
                    let success = false;
                    const formats = [tagLower, `<${tagLower}>`, 'P'];
                    
                    for (const format of formats) {
                        try {
                            success = document.execCommand('formatBlock', false, format);
                            if (success) break;
                        } catch (e) {
                            continue;
                        }
                    }
                    
                    if (success) {
                        onChange(ref.current.innerHTML || "");
                        saveSelection();
                        ref.current.focus();
                        setTimeout(updateActiveCommands, 0);
                    }
                    return;
                }
            } catch (e) {
                // Игнорируем ошибки при проверке текущего блока
            }
            
            // Для других тегов пробуем разные варианты формата
            const tagLower = tag.toLowerCase();
            let success = false;
            
            const formats = [
                tagLower,           // "h1", "h2", "p"
                `<${tagLower}>`,    // "<h1>", "<h2>", etc.
                tag.toUpperCase(),  // "H1", "H2", etc.
            ];
            
            for (const format of formats) {
                try {
                    success = document.execCommand('formatBlock', false, format);
                    if (success) break;
                } catch (e) {
                    // Пробуем следующий формат
                    continue;
                }
            }
            
            if (!success) {
                console.warn(`Failed to set block ${tag} with all formats`);
            }
            
            // Обновляем содержимое
            onChange(ref.current.innerHTML || "");
            
            // Сохраняем выделение
            saveSelection();
            
            // Восстанавливаем фокус
            ref.current.focus();
            
            // Обновляем активные команды
            setTimeout(updateActiveCommands, 0);
        }, 0);
    };

    // Вставка ссылки
    const makeLink = () => {
        if (!ref.current) return;
        
        restoreSelection();
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0 || sel.toString().trim() === '') {
            alert('Будь ласка, виділіть текст для створення посилання');
            return;
        }
        
        const url = prompt("Вставте URL посилання:");
        if (url && url.trim()) {
            exec("createLink", url.trim());
        }
    };

    const isActive = (command: string) => {
        // Всегда проверяем состояние команды напрямую, а не полагаемся только на кеш
        try {
            if (document.activeElement === ref.current) {
                // Для блочных команд проверяем отдельно
                if (command.startsWith('block-')) {
                    const blockType = command.replace('block-', '');
                    const currentBlock = document.queryCommandValue('formatBlock')?.toUpperCase();
                    return currentBlock === blockType || currentBlock === `<${blockType}>`;
                }
                // Для других команд проверяем состояние напрямую
                return document.queryCommandState(command);
            }
        } catch (e) {
            // Если не удалось проверить, используем кеш
            return activeCommands.has(command);
        }
        // Если редактор не в фокусе, используем кеш
        return activeCommands.has(command);
    };

    // Шорткаты внутри редактора
    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        const isMod = e.ctrlKey || e.metaKey;

        if (isMod && e.key.toLowerCase() === "b") { 
            e.preventDefault(); 
            exec("bold"); 
        }
        if (isMod && e.key.toLowerCase() === "i") { 
            e.preventDefault(); 
            exec("italic"); 
        }
        if (isMod && e.key.toLowerCase() === "u") { 
            e.preventDefault(); 
            exec("underline"); 
        }
        if (isMod && e.key.toLowerCase() === "k") { 
            e.preventDefault(); 
            makeLink(); 
        }

        // нумерованный/маркированный список по привычке (Shift+7/8)
        if (isMod && e.shiftKey && e.key === "8") { 
            e.preventDefault(); 
            toggleList("ul"); 
            setTimeout(updateActiveCommands, 0);
        }
        if (isMod && e.shiftKey && e.key === "7") { 
            e.preventDefault(); 
            toggleList("ol"); 
            setTimeout(updateActiveCommands, 0);
        }

        // undo/redo
        if (isMod && !e.shiftKey && e.key.toLowerCase() === "z") { 
            e.preventDefault(); 
            exec("undo"); 
        }
        if (isMod && e.shiftKey && e.key.toLowerCase() === "z") { 
            e.preventDefault(); 
            exec("redo"); 
        }
    };

    return (
        <div className="space-y-3">
            <TooltipProvider delayDuration={120}>
                <div className="flex flex-wrap gap-1 rounded-xl border border-emerald-400/20 bg-[rgba(21,27,25,0.9)] backdrop-blur-sm p-1 ring-1 ring-emerald-400/10">
                <IconButtonTip 
                    label="Жирний" 
                    kbd="Ctrl/⌘ + B" 
                    onClick={() => exec("bold")}
                    isActive={isActive("bold")}
                >
                    <Bold className="h-4 w-4" />
                </IconButtonTip>

                <IconButtonTip 
                    label="Курсив" 
                    kbd="Ctrl/⌘ + I" 
                    onClick={() => exec("italic")}
                    isActive={isActive("italic")}
                >
                    <Italic className="h-4 w-4" />
                </IconButtonTip>

                <IconButtonTip 
                    label="Підкреслення" 
                    kbd="Ctrl/⌘ + U" 
                    onClick={() => exec("underline")}
                    isActive={isActive("underline")}
                >
                    <Underline className="h-4 w-4" />
                </IconButtonTip>

                <IconButtonTip 
                    label="Закреслення" 
                    onClick={() => exec("strikeThrough")}
                    isActive={isActive("strikeThrough")}
                >
                    <Strikethrough className="h-4 w-4" />
                </IconButtonTip>

                <div className="mx-1 h-6 w-px bg-emerald-400/20" />

                <IconButtonTip 
                    label="Заголовок H1" 
                    onClick={() => setBlock("H1")}
                    isActive={isActive("block-H1")}
                >
                    <Heading1 className="h-4 w-4" />
                </IconButtonTip>

                <IconButtonTip 
                    label="Заголовок H2" 
                    onClick={() => setBlock("H2")}
                    isActive={isActive("block-H2")}
                >
                    <Heading2 className="h-4 w-4" />
                </IconButtonTip>

                <IconButtonTip 
                    label="Цитата" 
                    onMouseDown={(e) => { 
                        e.preventDefault(); 
                        if (editorRef.current && document.activeElement !== editorRef.current) {
                            editorRef.current.focus();
                        }
                        setTimeout(() => toggleQuoteModern(), 0);
                    }}
                    isActive={isActive("block-BLOCKQUOTE")}
                >
                    <Quote className="h-4 w-4" />
                </IconButtonTip>

                <div className="mx-1 h-6 w-px bg-emerald-400/20" />

                <IconButtonTip 
                    label="Маркований список" 
                    kbd="Ctrl/⌘ + Shift + 8" 
                    onMouseDown={(e) => { 
                        e.preventDefault(); 
                        if (editorRef.current && document.activeElement !== editorRef.current) {
                            editorRef.current.focus();
                        }
                        setTimeout(() => toggleList("ul"), 0);
                    }}
                >
                    <List className="h-4 w-4" />
                </IconButtonTip>

                <IconButtonTip 
                    label="Нумерований список" 
                    kbd="Ctrl/⌘ + Shift + 7" 
                    onMouseDown={(e) => { 
                        e.preventDefault(); 
                        if (editorRef.current && document.activeElement !== editorRef.current) {
                            editorRef.current.focus();
                        }
                        setTimeout(() => toggleList("ol"), 0);
                    }}
                >
                    <ListOrdered className="h-4 w-4" />
                </IconButtonTip>

                <IconButtonTip 
                    label="Додати посилання" 
                    kbd="Ctrl/⌘ + K" 
                    onClick={makeLink}
                >
                    <Link2 className="h-4 w-4" />
                </IconButtonTip>

                {/* Кнопку добавления изображения из тулбара удалили по требованию */}

                <div className="mx-1 h-6 w-px bg-emerald-400/20" />

                <IconButtonTip 
                    label="Скасувати" 
                    kbd="Ctrl/⌘ + Z" 
                    onClick={() => exec("undo")}
                >
                    <Undo className="h-4 w-4" />
                </IconButtonTip>

                <IconButtonTip 
                    label="Повторити" 
                    kbd="Ctrl/⌘ + Shift + Z" 
                    onClick={() => exec("redo")}
                >
                    <Redo className="h-4 w-4" />
                </IconButtonTip>

                <div className="mx-1 h-6 w-px bg-emerald-400/20" />

                <IconButtonTip 
                    label="Параграф" 
                    onClick={() => setBlock("P")}
                >
                    <span className="text-[12px] font-semibold">P</span>
                </IconButtonTip>

                <IconButtonTip 
                    label="Очистити форматування" 
                    onClick={() => exec("removeFormat")} 
                    className="px-3"
                >
                    <span className="text-[12px] font-medium">Очистити</span>
                </IconButtonTip>
                </div>
            </TooltipProvider>
            <div
                ref={ref}
                tabIndex={0}
                contentEditable
                suppressContentEditableWarning
                aria-label="Основний текст"
                onInput={handleInput}
                onMouseUp={saveSelection}
                onKeyUp={saveSelection}
                onKeyDown={handleKeyDown}
                onFocus={(e) => {
                    saveSelection();
                    updateActiveCommands();
                    if (blurTimeoutRef.current) {
                        clearTimeout(blurTimeoutRef.current);
                        blurTimeoutRef.current = null;
                    }
                    onFocus?.();
                }}
                onBlur={(e) => {
                    // Очищаем предыдущий timeout если он есть
                    if (blurTimeoutRef.current) {
                        clearTimeout(blurTimeoutRef.current);
                    }
                    
                    // Добавляем задержку, чтобы проверить, куда перешел фокус
                    blurTimeoutRef.current = setTimeout(() => {
                        if (!ref.current) return;

                        const activeElement = document.activeElement as HTMLElement;
                        
                        // Проверяем, не кликнули ли на кнопку панели инструментов
                        // Используем ref для поиска панели инструментов в том же компоненте
                        const toolbarDiv = ref.current.parentElement?.querySelector('.flex.flex-wrap.gap-1.rounded-xl');
                        const isToolbarButton = toolbarDiv?.contains(activeElement) || false;
                        
                        // Проверяем, что фокус действительно ушел с редактора
                        if (!ref.current.contains(activeElement)) {
                            // Проверяем, не перешел ли фокус на другое поле формы
                            const isFormField = activeElement?.tagName === 'TEXTAREA' ||
                                activeElement?.tagName === 'INPUT' ||
                                (activeElement?.contentEditable === 'true' && activeElement !== ref.current);

                            // Если фокус перешел на другое поле формы или на кнопку панели, НЕ вызываем onBlur
                            // В противном случае вызываем onBlur для сброса состояния
                            if (!isFormField && !isToolbarButton) {
                                onBlur?.(e);
                            }
                        }
                        
                        blurTimeoutRef.current = null;
                    }, 100);
                }}
                className={`${glassInput} min-h-[240px] rounded-xl p-3 focus:outline-none focus:glow-focus prose prose-invert max-w-none rich-text-editor`}
            />
        </div>
    );
}

// DateTimeField: локаль → 12/24h, react-day-picker, строгая валидация
function DateTimeField({
    locale = typeof navigator !== "undefined" ? navigator.language : "uk",
    value,
    onChange,
    className = "",
    disabled = false,
}: {
    locale?: string;
    value: string;
    onChange: (iso: string) => void;
    className?: string;
    disabled?: boolean;
}) {
    const isEnglish = /^en(-|$)/i.test(locale);
    const [mode, setMode] = useState<"auto" | "12" | "24">("auto");
    const effective12h = mode === "12" || (mode === "auto" && isEnglish);
    const [selected, setSelected] = useState<Date | undefined>(value ? new Date(value) : undefined);
    const [error, setError] = useState("");

    // Синхронизация selected с value
    useEffect(() => {
        if (value) {
            const d = new Date(value);
            if (!Number.isNaN(d.getTime())) {
                setSelected(d);
            }
        } else {
            setSelected(undefined);
        }
    }, [value]);

    const handleSelect = (day?: Date) => {
        if (!day) return;
        const now = selected ?? new Date();
        const newDate = new Date(day);
        newDate.setHours(now.getHours());
        newDate.setMinutes(now.getMinutes());
        setSelected(newDate);
        onChange(newDate.toISOString());
        setError("");
    };

    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const t = e.target.value;
        const [h, m] = t.split(":").map(Number);
        if (h > 23 || m > 59 || h < 0 || m < 0) {
            setError("Невірний час");
            return;
        }
        if (!selected) {
            const today = new Date();
            today.setHours(h);
            today.setMinutes(m);
            setSelected(today);
            onChange(today.toISOString());
            setError("");
            return;
        }
        const d = new Date(selected);
        d.setHours(h);
        d.setMinutes(m);
        setSelected(d);
        onChange(d.toISOString());
        setError("");
    };

    return (
        <div className={`flex items-center gap-2 relative ${className}`}>
            <div className="flex flex-col items-start gap-2">
                <DayPicker
                    mode="single"
                    selected={selected}
                    onSelect={handleSelect}
                    disabled={disabled}
                    className="rounded-xl border border-white/12 bg-[#0c1111]/90 p-3 shadow-[0_0_24px_rgba(16,185,129,0.15)]"
                />
                <div className="flex items-center gap-2">
                    <Input
                        type="time"
                        value={selected ? `${String(selected.getHours()).padStart(2, "0")}:${String(selected.getMinutes()).padStart(2, "0")}` : ""}
                        onChange={handleTimeChange}
                        disabled={disabled}
                        className={`
              ${glass} h-9 w-32
              hover:shadow-[0_0_14px_rgba(16,185,129,0.18)]
              focus:border-emerald-400 focus:shadow-[0_0_18px_rgba(16,185,129,0.30)]
              ${error ? "border-rose-500/70 shadow-[0_0_20px_rgba(244,63,94,0.35)]" : ""}
            `}
                    />
                    <Select
                        value={mode}
                        onValueChange={(v) => {
                            if (disabled) return;
                            setMode(v as any);
                        }}
                        disabled={disabled}
                    >
                        <SelectTrigger className={`${glass} h-9 w-24 border-emerald-400/30 ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-target"}`}>
                            <SelectValue placeholder="Години" />
                        </SelectTrigger>
                        <SelectContent className="backdrop-blur bg-slate-900/95 border border-white/12 shadow-[0_0_40px_rgba(16,185,129,0.15)]">
                            <SelectItem value="auto" className="cursor-target">Авто</SelectItem>
                            <SelectItem value="24" className="cursor-target">24h</SelectItem>
                            <SelectItem value="12" className="cursor-target">12h</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <Button
                type="button"
                variant="outline"
                disabled={disabled}
                className={`${glass} h-9 w-9 p-0 hover:shadow-[0_0_16px_rgba(16,185,129,0.35)] group cursor-target ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                aria-label="Вибрати дату"
            >
                <Calendar className="h-4 w-4 text-emerald-300 transition-transform duration-200 group-hover:scale-110" />
            </Button>
            {error && <span className="absolute -top-5 left-2 text-sm text-rose-400">{error}</span>}
        </div>
    );
}

// ──────────────────────────────────────────────────────────────────────────────
// TimeWheel компонент для выбора часов и минут
function TimeWheel({
    label,
    value,
    onChange,
    range,   // [min, max]
    pad = false,
    className = "",
}: {
    label: string;
    value?: number;
    onChange: (v: number) => void;
    range: [number, number];
    pad?: boolean;
    className?: string;
}) {
    const [min, max] = range;
    const items = Array.from({ length: max - min + 1 }, (_, i) => min + i);
    const scrollRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<Map<number, HTMLLIElement>>(new Map());

    // Автоматическая прокрутка к выбранному элементу
    useEffect(() => {
        if (value == null || !scrollRef.current) return;
        
        const itemElement = itemRefs.current.get(value);
        if (itemElement) {
            const container = scrollRef.current;
            const itemTop = itemElement.offsetTop;
            const itemHeight = itemElement.offsetHeight;
            const containerHeight = container.clientHeight;
            const scrollPosition = itemTop - (containerHeight / 2) + (itemHeight / 2);
            
            container.scrollTo({
                top: scrollPosition,
                behavior: 'smooth'
            });
        }
    }, [value]);

    // плавная подсветка выбранного
    return (
        <div className={`select-none ${className}`}>
            <div className="text-[11px] mb-1 text-emerald-300/60">{label}</div>
            <div 
                ref={scrollRef}
                className="relative h-36 w-full overflow-y-auto
                            rsf-wheel border border-emerald-400/20 rounded-xl
                            bg-[#0f1513]/80 pl-1 pr-2">
                <ul className="py-2">
                    {items.map((n) => {
                        const active = n === value;
                        return (
                            <li 
                                key={n}
                                ref={(el) => {
                                    if (el) itemRefs.current.set(n, el);
                                    else itemRefs.current.delete(n);
                                }}
                            >
                                <button
                                    type="button"
                                    onClick={() => onChange(n)}
                                    className={`w-full h-8 flex items-center justify-center rounded-md mx-1
                                                transition-all duration-200
                                                ${active
                                            ? "text-emerald-100 font-semibold bg-emerald-500/15 ring-1 ring-emerald-400/40"
                                            : "text-emerald-200/80 hover:bg-white/5 hover:text-emerald-100"}`}
                                >
                                    {pad ? String(n).padStart(2, "0") : n}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </div>
            {/* +/- */}
            <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                    className="rsf-ghost-btn"
                    onClick={() => {
                        if (value == null) return onChange(min);
                        const next = value + 1 > max ? min : value + 1;
                        onChange(next);
                    }}
                >
                    +1
                </button>
                <button
                    className="rsf-ghost-btn"
                    onClick={() => {
                        if (value == null) return onChange(min);
                        const next = value - 1 < min ? max : value - 1;
                        onChange(next);
                    }}
                >
                    -1
                </button>
            </div>
        </div>
    );
}

// ──────────────────────────────────────────────────────────────────────────────
export default function ArticleEditorModern({
    initial,
    onSubmit,
    uploadImage,
    uploadVideo,
    onSaveDraft,
}: ArticleEditorModernProps) {
    const navigate = useNavigate();
    const { language } = useI18n();
    // --- state
    const [title, setTitle] = useState(initial?.title ?? "");
    const [preview, setPreview] = useState(initial?.preview ?? "");
    const [body, setBody] = useState(initial?.body ?? "");
    // Category types
    type CategoryKey = "news" | "tactics" | "equipment" | "game_reports" | "rules";
    const CATEGORY_STYLES = {
        news: { fg: "text-emerald-300", bg: "bg-emerald-500/15", ring: "ring-emerald-400/30", dot: "bg-emerald-400" },
        tactics: { fg: "text-sky-300", bg: "bg-sky-500/15", ring: "ring-sky-400/30", dot: "bg-sky-400" },
        equipment: { fg: "text-violet-300", bg: "bg-violet-500/15", ring: "ring-violet-400/30", dot: "bg-violet-400" },
        game_reports: { fg: "text-rose-300", bg: "bg-rose-500/15", ring: "ring-rose-400/30", dot: "bg-rose-400" },
        rules: { fg: "text-amber-300", bg: "bg-amber-500/15", ring: "ring-amber-400/30", dot: "bg-amber-400" },
    } as const;

    const catCx = (cat: CategoryKey) => {
        const s = CATEGORY_STYLES[cat] ?? CATEGORY_STYLES.news;
        return { ...s, pill: `${s.bg} ${s.fg} ring-1 ${s.ring}` };
    };

    const categoryLabels: Record<CategoryKey, string> = {
        news: "Новини",
        tactics: "Тактика",
        equipment: "Спорядження",
        game_reports: "Звіти з ігор",
        rules: "Правила",
    };

    const [category, setCategory] = useState<CategoryKey>((initial?.category as CategoryKey) ?? "news");
    const [slug, setSlug] = useState(initial?.seo?.slug ?? "");
    const [meta, setMeta] = useState(initial?.seo?.metaDescription ?? "");
    const [scheduleEnabled, setScheduleEnabled] = useState(false);
    const [schedule, setSchedule] = useState("");
    const [timeFormatMode, setTimeFormatMode] = useState<"auto" | "12" | "24">("auto");
    const [scheduleText, setScheduleText] = useState("");
    const [scheduleInputError, setScheduleInputError] = useState("");
    const scheduleInputRef = useRef<HTMLInputElement | null>(null);
    const wasManuallyCleared = useRef(false);
    const [calendarAnimationTrigger, setCalendarAnimationTrigger] = useState(0);
    const [isButtonHovering, setIsButtonHovering] = useState(false);
    const [isInputFocused, setIsInputFocused] = useState(false);
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);

    // Блокировка прокрутки страницы когда открыт календарь
    useLockBodyScroll(isPopoverOpen);

    // Определение формата времени на основе языка
    const isEnglish = /^en(-|$)/i.test(language || "");
    const effective12h = timeFormatMode === "12" || (timeFormatMode === "auto" && isEnglish);

    // Утилиты для работы с датой
    const pad = (n: number) => String(n).padStart(2, "0");
    const toISO = (y: number, m: number, d: number, hh: number, mm: number) =>
        new Date(Date.UTC(y, m - 1, d, hh, mm)).toISOString();

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

    // Конвертация ISO в текст для отображения
    const fromISOToText = (iso?: string | null) => {
        if (!iso) return "";
        const dt = new Date(iso);
        if (Number.isNaN(dt.getTime())) return "";
        const y = dt.getUTCFullYear();
        const m = dt.getUTCMonth() + 1;
        const d = dt.getUTCDate();
        const mm = dt.getUTCMinutes();
        let hh = dt.getUTCHours();
        if (effective12h) {
            const suffix = hh >= 12 ? "PM" : "AM";
            const hh12 = hh % 12 || 12;
            return `${pad(m)}/${pad(d)}/${y}     ${pad(hh12)}:${pad(mm)}   ${suffix}`; // US формат (пять пробелов между годом и временем, три между временем и AM/PM)
        }
        return `${pad(d)}.${pad(m)}.${y}     ${pad(hh)}:${pad(mm)}`; // EU формат (пять пробелов между годом и временем)
    };

    // Синхронизация текста с ISO значением
    // Важно: не восстанавливаем текст, если пользователь явно очистил поле
    useEffect(() => {
        // Если пользователь очистил поле вручную, не восстанавливаем его при переключении формата
        if (wasManuallyCleared.current && !schedule) {
            return;
        }

        // Если поле было очищено вручную, но теперь schedule снова установлен (например, через календарь),
        // сбрасываем флаг и синхронизируем
        if (wasManuallyCleared.current && schedule) {
            wasManuallyCleared.current = false;
        }

        // Синхронизируем формат только если поле не было очищено вручную или schedule установлен
        if (schedule) {
            // Если поле было очищено вручную, не восстанавливаем текст при переключении формата
            if (wasManuallyCleared.current && !scheduleText.trim()) {
                return;
            }
            setScheduleText(fromISOToText(schedule));
        } else {
            // Если schedule пуст и поле не было очищено вручную, очищаем текст
            if (!wasManuallyCleared.current && scheduleText.trim().length > 0) {
                setScheduleText("");
            }
        }
    }, [schedule, effective12h, timeFormatMode, language]);

    // Умное форматирование при вводе для 24h формата: DD.MM.YYYY HH:mm
    const format24hInput = (input: string, cursorPos: number): { formatted: string; newCursorPos: number } => {
        const hasDot = /\./.test(input);
        const hasColon = /:/.test(input);

        const digits = input.replace(/[^\d]/g, '').slice(0, 12);

        if (digits.length === 0) return { formatted: '', newCursorPos: 0 };

        const parts: string[] = [];
        let pos = 0;
        let dayCompleted = false;
        let monthCompleted = false;
        let yearCompleted = false;
        let hoursCompleted = false;

        // День (до 2 цифр)
        if (pos < digits.length) {
            const day = digits.slice(pos, pos + 2);
            const dayNum = parseInt(day) || 0;
            parts.push(dayNum > 31 ? '31' : day);
            pos += day.length;
            if (day.length === 2) {
                dayCompleted = true;
            }
        }

        // Месяц (до 2 цифр)
        if (pos < digits.length) {
            const month = digits.slice(pos, pos + 2);
            const monthNum = parseInt(month) || 0;
            parts.push(monthNum > 12 ? '12' : month);
            pos += month.length;
            if (month.length === 2) {
                monthCompleted = true;
            }
        }

        // Год (до 4 цифр)
        if (pos < digits.length) {
            const year = digits.slice(pos, pos + 4);
            parts.push(year);
            pos += Math.min(4, digits.length - pos);
            if (year.length === 4) {
                yearCompleted = true;
            }
        }

        // Часы (до 2 цифр)
        if (pos < digits.length) {
            const hours = digits.slice(pos, pos + 2);
            const hoursNum = parseInt(hours) || 0;
            parts.push(hoursNum > 23 ? '23' : hours);
            pos += hours.length;
            if (hours.length === 2) {
                hoursCompleted = true;
            }
        }

        // Минуты (до 2 цифр) - проверяем двоеточие
        if (hasColon) {
            const afterColonPart = input.split(':')[1] || '';
            const minutesDigits = afterColonPart.replace(/[^\d]/g, '').slice(0, 2);
            if (minutesDigits.length > 0) {
                const minutesNum = parseInt(minutesDigits) || 0;
                parts.push(minutesNum > 59 ? '59' : minutesDigits);
            }
        } else if (pos < digits.length) {
            const minutes = digits.slice(pos, pos + 2);
            const minutesNum = parseInt(minutes) || 0;
            parts.push(minutesNum > 59 ? '59' : minutes);
        }

        // Формируем результат с разделителями
        let formatted = '';
        let newCursorPos = cursorPos;

        if (parts[0]) {
            formatted += parts[0]; // День
            // Автоматически добавляем точку после 2 цифр дня
            if (dayCompleted && parts[1]) {
                formatted += '.';
            }
        }

        if (parts[1]) {
            formatted += parts[1]; // Месяц
            // Автоматически добавляем точку после 2 цифр месяца
            if (monthCompleted && parts[2]) {
                formatted += '.';
            }
        }

        if (parts[2]) {
            formatted += parts[2]; // Год
            // Автоматически добавляем больший пробел между датой и временем для совпадения с подсказкой
            if (parts[3]) {
                formatted += '     '; // Пять пробелов для совпадения с подсказкой
            }
        }

        if (parts[3]) {
            formatted += parts[3]; // Часы
            // Автоматически добавляем двоеточие после 2 цифр часов
            if (hoursCompleted || hasColon) {
                formatted += ':';
                if (parts[4]) {
                    formatted += parts[4]; // Минуты
                } else if (hoursCompleted && !parts[4] && !hasColon) {
                    // Если введено 2 цифры часов и еще нет минут, перемещаем курсор после двоеточия
                    newCursorPos = formatted.length;
                }
            }
        } else if (parts[4]) {
            // Если есть минуты без часов (не должно быть, но на всякий случай)
            formatted += (formatted ? ':' : '') + parts[4];
        }

        // Корректируем позицию курсора после форматирования
        const digitsBeforeCursor = input.slice(0, cursorPos).replace(/[^\d]/g, '').length;

        // Если автоматически добавили разделители, корректируем позицию
        if (hoursCompleted && !parts[4] && !hasColon) {
            return { formatted, newCursorPos: Math.min(newCursorPos, formatted.length) };
        }

        let digitCount = 0;
        for (let i = 0; i < formatted.length; i++) {
            if (/\d/.test(formatted[i])) digitCount++;
            if (digitCount >= digitsBeforeCursor) {
                newCursorPos = i + 1;
                break;
            }
        }

        return { formatted, newCursorPos: Math.min(newCursorPos, formatted.length) };
    };

    // Умное форматирование при вводе для 12h формата: MM/DD/YYYY hh:mm AM/PM
    const format12hInput = (input: string, cursorPos: number): { formatted: string; newCursorPos: number } => {
        const hasAM = /\bam\b$/i.test(input.trim());
        const hasPM = /\bpm\b$/i.test(input.trim());

        const allDigits = input.replace(/[^\d]/g, '');
        const digits = allDigits.slice(0, 10);

        if (digits.length === 0) {
            const suffix = hasPM ? ' PM' : (hasAM ? ' AM' : '');
            return { formatted: suffix.trim(), newCursorPos: 0 };
        }

        const parts: string[] = [];
        let pos = 0;

        // Месяц (до 2 цифр)
        if (pos < digits.length) {
            const month = digits.slice(pos, pos + 2);
            const monthNum = parseInt(month) || 0;
            parts.push(monthNum > 12 ? '12' : month);
            pos += month.length;
        }

        // День (до 2 цифр)
        if (pos < digits.length) {
            const day = digits.slice(pos, pos + 2);
            const dayNum = parseInt(day) || 0;
            parts.push(dayNum > 31 ? '31' : day);
            pos += day.length;
        }

        // Год (до 4 цифр)
        if (pos < digits.length) {
            parts.push(digits.slice(pos, pos + 4));
            pos += Math.min(4, digits.length - pos);
        }

        // Часы (до 2 цифр)
        let hoursCompleted = false;
        if (pos < digits.length) {
            const hours = digits.slice(pos, pos + 2);
            const hoursNum = parseInt(hours) || 0;
            if (hoursNum > 12) {
                parts.push('12');
                pos += 2;
                hoursCompleted = true;
            } else if (hoursNum === 0 && hours.length === 1) {
                parts.push(hours);
                pos += 1;
            } else {
                parts.push(hours);
                pos += hours.length;
                if (hours.length === 2) {
                    hoursCompleted = true;
                }
            }
        }

        const hasColon = input.includes(':');

        // Минуты (до 2 цифр)
        if (hasColon) {
            const afterColonPart = input.split(':')[1] || '';
            const minutesDigits = afterColonPart.replace(/[^\d]/g, '').slice(0, 2);
            if (minutesDigits.length > 0) {
                const minutesNum = parseInt(minutesDigits) || 0;
                parts.push(minutesNum > 59 ? '59' : minutesDigits);
            }
        } else if (pos < digits.length) {
            const minutes = digits.slice(pos, pos + 2);
            const minutesNum = parseInt(minutes) || 0;
            parts.push(minutesNum > 59 ? '59' : minutes);
        }

        // Формируем результат с разделителями
        let formatted = '';
        let newCursorPos = cursorPos;

        if (parts[0]) formatted += parts[0]; // Месяц
        if (parts[1]) formatted += (formatted ? '/' : '') + parts[1]; // День
        if (parts[2]) formatted += (formatted ? '/' : '') + parts[2]; // Год

        // Время с обязательными разделителями
        if (parts[3]) {
            formatted += (formatted ? '     ' : '') + parts[3]; // Часы (пять пробелов между годом и временем для совпадения с подсказкой)
            if (hoursCompleted || hasColon || parts[4]) {
                formatted += ':';
                if (parts[4]) {
                    formatted += parts[4]; // Минуты
                }

                // Если введено 2 цифры часов и еще нет минут, перемещаем курсор после двоеточия
                if (hoursCompleted && !parts[4] && !hasColon) {
                    newCursorPos = formatted.length;
                }
            }
        }

        // Добавляем AM/PM только если пользователь ввел его явно
        let ampmToAdd = '';
        if (hasColon) {
            const afterColon = input.split(':')[1] || '';
            const letters = afterColon.replace(/[^apm]/gi, '').toUpperCase();

            if (letters.includes('PM') || letters === 'PM') {
                ampmToAdd = '   PM'; // Три пробела для совпадения с mx-3 в подсказке
            } else if (letters.includes('AM') || letters === 'AM') {
                ampmToAdd = '   AM'; // Три пробела для совпадения с mx-3 в подсказке
            } else if (letters.startsWith('P') && letters.length === 1) {
                ampmToAdd = '   P';
            } else if (letters.startsWith('A') && letters.length === 1) {
                ampmToAdd = '   A';
            } else if (letters.includes('P') && letters.includes('M')) {
                ampmToAdd = '   PM';
            } else if (letters.includes('A') && letters.includes('M')) {
                ampmToAdd = '   AM';
            }
        }

        if (!ampmToAdd) {
            if (hasPM) {
                ampmToAdd = '   PM'; // Три пробела для совпадения с mx-3 в подсказке
            } else if (hasAM) {
                ampmToAdd = '   AM'; // Три пробела для совпадения с mx-3 в подсказке
            }
        }

        formatted += ampmToAdd;

        // Корректируем позицию курсора после форматирования
        const digitsBeforeCursor = input.slice(0, cursorPos).replace(/[^\d]/g, '').length;

        if (hoursCompleted && !parts[4] && !hasColon) {
            return { formatted, newCursorPos: Math.min(newCursorPos, formatted.length) };
        }

        if (hasColon && (input.match(/[apm]/i) || ampmToAdd)) {
            newCursorPos = formatted.length;
            return { formatted, newCursorPos: Math.min(newCursorPos, formatted.length) };
        }

        let digitCount = 0;
        for (let i = 0; i < formatted.length; i++) {
            if (/\d/.test(formatted[i])) digitCount++;
            if (digitCount >= digitsBeforeCursor) {
                newCursorPos = i + 1;
                break;
            }
        }

        return { formatted, newCursorPos: Math.min(newCursorPos, formatted.length) };
    };

    // Валидация введенного текста
    const validateScheduleText = (t: string): string | null => {
        if (!t.trim()) return null;
        if (effective12h) {
            // Принимаем один или несколько пробелов между датой и временем, и между временем и AM/PM
            const m = t.match(/^\s*(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})\s+(AM|PM)\s*$/i);
            if (!m) return "Формат: MM/DD/YYYY hh:mm AM/PM";
            const [, MM, DD, YYYY, hhStr, mmStr, ap] = m;
            const month = +MM, day = +DD, year = +YYYY;
            let hh = +hhStr, mm = +mmStr;
            if (month < 1 || month > 12) return "Невірний місяць";
            const lastDay = new Date(year, month, 0).getDate();
            if (day < 1 || day > lastDay) return "Такого дня не існує";
            if (hh < 1 || hh > 12) return "Година 1–12";
            if (mm < 0 || mm > 59) return "Хвилини 00–59";
            if (/pm/i.test(ap) && hh !== 12) hh += 12;
            if (/am/i.test(ap) && hh === 12) hh = 0;
            setSchedule(toISO(year, month, day, hh, mm));
            return null;
        }
        // 24h - принимаем один или несколько пробелов между датой и временем
        const m = t.match(/^\s*(\d{1,2})\.(\d{1,2})\.(\d{4})\s+(\d{1,2}):(\d{2})\s*$/);
        if (!m) return "Формат: DD.MM.YYYY HH:mm";
        const [, DD, MM, YYYY, hhStr, mmStr] = m;
        const day = +DD, month = +MM, year = +YYYY;
        const hh = +hhStr, mm = +mmStr;
        if (month < 1 || month > 12) return "Невірний місяць";
        const lastDay = new Date(year, month, 0).getDate();
        if (day < 1 || day > lastDay) return "Такого дня не існує";
        if (hh < 0 || hh > 23) return "Година 00–23";
        if (mm < 0 || mm > 59) return "Хвилини 00–59";
        setSchedule(toISO(year, month, day, hh, mm));
        return null;
    };

    // Обработчик изменения input для умного форматирования
    const handleScheduleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!scheduleEnabled) {
            e.preventDefault();
            return;
        }

        const input = e.target.value;
        const cursorPos = e.target.selectionStart || 0;

        // Умное форматирование при вводе
        const result = effective12h ? format12hInput(input, cursorPos) : format24hInput(input, cursorPos);

        // Если поле очищено (пустая строка или только пробелы/разделители), очищаем и schedule
        const cleanedResult = result.formatted.trim();
        if (!cleanedResult || cleanedResult.replace(/[^0-9]/g, '').length === 0) {
            setScheduleText("");
            setSchedule("");
            setScheduleInputError("");
            wasManuallyCleared.current = true; // Отмечаем, что пользователь очистил поле вручную
        } else {
            setScheduleText(result.formatted);
            setScheduleInputError("");
            wasManuallyCleared.current = false; // Пользователь вводит данные - сбрасываем флаг
            // Триггерим анимацию календаря при изменении input
            setCalendarAnimationTrigger(prev => prev + 1);
        }

        // Восстанавливаем позицию курсора после форматирования
        setTimeout(() => {
            const inputEl = e.target;
            if (inputEl) {
                const isTypingAMPM = effective12h && input.match(/[apm]/i) && input.includes(':');
                if (isTypingAMPM) {
                    inputEl.setSelectionRange(result.formatted.length, result.formatted.length);
                } else {
                    inputEl.setSelectionRange(result.newCursorPos, result.newCursorPos);
                }
            }
        }, 0);
    };

    // Обработчик нажатия клавиш
    const handleScheduleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!scheduleEnabled) {
            e.preventDefault();
            return;
        }

        const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab', 'Enter', 'Home', 'End'];
        if (allowedKeys.includes(e.key)) return;

        if ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x', 'z'].includes(e.key.toLowerCase())) return;

        if (effective12h) {
            const currentValue = (e.target as HTMLInputElement).value;
            const hasColon = currentValue.includes(':');

            if (hasColon && ['a', 'p', 'm', 'A', 'P', 'M'].includes(e.key)) {
                return;
            }
            if (!hasColon && ['a', 'p', 'm', 'A', 'P', 'M'].includes(e.key)) {
                e.preventDefault();
                return;
            }
        }

        if (e.key.length === 1 && !/\d/.test(e.key)) {
            e.preventDefault();
        }
    };

    // Обработчик blur для валидации
    const handleScheduleBlur = () => {
        if (!scheduleEnabled) return;
        const error = validateScheduleText(scheduleText);
        setScheduleInputError(error || "");
    };

    // Проверка для показа placeholder AM/PM (удалена - больше не используется, т.к. используется оверлей)

    // Динамический placeholder, который исчезает по мере заполнения (удален - больше не используется, т.к. используется оверлей)
    const [mainImageUrl, setMainImageUrl] = useState<string | undefined>(initial?.mainImageUrl);
    const [gallery, setGallery] = useState<string[]>(initial?.gallery ?? []);
    const [videoTab, setVideoTab] = useState<"url" | "file">(initial?.video?.kind ?? "url");
    const [videoUrl, setVideoUrl] = useState(initial?.video?.url ?? "");
    const [videoFileUrl, setVideoFileUrl] = useState(initial?.video?.fileUrl ?? "");
    const [isUploading, setIsUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const galleryInputRef = useRef<HTMLInputElement | null>(null);
    const [hasChanges, setHasChanges] = useState(false);
    const [isTitleFocused, setIsTitleFocused] = useState(false);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [isBodyFocused, setIsBodyFocused] = useState(false);
    const [isPreviewFocused, setIsPreviewFocused] = useState(false);

    // Мемоизируем filterColors для предотвращения пересоздания компонента
    const bodyIconFilterColors = useMemo(() => ({
        primary: "#10b981", // emerald-500
        secondary: "#34d399", // emerald-400
    }), []);

    useEffect(() => {
        if (initial) {
            if (initial.title) setTitle(initial.title);
            if (initial.preview) setPreview(initial.preview);
            if (initial.body) setBody(initial.body);
            if (initial.category) setCategory(initial.category as CategoryKey);
            if (initial.mainImageUrl) setMainImageUrl(initial.mainImageUrl);
            if (initial.gallery) setGallery(initial.gallery);
            if (initial.seo) {
                if (initial.seo.slug) setSlug(initial.seo.slug);
                if (initial.seo.metaDescription) setMeta(initial.seo.metaDescription);
            }
            if (initial.video) {
                setVideoTab(initial.video.kind);
                if (initial.video.url) setVideoUrl(initial.video.url);
                if (initial.video.fileUrl) setVideoFileUrl(initial.video.fileUrl);
            }
            if (initial.schedule) {
                setScheduleEnabled(true);
                setSchedule(initial.schedule);
            }
        }
    }, [initial]);

    // auto-slug (локальный быстрый вариант, не трогаем внешнюю логіку кнопки)
    useEffect(() => {
        if (!slug || slug === slugifyLocal(initial?.title ?? "")) setSlug(slugifyLocal(title));
    }, [title, initial?.title, slug]);

    // Track changes
    useEffect(() => {
        const changed =
            title !== (initial?.title ?? "") ||
            preview !== (initial?.preview ?? "") ||
            body !== (initial?.body ?? "") ||
            category !== (initial?.category ?? "news") ||
            slug !== (initial?.seo?.slug ?? "") ||
            meta !== (initial?.seo?.metaDescription ?? "");
        setHasChanges(changed);
    }, [title, preview, body, category, slug, meta, initial]);

    // ── SEO helpers ────────────────────────────────────────────────────────────
    const metaLen = meta.trim().length;
    const metaStatus: "short" | "optimal" | "long" =
        metaLen === 0 ? "short" : metaLen < 120 ? "short" : metaLen <= 160 ? "optimal" : "long";
    const metaHint =
        metaStatus === "optimal"
            ? "Оптимально"
            : metaStatus === "short"
                ? "Коротко (додай деталей)"
                : "Задовге (скороти)";
    const metaColor =
        metaStatus === "optimal" ? "text-emerald-400" : metaStatus === "short" ? "text-amber-400" : "text-rose-400";

    const normalizeSlug = () => {
        console.log("Нормалізація. Заголовок:", title);
        if (!title || !title.trim()) {
            alert("Спочатку введіть заголовок статті.");
            return;
        }
        const newSlug = slugify(title, {
            lower: true,
            // strict: true, // не використовуємо — щоб не зрізати основу
            remove: /[*+~\.()'"!:@#$?%^&;=]/g,
            locale: 'uk',
        });
        console.log("Новий слаг:", newSlug);
        setSlug(newSlug);
    };

    const generateMeta = () => {
        // Використовуємо короткий опис (Превʼю)
        const shortDescription = preview?.trim() || "";
        if (!shortDescription) {
            alert("Спочатку заповніть поле 'Превʼю / Короткий опис'.");
            return;
        }
        let newDesc = shortDescription.trim();
        if (newDesc.length > 160) {
            newDesc = newDesc.substring(0, 157) + "...";
        }
        setMeta(newDesc);
    };

    const defaultImageUploader = async (file: File): Promise<string> => {
        const fileExt = file.name.split(".").pop();
        const fileName = `${crypto.randomUUID()}-${Date.now()}.${fileExt}`;
        const filePath = `articles/${fileName}`;

        const { error: uploadError } = await supabase.storage.from("media").upload(filePath, file, {
            contentType: file.type,
            upsert: false,
        });

        if (uploadError) throw uploadError;

        const {
            data: { publicUrl },
        } = supabase.storage.from("media").getPublicUrl(filePath);
        // Лог отриманого публічного URL
        console.log('ОТРИМАНИЙ ПУБЛІЧНИЙ URL:', publicUrl);

        return publicUrl;
    };

    const defaultVideoUploader = async (file: File): Promise<string> => {
        const fileExt = file.name.split(".").pop();
        const fileName = `${crypto.randomUUID()}-${Date.now()}.${fileExt}`;
        const filePath = `articles/videos/${fileName}`;

        const { error: uploadError } = await supabase.storage.from("media").upload(filePath, file, {
            contentType: file.type,
            upsert: false,
        });

        if (uploadError) throw uploadError;

        const {
            data: { publicUrl },
        } = supabase.storage.from("media").getPublicUrl(filePath);

        return publicUrl;
    };

    const doUploadImage = uploadImage ?? defaultImageUploader;
    const doUploadVideo = uploadVideo ?? defaultVideoUploader;

    const handleMainImagePick = async (file?: File) => {
        if (!file) return;
        setIsUploading(true);
        try {
            const url = await doUploadImage(file);
            setMainImageUrl(url);
        } catch (error) {
            console.error("Error uploading image:", error);
            alert("Failed to upload image");
        } finally {
            setIsUploading(false);
        }
    };

    // Обработчик выбора файла для главного изображения (очистка ошибок + загрузка)
    const handleMainImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        // Очистим ошибку валидации для изображения
        setFormErrors((prev) => {
            const next = { ...prev };
            delete next.image;
            return next;
        });
        // Сбросим текущий URL (на время загрузки покажем лоадер)
        setMainImageUrl(undefined);
        await handleMainImagePick(file);
    };

    const handleGalleryPick = async (files?: FileList | null) => {
        if (!files?.length) return;
        setIsUploading(true);
        try {
            const urls: string[] = [];
            for (const f of Array.from(files)) urls.push(await doUploadImage(f));
            setGallery((g) => [...g, ...urls]);
        } catch (error) {
            console.error("Error uploading gallery images:", error);
            alert("Failed to upload gallery images");
        } finally {
            setIsUploading(false);
        }
    };

    // Удаление файла из хранилища по публичному URL (bucket 'media')
    const removeMediaByPublicUrl = async (publicUrl: string) => {
        try {
            // Ожидается вид: https://<project>.supabase.co/storage/v1/object/public/media/<path>
            const marker = "/storage/v1/object/public/media/";
            const idx = publicUrl.indexOf(marker);
            if (idx === -1) return;
            const path = publicUrl.substring(idx + marker.length);
            if (!path) return;
            await supabase.storage.from('media').remove([path]);
        } catch (e) {
            console.warn('Failed to remove media from storage:', e);
        }
    };

    const removeGalleryItem = async (idx: number) => {
        setGallery((g) => {
            const url = g[idx];
            if (url) {
                // не await, чтобы UI не блокировался
                removeMediaByPublicUrl(url);
            }
            return g.filter((_, i) => i !== idx);
        });
    };

    const handleVideoFilePick = async (file?: File) => {
        if (!file) return;
        setIsUploading(true);
        try {
            const url = await doUploadVideo(file);
            setVideoFileUrl(url);
        } catch (error) {
            console.error("Error uploading video:", error);
            alert("Failed to upload video");
        } finally {
            setIsUploading(false);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith("image/")) {
            handleMainImagePick(file);
        }
    };

    const payload: ArticlePayload = useMemo(
        () => ({
            title,
            preview,
            body,
            category,
            mainImageUrl,
            gallery,
            seo: { slug, metaDescription: meta },
            schedule: scheduleEnabled && schedule ? schedule : null,
            video:
                videoTab === "url"
                    ? videoUrl
                        ? { kind: "url", url: videoUrl }
                        : null
                    : videoFileUrl
                        ? { kind: "file", fileUrl: videoFileUrl }
                        : null,
        }),
        [title, preview, body, category, mainImageUrl, gallery, slug, meta, scheduleEnabled, schedule, videoTab, videoUrl, videoFileUrl]
    );

    const saveDraft = async () => await onSaveDraft?.(payload);

    const validateForm = (): boolean => {
        const errs: Record<string, string> = {};
        if (!title || title.trim() === "") errs.title = "Заголовок не може бути порожнім";
        if (!preview || preview.trim() === "") errs.shortDescription = "Короткий опис обов'язковий";
        if (!slug || slug.trim() === "") errs.slug = "Slug обов'язковий (спробуйте 'Нормалізувати')";
        if (!category) errs.category = "Будь ласка, виберіть категорію";
        if (!mainImageUrl) errs.image = "Головне зображення обов'язкове";
        // Перевірка основного тексту
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(body || "", "text/html");
            const plain = (doc.body.textContent || "").replace(/\s\s+/g, " ").trim();
            if (!plain || plain.length < 20) errs.content = "Основний текст занадто короткий";
        } catch {
            const plain = (body || "").replace(/<[^>]*>?/gm, '').trim();
            if (!plain || plain.length < 20) errs.content = "Основний текст занадто короткий";
        }
        setFormErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handlePublish = async (e?: React.MouseEvent) => {
        e?.preventDefault();
        const ok = validateForm();
        if (!ok) {
            console.warn("Форма не пройшла валідацію. Помилки:", formErrors);
            alert("Будь ласка, виправте помилки у формі");
            return;
        }
        setFormErrors({});
        if (onSubmit) {
            await onSubmit(payload);
            return;
        }
        // Fallback: FormData відправка (multipart/form-data)
        try {
            const fd = new FormData();
            fd.append('title', title);
            fd.append('slug', slug);
            fd.append('shortDescription', preview);
            fd.append('content', body);
            fd.append('category', category);
            if (mainImageUrl) fd.append('mainImageUrl', mainImageUrl);
            if (gallery.length) fd.append('gallery', JSON.stringify(gallery));
            fd.append('seoMetaDescription', meta);
            if (scheduleEnabled) fd.append('schedule', schedule || '');
            if (videoTab === 'url' && videoUrl) fd.append('videoUrl', videoUrl);
            if (videoTab === 'file' && videoFileUrl) fd.append('videoFileUrl', videoFileUrl);

            const res = await fetch('/api/articles', {
                method: 'POST',
                body: fd,
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || 'Failed to save article');
            }
            alert('Стаття успішно збережена!');
        } catch (err: any) {
            console.error('Помилка сервера:', err);
            alert(err.message || 'Failed to save article');
        }
    };

    // запрет прошедших публикаций: минимум через 5 минут
    const scheduleError = useMemo(() => {
        if (!scheduleEnabled) return "";
        if (!schedule) return ""; // Убираем отсюда, показываем отдельно желтым
        const dt = new Date(schedule);
        if (Number.isNaN(dt.getTime())) return "Невірний формат дати";
        const now = new Date();
        const marginMs = 5 * 60 * 1000; // можно поменять
        if (dt.getTime() < now.getTime() + marginMs) return "Час публікації має бути в майбутньому (≥ 5 хв)";
        return "";
    }, [scheduleEnabled, schedule]);

    const publishDisabled = !!scheduleError && scheduleEnabled;

    // ───────────────── UI – Admin Panel Style ──────────────────
    return (
        <div className="mx-auto max-w-[1400px] xl:max-w-[1500px] px-3 sm:px-4 md:px-5 xl:px-8 py-4 sm:py-5 md:py-6 bg-[var(--adm-bg)] min-h-screen">
            <main
                id="app-main"
                className="relative z-[40] space-y-4 sm:space-y-5 md:space-y-6 lg:space-y-8 pointer-events-auto touch-auto isolate lg:-translate-x-[120px]"
            >
                {/* Back Button - отдельно */}
                <div className="pointer-events-auto mb-3">
                    <button
                        onClick={() => navigate("/admin/articles")}
                        type="button"
                        className="rsf-cta group flex items-center gap-2 px-4 py-2 cursor-target pointer-events-auto touch-auto"
                    >
                        <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1 group-active:-translate-x-0.5 glowing-icon" />
                        <span className="glowing-txt">
                            Н<span className="faulty-letter">а</span>зад до стат<span className="faulty-letter">е</span>й
                        </span>
                    </button>
                </div>

                {/* Quick Actions - Сохранить, Опубликовать и Запланировать */}
                <div className="mb-4 sm:mb-5 md:mb-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 pointer-events-auto">
                    <Button
                        onClick={saveDraft}
                        disabled={isUploading || !hasChanges}
                        className={`
                            group relative h-11 sm:h-9 px-4 sm:px-4 rounded-xl font-medium
                            bg-[#0b1110]/80 text-emerald-50
                            ring-1 ring-emerald-400/25
                            shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]
                            transition-all duration-200
                            hover:bg-[#0f1715]/90
                            hover:shadow-[0_0_14px_rgba(0,255,180,0.25)]
                            hover:ring-emerald-400/50
                            focus-visible:ring-2 focus-visible:ring-emerald-400/40
                            active:scale-[0.98]
                            disabled:opacity-60 disabled:cursor-not-allowed
                            cursor-target flex-1 sm:flex-initial
                        `}
                    >
                        <Save className="h-5 w-5 sm:h-4 sm:w-4 mr-2 text-emerald-300 group-hover:text-emerald-200 transition-all duration-300 group-hover:translate-y-[2px] group-hover:scale-110 group-active:translate-y-[3px] group-active:scale-100" />
                        <span className="text-sm sm:text-base">Зберегти чернетку</span>
                    </Button>
                    <Button
                        onClick={handlePublish}
                        disabled={isUploading || publishDisabled}
                        aria-label="Опублікувати статтю"
                        className={`
                            btn-back group relative z-0 h-11 sm:h-9 px-5 sm:px-5 cursor-target
                            flex-1 sm:flex-initial
                            disabled:opacity-60 disabled:cursor-not-allowed
                        `}
                    >
                        <SendHorizonal
                            className="h-5 w-5 sm:h-4 sm:w-4 mr-2 transition-all duration-300
                                       group-hover:translate-x-[3px]
                                       group-active:translate-x-[1px]"
                        />
                        <span className="text-sm sm:text-base">
                            Опублікувати
                        </span>
                    </Button>

                    {/* Запланувати */}
                    <div
                        className={`
              sm:ml-auto relative flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2 rounded-xl px-3 sm:px-3 py-2 sm:py-1.5 w-full sm:w-auto
              ${scheduleEnabled ? 'ring-1 ring-emerald-400/40 shadow-[0_0_18px_rgba(0,255,180,0.18)]' : ''}
              ${!scheduleEnabled ? 'opacity-80' : ''}
              bg-white/5 border border-white/10
            `}
                    >
                        <HoloToggleSwitch
                            id="schedule"
                            checked={scheduleEnabled}
                            onCheckedChange={setScheduleEnabled}
                        />
                        <Label htmlFor="schedule" className="text-sm cursor-pointer whitespace-nowrap">Запланувати</Label>
                        <div className="relative flex-1 min-w-0 w-full">
                            {/* Оверлей-подсказка СВЕРХУ */}
                            {scheduleEnabled && (
                                <div
                                    aria-hidden
                                    className="pointer-events-none absolute inset-0 z-[61] flex items-center px-3 text-base font-medium font-mono select-none tracking-wider"
                                    style={{ opacity: 0.78 - overallProgress(scheduleText, effective12h) * 0.58 }}
                                >
                                    {effective12h ? (
                                        <div className="flex items-center text-emerald-200/65 drop-shadow-[0_0_6px_rgba(16,185,129,0.25)] whitespace-pre">
                                            <span style={{ opacity: 1 - segmentProgress(scheduleText, true).MM }}>MM</span>
                                            <span>/</span>
                                            <span style={{ opacity: 1 - segmentProgress(scheduleText, true).DD }}>DD</span>
                                            <span>/</span>
                                            <span style={{ opacity: 1 - segmentProgress(scheduleText, true).YYYY }}>YYYY</span>
                                            <span className="mx-4"> </span>
                                            <span style={{ opacity: 1 - segmentProgress(scheduleText, true).HH }}>hh</span>
                                            <span>:</span>
                                            <span style={{ opacity: 1 - segmentProgress(scheduleText, true).mm }}>mm</span>
                                            <span className="mx-2"> </span>
                                            <span style={{ opacity: 1 - segmentProgress(scheduleText, true).AMPM }}>AM/PM</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center text-emerald-200/65 drop-shadow-[0_0_6px_rgba(16,185,129,0.25)] whitespace-pre">
                                            <span style={{ opacity: 1 - segmentProgress(scheduleText, false).DD }}>дд</span>
                                            <span>.</span>
                                            <span style={{ opacity: 1 - segmentProgress(scheduleText, false).MM }}>мм</span>
                                            <span>.</span>
                                            <span style={{ opacity: 1 - segmentProgress(scheduleText, false).YYYY }}>рррр</span>
                                            <span className="mx-4"> </span>
                                            <span style={{ opacity: 1 - segmentProgress(scheduleText, false).HH }}>гг</span>
                                            <span>:</span>
                                            <span style={{ opacity: 1 - segmentProgress(scheduleText, false).mm }}>хх</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Сам инпут — ПРОЗРАЧНЫЙ и без blur */}
                            <Input
                                ref={scheduleInputRef}
                                type="text"
                                id="schedule-input"
                                disabled={!scheduleEnabled}
                                value={scheduleText}
                                onChange={handleScheduleInputChange}
                                onKeyDown={handleScheduleKeyDown}
                                onBlur={(e) => {
                                    handleScheduleBlur();
                                    setIsInputFocused(false);
                                }}
                                onFocus={() => setIsInputFocused(true)}
                                placeholder=""
                                className={`
                  ${glass} !bg-transparent !backdrop-blur-0 relative z-[60] text-emerald-50 h-10 sm:h-9 w-full sm:w-64 md:w-80 font-mono tracking-wider text-sm sm:text-base
                  focus-visible:ring-0 focus:outline-none
                  border-emerald-400/30
                  hover:shadow-[0_0_12px_rgba(0,255,180,0.15)]
                  focus:border-emerald-400 focus:shadow-[0_0_16px_rgba(0,255,180,0.28)]
                  ${scheduleEnabled && !schedule && !scheduleInputError ? 'border-amber-400/70 shadow-[0_0_16px_rgba(245,158,11,0.35)]' : ''}
                  ${scheduleInputError ? '!border-rose-500/70 !shadow-[0_0_16px_rgba(244,63,94,0.35)]' : ''}
                `}
                            />
                        </div>
                        {/* Popover с календарем под иконкой */}
                        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className={`${glass} h-9 w-9 p-0 hover:shadow-[0_0_16px_rgba(0,255,180,0.35)] group cursor-target relative overflow-visible active:scale-90 transition-transform duration-150`}
                                    disabled={!scheduleEnabled}
                                    aria-label="Вибрати дату"
                                    onMouseEnter={() => setIsButtonHovering(true)}
                                    onMouseLeave={() => setIsButtonHovering(false)}
                                    onClick={() => {
                                        setCalendarAnimationTrigger(prev => prev + 1);
                                    }}
                                >
                                    <div
                                        className="relative w-5 h-5 flex items-center justify-center overflow-visible"
                                        style={{ pointerEvents: 'auto' }}
                                        onMouseEnter={(e) => e.stopPropagation()}
                                        onMouseLeave={(e) => e.stopPropagation()}
                                    >
                                        {/* Анимированный компонент календаря Calendar1 */}
                                        <Calendar1
                                            width={20}
                                            height={20}
                                            strokeWidth={2}
                                            stroke="currentColor"
                                            className="w-5 h-5 text-white transition-colors duration-300 group-hover:text-emerald-400"
                                            triggerAnimation={calendarAnimationTrigger}
                                            isHoveringExternal={isButtonHovering}
                                            isFocused={isInputFocused}
                                            isPopoverOpen={isPopoverOpen}
                                        />
                                    </div>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent
                                className="w-auto p-0 bg-[#0b0f0e]/95 backdrop-blur border border-emerald-400/20 rounded-2xl shadow-[0_0_40px_rgba(0,255,180,0.12)]"
                                align="end"
                                side="bottom"
                                sideOffset={10}
                            >
                                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-0">
                                    {/* Календарь */}
                                    <div className="p-3 md:p-4">
                                        <DayPicker
                                            mode="single"
                                            selected={schedule ? new Date(schedule) : undefined}
                                            onSelect={(day) => {
                                                if (!day) return;
                                                const cur = schedule ? new Date(schedule) : new Date();
                                                const d = new Date(day);
                                                d.setHours(cur.getHours(), cur.getMinutes(), 0, 0);
                                                const iso = d.toISOString();
                                                setSchedule(iso);
                                                setScheduleText(fromISOToText(iso));
                                            }}
                                            weekStartsOn={1}
                                            disabled={(day) => {
                                                const t = new Date();
                                                t.setHours(0, 0, 0, 0);
                                                return day < t; // без прошлого
                                            }}
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

                                    {/* Время / 12–24h */}
                                    <div className="px-3 md:px-4 pb-4 flex flex-col gap-3 md:gap-4">
                                        <div className="text-xs text-emerald-300/70 pt-3 md:pt-4">
                                            Час публікації
                                        </div>

                                        <div className="flex items-end gap-4">
                                            {/* Колёсики часов/минут */}
                                            <TimeWheel
                                                label={effective12h ? "Hours" : "Години"}
                                                value={schedule ? (effective12h
                                                    ? (() => {
                                                        const h = new Date(schedule).getHours();
                                                        return h === 0 ? 12 : h > 12 ? h - 12 : h;
                                                    })()
                                                    : new Date(schedule).getHours())
                                                    : undefined}
                                                onChange={(h) => {
                                                    const base = schedule ? new Date(schedule) : new Date();
                                                    if (effective12h) {
                                                        // Для 12h формата учитываем текущий AM/PM
                                                        const currentH = base.getHours();
                                                        const isPM = currentH >= 12;
                                                        const newHour = h === 12
                                                            ? (isPM ? 12 : 0)
                                                            : (isPM ? h + 12 : h);
                                                        base.setHours(newHour);
                                                    } else {
                                                        base.setHours(h);
                                                    }
                                                    const iso = base.toISOString();
                                                    setSchedule(iso);
                                                    setScheduleText(fromISOToText(iso));
                                                }}
                                                range={effective12h ? [1, 12] : [0, 23]}
                                                pad
                                                className="w-24"
                                                key={effective12h ? `hours-12h-${schedule}` : `hours-24h-${schedule}`}
                                            />
                                            <div className="pb-8 text-emerald-300/70">:</div>
                                            <TimeWheel
                                                label="Хвилини"
                                                value={schedule ? new Date(schedule).getMinutes() : undefined}
                                                onChange={(m) => {
                                                    const base = schedule ? new Date(schedule) : new Date();
                                                    base.setMinutes(m);
                                                    const iso = base.toISOString();
                                                    setSchedule(iso);
                                                    setScheduleText(fromISOToText(iso));
                                                }}
                                                range={[0, 59]}
                                                pad
                                                className="w-24"
                                            />

                                            {/* AM/PM для 12h */}
                                            {effective12h && (
                                                <div className="flex flex-col items-start">
                                                    <div className="text-[11px] mb-1 text-emerald-300/60">АМ/РМ</div>
                                                    <div className="inline-flex rounded-xl overflow-hidden ring-1 ring-emerald-400/20">
                                                        {(["AM", "PM"] as const).map((p) => {
                                                            const curH = schedule ? new Date(schedule).getHours() : 0;
                                                            const active = (p === "AM" && curH < 12) || (p === "PM" && curH >= 12);
                                                            return (
                                                                <button
                                                                    key={p}
                                                                    onClick={() => {
                                                                        const d = schedule ? new Date(schedule) : new Date();
                                                                        const h = d.getHours();
                                                                        if (p === "AM" && h >= 12) d.setHours(h - 12);
                                                                        if (p === "PM" && h < 12) d.setHours(h + 12);
                                                                        const iso = d.toISOString();
                                                                        setSchedule(iso);
                                                                        setScheduleText(fromISOToText(iso));
                                                                    }}
                                                                    className={`px-3 py-2 text-sm transition
                                                                      ${active
                                                                            ? "bg-emerald-500/20 text-emerald-100"
                                                                            : "bg-white/5 text-emerald-200/80 hover:bg-white/8"}
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

                                        {/* Быстрые кнопки */}
                                        <div className="flex gap-2 pt-1">
                                            <button
                                                onClick={() => {
                                                    const d = new Date();
                                                    d.setMinutes(d.getMinutes() + 15, 0, 0);
                                                    const iso = d.toISOString();
                                                    setSchedule(iso);
                                                    setScheduleText(fromISOToText(iso));
                                                }}
                                                className="rsf-ghost-btn"
                                            >
                                                +15 хв
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const d = new Date();
                                                    d.setHours(12, 0, 0, 0);
                                                    const iso = d.toISOString();
                                                    setSchedule(iso);
                                                    setScheduleText(fromISOToText(iso));
                                                }}
                                                className="rsf-ghost-btn"
                                            >
                                                Сьогодні 12:00
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const d = new Date();
                                                    d.setDate(d.getDate() + 1);
                                                    d.setHours(9, 0, 0, 0);
                                                    const iso = d.toISOString();
                                                    setSchedule(iso);
                                                    setScheduleText(fromISOToText(iso));
                                                }}
                                                className="rsf-ghost-btn"
                                            >
                                                Завтра 09:00
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>
                        <Select
                            value={timeFormatMode}
                            onValueChange={(v) => setTimeFormatMode(v as "auto" | "12" | "24")}
                            disabled={!scheduleEnabled}
                        >
                            <SelectTrigger className={`${glass} h-10 sm:h-9 w-full sm:w-24 border-emerald-400/30 text-sm sm:text-base ${!scheduleEnabled ? "opacity-50 cursor-not-allowed" : "cursor-target"}`}>
                                <SelectValue placeholder="Години">
                                    {timeFormatMode === "auto"
                                        ? (effective12h ? "12h (Авто)" : "24h (Авто)")
                                        : timeFormatMode === "12"
                                            ? "12h"
                                            : "24h"}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent className="backdrop-blur bg-slate-900/95 border border-white/12 shadow-[0_0_40px_rgba(16,185,129,0.15)]">
                                <SelectItem value="auto" className="cursor-target">
                                    Авто {effective12h ? "(12h)" : "(24h)"}
                                </SelectItem>
                                <SelectItem value="24" className="cursor-target">24h</SelectItem>
                                <SelectItem value="12" className="cursor-target">12h</SelectItem>
                            </SelectContent>
                        </Select>
                        {/* Желтое предупреждение - когда включено, но дата не указана */}
                        {scheduleEnabled && !schedule && !scheduleInputError && (
                            <span className="absolute -top-6 sm:-top-6 left-2 text-xs sm:text-[13px] font-medium z-10 break-words" style={{ color: 'rgb(251, 191, 36)', textShadow: '0 0 8px rgba(245, 158, 11, 0.6)' }}>
                                Вкажіть дату та час
                            </span>
                        )}
                        {/* Розовые ошибки - валидация или другие ошибки */}
                        {scheduleEnabled && scheduleInputError && (
                            <span className="absolute -top-6 sm:-top-6 left-2 text-xs sm:text-[13px] text-rose-500 font-medium z-10 drop-shadow-[0_0_4px_rgba(244,63,94,0.5)] break-words">{scheduleInputError}</span>
                        )}
                        {scheduleEnabled && schedule && scheduleError && (
                            <span className="absolute -top-6 sm:-top-6 left-2 text-xs sm:text-[13px] text-rose-500 font-medium z-10 drop-shadow-[0_0_4px_rgba(244,63,94,0.5)] break-words">{scheduleError}</span>
                        )}
                    </div>
                </div>

                {/* Status Bar */}
                {hasChanges && (
                    <span className="relative inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs ring-1 transition-colors bg-yellow-500/10 text-yellow-300 ring-yellow-400/30 animate-fade-in leading-none">
                        <Circle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-pulse shrink-0" />
                        <span className="leading-none pl-5">Незбережені зміни</span>
                    </span>
                )}

                <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                    {/* Left column */}
                    <div className="space-y-5 lg:col-span-2">
                        {/* Title */}
                        <section className={adminCardStyle}>
                            <span className="pointer-events-none absolute left-0 top-0 h-full w-[3px] bg-[var(--adm-bar)]" />
                            <div className={adminCardContent}>
                                <header className="flex items-center gap-2 border-b border-emerald-400/10 pb-0.5 mb-3">
                                    <div className="relative h-12 w-12 flex items-center justify-center overflow-visible" style={{ minWidth: '3rem', minHeight: '3rem' }}>
                                        <OptimizedLottie
                                            src="/lottie/Address-Book.json"
                                            className="h-12 w-12 rsf-lottie-emerald"
                                            autoplay={isTitleFocused}
                                            loop={isTitleFocused}
                                        />
                                    </div>
                                    <h3 className="text-[16px] font-semibold text-emerald-100">Заголовок статті</h3>
                                </header>
                                <Input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    onFocus={() => {
                                        // Сбрасываем состояние других полей при активации этого поля
                                        setIsBodyFocused(false);
                                        setIsPreviewFocused(false);
                                        setIsTitleFocused(true);
                                    }}
                                    onBlur={(e) => {
                                        // Добавляем задержку, чтобы проверить, куда перешел фокус
                                        setTimeout(() => {
                                            const activeElement = document.activeElement as HTMLElement;
                                            
                                            // Если фокус перешел на кнопку панели инструментов редактора, не сбрасываем
                                            const toolbarDiv = document.querySelector('.flex.flex-wrap.gap-1.rounded-xl.border.border-emerald-400\\/20');
                                            const isToolbarButton = toolbarDiv?.contains(activeElement) || false;
                                            
                                            // Проверяем, не перешел ли фокус на другое поле формы
                                            const isFormField = activeElement?.tagName === 'TEXTAREA' ||
                                                activeElement?.tagName === 'INPUT' ||
                                                (activeElement?.contentEditable === 'true');
                                            
                                            // Сбрасываем состояние только если фокус не на кнопке панели и не на другом поле формы
                                            if (!isFormField && !isToolbarButton) {
                                                setIsTitleFocused(false);
                                            }
                                        }, 100);
                                    }}
                                    placeholder="Введіть заголовок..."
                                    className={`${glassInput} h-11 rounded-xl px-3 text-[15px] focus:glow-focus ${formErrors.title ? '!ring-rose-500/70 !border-rose-500/70' : ''}`}
                                />
                                {formErrors.title && (
                                    <p className="mt-1 text-xs text-rose-400">{formErrors.title}</p>
                                )}
                            </div>
                        </section>

                        {/* Preview */}
                        <section className={adminCardStyle}>
                            <span className="pointer-events-none absolute left-0 top-0 h-full w-[3px] bg-[var(--adm-bar)]" />
                            <div className={adminCardContent}>
                                <header className="flex items-center gap-2 border-b border-emerald-400/10 pb-0.5 mb-3">
                                    <div className="relative h-9 w-9 flex items-center justify-center">
                                        <OptimizedLottie
                                            src="/lottie/Book.json"
                                            className="h-9 w-9 rsf-lottie-emerald"
                                            autoplay={isPreviewFocused}
                                            loop={isPreviewFocused}
                                        />
                                    </div>
                                    <h3 className="text-[16px] font-semibold text-emerald-100">Превʼю / Короткий опис</h3>
                                </header>
                                <Textarea
                                    value={preview}
                                    onChange={(e) => setPreview(e.target.value)}
                                    onFocus={() => {
                                        // Сбрасываем состояние других полей при активации этого поля
                                        setIsBodyFocused(false);
                                        setIsTitleFocused(false);
                                        setIsPreviewFocused(true);
                                    }}
                                    onBlur={(e) => {
                                        // Добавляем задержку, чтобы проверить, куда перешел фокус
                                        setTimeout(() => {
                                            const activeElement = document.activeElement as HTMLElement;
                                            
                                            // Если фокус перешел на кнопку панели инструментов редактора, не сбрасываем
                                            const toolbarDiv = document.querySelector('.flex.flex-wrap.gap-1.rounded-xl.border.border-emerald-400\\/20');
                                            const isToolbarButton = toolbarDiv?.contains(activeElement) || false;
                                            
                                            // Проверяем, не перешел ли фокус на другое поле формы
                                            const isFormField = activeElement?.tagName === 'TEXTAREA' ||
                                                activeElement?.tagName === 'INPUT' ||
                                                (activeElement?.contentEditable === 'true');
                                            
                                            // Сбрасываем состояние только если фокус не на кнопке панели и не на другом поле формы
                                            if (!isFormField && !isToolbarButton) {
                                                setIsPreviewFocused(false);
                                            }
                                        }, 100);
                                    }}
                                    placeholder="Короткий опис статті..."
                                    className={`${glassInput} min-h-[90px] resize-none focus:glow-focus ${formErrors.shortDescription ? '!ring-rose-500/70 !border-rose-500/70' : ''}`}
                                    rows={4}
                                />
                                {formErrors.shortDescription && (
                                    <p className="mt-1 text-xs text-rose-400">{formErrors.shortDescription}</p>
                                )}
                            </div>
                        </section>

                        {/* Body */}
                        <section className={adminCardStyle}>
                            <span className="pointer-events-none absolute left-0 top-0 h-full w-[3px] bg-[var(--adm-bar)]" />
                            <div className={adminCardContent}>
                                <header className="flex items-center gap-2 border-b border-emerald-400/10 pb-0.5 mb-3">
                                    <div className="relative h-6 w-6 flex items-center justify-center">
                                        <OptimizedLottie
                                            key="body-icon"
                                            src="/lottie/wired-outline-35-edit-hover-circle.json"
                                            className="h-6 w-6"
                                            autoplay={isBodyFocused}
                                            loop={isBodyFocused}
                                            filterColors={bodyIconFilterColors}
                                        />
                                    </div>
                                    <h3 className="text-[16px] font-semibold text-emerald-100">Основний текст</h3>
                                </header>
                                <div className={`${formErrors.content ? 'ring-1 ring-rose-500/70 rounded-xl p-1 -m-1' : ''}`}>
                                <RichTextEditor
                                    value={body}
                                    onChange={setBody}
                                    onFocus={() => {
                                        // Сбрасываем состояние других полей при активации этого поля
                                        setIsTitleFocused(false);
                                        setIsPreviewFocused(false);
                                        setIsBodyFocused(true);
                                    }}
                                    onBlur={() => setIsBodyFocused(false)}
                                />
                                </div>
                                {formErrors.content && (
                                    <p className="mt-2 text-xs text-rose-400">{formErrors.content}</p>
                                )}
                                <p className="mt-3 text-xs text-emerald-300/60">
                                    💡 Підказка: виділіть текст і натискайте кнопки над редактором (жирний, курсив, заголовки, списки, цитата, посилання тощо).
                                </p>
                            </div>
                        </section>

                        {/* Main Image */}
                        <section className={adminCardStyle}>
                            <span className="pointer-events-none absolute left-0 top-0 h-full w-[3px] bg-[var(--adm-bar)]" />
                            <div className={adminCardContent}>
                                <header className="flex items-center gap-2 border-b border-emerald-400/10 pb-0.5 mb-1.5">
                                    <Image className="h-4 w-4 text-emerald-300/80" />
                                    <h3 className="text-[16px] font-semibold text-emerald-100">Головне зображення</h3>
                                </header>
                                <div className={`rounded-xl p-4 bg-[#151b19] ring-1 ${formErrors.image ? '!ring-rose-500/70' : 'ring-emerald-400/15'} relative`}>
                                    {mainImageUrl ? (
                                        <div className="relative group">
                                            {isUploading && (
                                                <div className="absolute inset-0 z-20 rounded-xl bg-black/60 grid place-items-center">
                                                    <span className="text-emerald-100 text-sm animate-pulse">Завантаження...</span>
                                                </div>
                                            )}
                                            <img
                                                src={mainImageUrl}
                                                alt="Main"
                                                className="w-full max-h-64 rounded-xl object-contain ring-1 ring-emerald-400/20 group-hover:ring-emerald-400/40 transition-all"
                                            />
                                            <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:gap-3">
                                                <button
                                                    onClick={async () => {
                                                        if (mainImageUrl) await removeMediaByPublicUrl(mainImageUrl);
                                                        setMainImageUrl(undefined);
                                                    }}
                                                    className="flex items-center justify-center gap-2 px-3 py-2.5 sm:py-2 rounded-lg bg-neutral-900/70 text-neutral-200 ring-1 ring-emerald-400/25 hover:bg-neutral-900 hover:ring-emerald-400/45 transition cursor-target text-sm sm:text-base"
                                                >
                                                    <X className="h-4 w-4" />
                                                    Видалити
                                                </button>
                                                <label className="cursor-pointer">
                                                    <input
                                                        id="main-image-upload"
                                                        type="file"
                                                        accept="image/jpeg, image/png, image/webp, image/gif"
                                                        className="hidden"
                                                        onChange={handleMainImageUpload}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => document.getElementById('main-image-upload')?.click()}
                                                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-3 py-2.5 sm:py-2 rounded-lg bg-emerald-500/10 text-emerald-200 ring-1 ring-emerald-400/30 hover:bg-emerald-500/15 hover:ring-emerald-400/50 transition cursor-target text-sm sm:text-base"
                                                    >
                                                        <Upload className="h-4 w-4" />
                                                        Замінити
                                                    </button>
                                                </label>
                                            </div>
                                        </div>
                                    ) : (
                                        <label
                                            onDragOver={handleDragOver}
                                            onDragLeave={handleDragLeave}
                                            onDrop={handleDrop}
                                            className={`flex cursor-pointer items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 transition-all ${formErrors.image
                                                ? '!border-rose-500/80 bg-rose-500/5'
                                                : isDragging
                                                    ? "border-emerald-400 bg-emerald-500/10 ring-2 ring-emerald-400/30"
                                                    : "border-emerald-400/30 bg-emerald-500/5 hover:border-emerald-400/50 hover:bg-emerald-500/10"}
                                            `}
                                        >
                                            <input
                                                type="file"
                                                accept="image/jpeg, image/png, image/webp, image/gif"
                                                className="hidden"
                                                onChange={(e) => handleMainImagePick(e.target.files?.[0])}
                                            />
                                            <ImageIcon className={`h-6 w-6 ${isDragging ? "text-emerald-300" : "text-emerald-400/60"}`} />
                                            <span className="text-sm text-emerald-200/80">
                                                {isDragging ? "Відпустіть для завантаження" : "Перетягніть зображення або натисніть для вибору"}
                                            </span>
                                        </label>
                                    )}
                                    {formErrors.image && (
                                        <p className="mt-2 text-xs text-rose-400">{formErrors.image}</p>
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* Gallery */}
                        <section className={adminCardStyle}>
                            <span className="pointer-events-none absolute left-0 top-0 h-full w-[3px] bg-[var(--adm-bar)]" />
                            <div className={adminCardContent}>
                                <header className="flex items-center gap-2 border-b border-emerald-400/10 pb-0.5 mb-1.5">
                                    <Image className="h-4 w-4 text-emerald-300/80" />
                                    <h3 className="text-[16px] font-semibold text-emerald-100">Галерея</h3>
                                </header>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-4">
                                    <div className="inline-flex items-center">
                                        <input
                                            ref={galleryInputRef}
                                            type="file"
                                            multiple
                                            accept="image/jpeg, image/png, image/webp, image/gif"
                                            onChange={(e) => handleGalleryPick(e.target.files)}
                                            className="hidden"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => galleryInputRef.current?.click()}
                                            className="flex items-center gap-2 px-3 py-2.5 sm:py-2 rounded-lg bg-emerald-500/10 text-emerald-200 ring-1 ring-emerald-400/30 hover:bg-emerald-500/15 hover:ring-emerald-400/50 transition cursor-target text-sm sm:text-base"
                                        >
                                            <Upload className="h-4 w-4 sm:h-4 sm:w-4" />
                                            Додати зображення
                                        </button>
                                    </div>
                                    <p className="text-xs sm:text-sm text-emerald-300/60">PNG, JPG, WEBP. Підтримується drag & drop.</p>
                                </div>
                                {gallery.length > 0 && (
                                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                                        {gallery.map((src, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="group relative overflow-hidden rounded-xl border border-emerald-400/20 hover:border-emerald-400/40 transition-all"
                                            >
                                                <img src={src} alt="gallery" className="h-36 w-full object-cover" />
                                                <button
                                                    onClick={() => removeGalleryItem(i)}
                                                    className="absolute right-2 top-2 rounded-full bg-red-500/80 backdrop-blur-sm p-1.5 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-500 hover:scale-110 ring-1 ring-red-400/30"
                                                    aria-label="Remove"
                                                >
                                                    <X className="h-3.5 w-3.5 text-white" />
                                                </button>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Right column */}
                    <div className="space-y-5">
                        {/* Category */}
                        <section className={adminCardStyle}>
                            <span className="pointer-events-none absolute left-0 top-0 h-full w-[3px] bg-[var(--adm-bar)]" />
                            <div className={adminCardContent}>
                                <header className="flex items-center gap-2 border-b border-emerald-400/10 pb-0.5 mb-1.5">
                                    <Settings2 className="h-4 w-4 text-emerald-300/80" />
                                    <h3 className="text-[16px] font-semibold text-emerald-100">Категорія</h3>
                                </header>
                                <NeonPopoverList
                                    value={category}
                                    onChange={(v) => setCategory(v as CategoryKey)}
                                    options={([
                                        { id: "news" as CategoryKey, label: "Новини", textColor: "text-rose-400", hoverColor: "rose" },
                                        { id: "tactics" as CategoryKey, label: "Тактика", textColor: "text-violet-400", hoverColor: "violet" },
                                        { id: "equipment" as CategoryKey, label: "Спорядження", textColor: "text-sky-400", hoverColor: "sky" },
                                        { id: "game_reports" as CategoryKey, label: "Звіти з ігор", textColor: "text-emerald-400", hoverColor: "emerald" },
                                        { id: "rules" as CategoryKey, label: "Правила", textColor: "text-amber-400", hoverColor: "amber" },
                                    ]) as NeonOption[]}
                                    color="emerald"
                                    minW={0}
                                    width={220}
                                />
                                {formErrors.category && (
                                    <p className="mt-2 text-xs text-rose-400">{formErrors.category}</p>
                                )}
                            </div>
                        </section>

                        {/* SEO */}
                        <section className={adminCardStyle}>
                            <span className="pointer-events-none absolute left-0 top-0 h-full w-[3px] bg-[var(--adm-bar)]" />
                            <div className={adminCardContent}>
                                <header className="flex items-center gap-2 border-b border-emerald-400/10 pb-0.5 mb-1.5">
                                    <Settings2 className="h-4 w-4 text-emerald-300/80" />
                                    <h3 className="text-[16px] font-semibold text-emerald-100">SEO</h3>
                                </header>
                                {/* Slug */}
                                <div className="space-y-3 mb-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        <FileText className="h-4 w-4 text-emerald-400/70" />
                                        <Label className="text-sm text-emerald-200/80">Slug</Label>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <Input
                                            value={slug}
                                            onChange={(e) => setSlug(e.target.value)}
                                            placeholder="article-slug"
                                            className={`${glassInput} flex-1 focus:glow-focus ${formErrors.slug ? '!ring-rose-500/70 !border-rose-500/70' : ''}`}
                                        />
                                        {formErrors.slug && (
                                            <p className="sm:col-span-2 text-xs text-rose-400">{formErrors.slug}</p>
                                        )}
                                        <button
                                            type="button"
                                            onClick={normalizeSlug}
                                            className="px-3 py-2.5 sm:py-2 rounded-lg bg-neutral-900/70 text-neutral-200 ring-1 ring-emerald-400/25 hover:bg-neutral-900 hover:ring-emerald-400/45 transition cursor-target text-sm sm:text-base whitespace-nowrap"
                                        >
                                            Нормалізувати
                                        </button>
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 text-xs text-emerald-300/60">
                                        <span className="break-all">
                                            URL: <span className="text-emerald-200/90">/articles/{slug || "article-slug"}</span>
                                        </span>
                                        <span className="whitespace-nowrap">Дозволені: a–z, 0–9, дефіси</span>
                                    </div>
                                </div>

                                <div className="h-px bg-gradient-to-r from-transparent via-emerald-500/25 to-transparent mb-4" />

                                {/* Meta Description */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Settings2 className="h-4 w-4 text-emerald-400/70" />
                                        <Label className="text-sm text-emerald-200/80">Meta Description</Label>
                                    </div>
                                    <Textarea
                                        value={meta}
                                        onChange={(e) => setMeta(e.target.value)}
                                        placeholder="Опис для пошукових систем..."
                                        className={`${glassInput} resize-none focus:glow-focus`}
                                        rows={3}
                                    />
                                    <div className="flex items-center justify-between text-xs">
                                        <span className={metaColor}>{metaHint}</span>
                                        <span className={metaColor}>{metaLen} / 160</span>
                                    </div>
                                    {/* progress */}
                                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5 ring-1 ring-white/10">
                                        <motion.div
                                            className={`h-full ${metaStatus === "optimal"
                                                ? "bg-emerald-500"
                                                : metaStatus === "short"
                                                    ? "bg-amber-500"
                                                    : "bg-rose-500"
                                                }`}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min(100, (metaLen / 160) * 100)}%` }}
                                            transition={{ duration: 0.3 }}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={generateMeta}
                                        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-neutral-900/70 text-neutral-200 ring-1 ring-emerald-400/25 hover:bg-neutral-900 hover:ring-emerald-400/45 transition cursor-target"
                                    >
                                        <Sparkles className="h-4 w-4" />
                                        Згенерувати опис
                                    </button>
                                    <p className="text-xs text-emerald-300/60">
                                        💡 Порада: тримай 140–160 символів, уникай лапок та html, додай 1–2 ключових фрази з тексту.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Video */}
                        <section className={adminCardStyle}>
                            <span className="pointer-events-none absolute left-0 top-0 h-full w-[3px] bg-[var(--adm-bar)]" />
                            <div className={adminCardContent}>
                                <header className="flex items-center gap-2 border-b border-emerald-400/10 pb-0.5 mb-1.5">
                                    <Film className="h-4 w-4 text-emerald-300/80" />
                                    <h3 className="text-[16px] font-semibold text-emerald-100">Відео</h3>
                                </header>
                                <Tabs value={videoTab} onValueChange={(v) => setVideoTab(v as any)} className="w-full">
                                    <TabsList className={`${glass} grid w-full grid-cols-2 overflow-hidden shadow-[0_0_20px_rgba(0,255,180,0.12)]`}>
                                        <TabsTrigger
                                            value="url"
                                            className="cursor-target transition-colors data-[state=active]:bg-emerald-500/20"
                                        >
                                            URL
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="file"
                                            className="cursor-target transition-colors data-[state=active]:bg-emerald-500/20"
                                        >
                                            Файл
                                        </TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="url" className="mt-4">
                                        <Input
                                            placeholder="https://youtube.com/... або https://your.cdn/video.mp4"
                                            value={videoUrl}
                                            onChange={(e) => setVideoUrl(e.target.value)}
                                            className={`${glassInput} focus:glow-focus`}
                                        />
                                        {videoUrl && (
                                            <div className="mt-4 overflow-hidden rounded-xl border border-emerald-400/20 ring-1 ring-emerald-400/10">
                                                <iframe
                                                    src={
                                                        videoUrl.includes("youtube.com/watch?v=")
                                                            ? videoUrl.replace("watch?v=", "embed/").split("&")[0]
                                                            : videoUrl.includes("youtu.be/")
                                                                ? `https://www.youtube.com/embed/${videoUrl.split("youtu.be/")[1]?.split("?")[0]}`
                                                                : videoUrl
                                                    }
                                                    className="h-56 w-full"
                                                    title="Video preview"
                                                />
                                            </div>
                                        )}
                                    </TabsContent>
                                    <TabsContent value="file" className="mt-4">
                                        <label
                                            className={`flex cursor-pointer items-center justify-center gap-3 rounded-xl border-2 border-dashed p-6 transition-all ${isDragging
                                                ? "border-emerald-400 bg-emerald-500/10"
                                                : "border-emerald-400/30 bg-emerald-500/5 hover:border-emerald-400/50 hover:bg-emerald-500/10"
                                                }`}
                                        >
                                            <input
                                                type="file"
                                                accept="video/mp4, video/webm"
                                                className="hidden"
                                                onChange={(e) => handleVideoFilePick(e.target.files?.[0])}
                                            />
                                            <Upload className="h-4 w-4 text-emerald-400/60" />
                                            <span className="text-sm text-emerald-200/80">Завантажити відеофайл</span>
                                        </label>
                                        {videoFileUrl && (
                                            <video
                                                controls
                                                src={videoFileUrl}
                                                className="mt-4 w-full rounded-xl border border-emerald-400/20 ring-1 ring-emerald-400/10"
                                            />
                                        )}
                                    </TabsContent>
                                </Tabs>
                            </div>
                        </section>
                    </div>
                </div>
            </main>

            {/* Loading Overlay */}
            {isUploading && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-[#121816]/90 rounded-xl p-6 ring-1 ring-emerald-400/30 shadow-[0_0_40px_rgba(16,185,129,.3)]">
                        <div className="flex items-center gap-3">
                            <div className="h-5 w-5 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
                            <p className="text-emerald-200 text-sm">Завантаження...</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
