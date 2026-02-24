import React, { useEffect, useMemo, useRef, useState, forwardRef, useImperativeHandle } from "react";
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
    Clock,
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
import { Popover, PopoverContent, PopoverTrigger, PopoverAnchor } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/use-toast";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { supabase } from "@/integrations/supabase/client";
import NeonButton from "@/components/NeonButton";
import { useI18n } from "@/contexts/I18nContext";
import OptimizedLottie from "@/components/OptimizedLottie";
import { TimeWheel as EventTimeWheel } from "@/components/ui/time-wheel";
import ImageUploader from "./ImageUploader";
import { NeonPopoverList } from "./NeonPopoverList";
import { getGlassToastClassName, getGlassToastVariant } from "@/lib/glass-toast";
import RadarLoader from "@/components/RadarLoader";
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
    isModal?: boolean;
};

export type ArticleEditorRef = {
    submit: () => void;
    saveDraft: () => void;
};

function slugifyLocal(input: string) {
    return input
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
}

// Admin panel style (новая цветовая палитра - как в RoleManager)
const adminCardStyle =
    "relative overflow-hidden rounded-lg pointer-events-auto touch-auto transform-gpu border border-white/10 bg-[#04070A]/70 backdrop-blur-sm shadow-[0_0_20px_rgba(70,214,200,0.08)]";

const adminCardContent = "relative z-10 p-4 sm:p-5";

const glass =
    "backdrop-blur-md bg-white/5 border border-white/10 text-white " +
    "shadow-[0_0_0_1px_rgba(255,255,255,0.05)] hover:border-[#46D6C8]/30 hover:shadow-[0_0_15px_rgba(70,214,200,0.1)] transition-all";

const glassInput =
    "cursor-target w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-gray-600 " +
    "outline-none transition-all hover:border-[#46D6C8]/30 hover:shadow-[0_0_15px_rgba(70,214,200,0.1)] " +
    "focus:outline-none focus:border-[#46D6C8]/50 focus:ring-1 focus:ring-[#46D6C8]/50";

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
                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#46D6C8]/40
                        disabled:opacity-50 disabled:cursor-not-allowed
                        ${isActive 
                            ? "bg-[#46D6C8]/20 border-[#46D6C8]/40 text-[#46D6C8]" 
                            : "border-white/10 bg-black/30 text-gray-400 hover:bg-white/10 hover:border-[#46D6C8]/30 hover:text-[#46D6C8]"
                        }
                        ${className ?? ""}
                    `}
                >
                    {children}
                </button>
            </TooltipTrigger>
            <TooltipContent
                side="top"
                className="select-none bg-[#04070A]/80 text-white border border-[#46D6C8]/30 shadow-[0_0_20px_rgba(70,214,200,.15)]"
            >
                <div className="flex items-center gap-2">
                    <span>{label}</span>
                    {kbd && (
                        <kbd className="rounded bg-black/40 px-1.5 py-0.5 text-[11px] leading-none text-[#46D6C8]/80 border border-[#46D6C8]/20">
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
    const { toast } = useToast();
    const ref = useRef<HTMLDivElement | null>(null);
    const blurTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const savedRange = useRef<Range | null>(null);
    const [activeCommands, setActiveCommands] = useState<Set<string>>(new Set());
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
    const [linkDraftUrl, setLinkDraftUrl] = useState("");
    const linkInputRef = useRef<HTMLInputElement | null>(null);

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

    useEffect(() => {
        if (!isLinkModalOpen) return;
        const focusTimer = window.setTimeout(() => {
            if (!linkInputRef.current) return;
            linkInputRef.current.focus();
            const length = linkInputRef.current.value.length;
            linkInputRef.current.setSelectionRange(length, length);
        }, 10);
        return () => window.clearTimeout(focusTimer);
    }, [isLinkModalOpen]);

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

    const normalizeLinkValue = (rawUrl: string) => {
        const trimmedUrl = rawUrl.trim();
        if (!trimmedUrl) return "";
        if (/^(https?:\/\/|mailto:|tel:|ftp:\/\/|\/|#)/i.test(trimmedUrl)) return trimmedUrl;
        return `https://${trimmedUrl}`;
    };

    const insertLinkNode = (url: string) => {
        if (!ref.current) return false;

        restoreSelection();
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return false;

        const range = sel.getRangeAt(0);
        if (range.collapsed || !inEditor(range.commonAncestorContainer)) return false;

        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.target = "_blank";
        anchor.rel = "noopener noreferrer";

        try {
            const selectedContent = range.extractContents();
            if (!(selectedContent.textContent || "").trim()) return false;

            anchor.appendChild(selectedContent);
            range.insertNode(anchor);

            const after = document.createRange();
            after.setStartAfter(anchor);
            after.collapse(true);
            sel.removeAllRanges();
            sel.addRange(after);

            onChange(ref.current.innerHTML || "");
            saveSelection();
            ref.current.focus();
            setTimeout(updateActiveCommands, 0);
            return true;
        } catch (error) {
            return false;
        }
    };

    // Вставка ссылки
    const makeLink = () => {
        if (!ref.current) return;
        
        restoreSelection();
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0 || sel.toString().trim() === '') {
            toast({
                variant: getGlassToastVariant("error"),
                title: "Не вдалося створити посилання",
                description: "Спочатку виділіть текст у редакторі.",
                className: getGlassToastClassName("error"),
                duration: 4000,
            });
            return;
        }

        // Важно: фиксируем выделение до открытия prompt, чтобы не потерять range.
        saveSelection();

        setLinkDraftUrl("");
        setIsLinkModalOpen(true);
    };

    const handleCloseLinkModal = () => {
        setIsLinkModalOpen(false);
        setLinkDraftUrl("");
    };

    const handleConfirmLink = () => {
        const normalizedUrl = normalizeLinkValue(linkDraftUrl);
        if (!normalizedUrl) {
            toast({
                variant: getGlassToastVariant("error"),
                title: "Невірне посилання",
                description: "Вкажіть коректний URL для вставки.",
                className: getGlassToastClassName("error"),
                duration: 3500,
            });
            return;
        }

        const inserted = insertLinkNode(normalizedUrl);
        if (!inserted) {
            exec("createLink", normalizedUrl);
        }
        setIsLinkModalOpen(false);
        setLinkDraftUrl("");
    };

    const handleLinkInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Enter") {
            event.preventDefault();
            handleConfirmLink();
            return;
        }
        if (event.key === "Escape") {
            event.preventDefault();
            handleCloseLinkModal();
        }
    };

    const handleLinkModalBackdropMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
        if (event.target !== event.currentTarget) return;
        handleCloseLinkModal();
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
                <div className="flex flex-wrap gap-1 rounded-xl border border-[#46D6C8]/20 bg-[#04070A]/80 backdrop-blur-sm p-1 ring-1 ring-[#46D6C8]/10">
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

                <div className="mx-1 h-6 w-px bg-[#46D6C8]/20" />

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

                <div className="mx-1 h-6 w-px bg-[#46D6C8]/20" />

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
                    onMouseDown={(e) => {
                        e.preventDefault();
                        if (editorRef.current && document.activeElement !== editorRef.current) {
                            editorRef.current.focus();
                        }
                        makeLink();
                    }}
                >
                    <Link2 className="h-4 w-4" />
                </IconButtonTip>

                {/* Кнопку добавления изображения из тулбара удалили по требованию */}

                <div className="mx-1 h-6 w-px bg-[#46D6C8]/20" />

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

                <div className="mx-1 h-6 w-px bg-[#46D6C8]/20" />

                <IconButtonTip 
                    label="Параграф" 
                    isActive={isActive("block-P")}
                    onMouseDown={(e) => {
                        e.preventDefault();
                        if (editorRef.current && document.activeElement !== editorRef.current) {
                            editorRef.current.focus();
                        }
                        setTimeout(() => setBlock("P"), 0);
                    }}
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

            {isLinkModalOpen && (
                <div
                    data-link-modal="true"
                    className="fixed inset-0 z-[13040] flex items-center justify-center bg-black/30 p-4 backdrop-blur-[4px]"
                    onMouseDown={handleLinkModalBackdropMouseDown}
                >
                    <div
                        data-link-modal-panel="true"
                        className="relative w-full max-w-md rounded-2xl border border-white/20 bg-white/[0.08] p-5 shadow-[0_0_40px_rgba(70,214,200,.14)] backdrop-blur-2xl"
                        onMouseDown={(event) => event.stopPropagation()}
                    >
                        <div className="mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Link2 className="h-4 w-4 text-[#46D6C8]" />
                                <h4 className="text-sm font-semibold text-white">Додати посилання</h4>
                            </div>
                            <button
                                type="button"
                                aria-label="Закрити"
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/10 text-gray-200 transition-colors hover:border-[#46D6C8]/40 hover:text-[#46D6C8]"
                                onClick={handleCloseLinkModal}
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <Label htmlFor="article-link-input" className="mb-2 block text-xs uppercase tracking-wide text-[#46D6C8]/80">
                            URL посилання
                        </Label>
                        <Input
                            id="article-link-input"
                            ref={linkInputRef}
                            value={linkDraftUrl}
                            onChange={(event) => setLinkDraftUrl(event.target.value)}
                            onKeyDown={handleLinkInputKeyDown}
                            placeholder="https://example.com"
                            className="h-10 border-white/20 bg-white/[0.08] text-white placeholder:text-gray-400 !cursor-text focus:border-[#46D6C8]/50 focus:ring-[#46D6C8]/30"
                        />
                        <p className="mt-2 text-xs text-gray-400">
                            Виділений текст стане активним посиланням.
                        </p>

                        <div className="mt-5 flex items-center justify-end gap-2">
                            <Button
                                type="button"
                                onClick={handleCloseLinkModal}
                                className="h-10 rounded-xl border border-white/15 bg-white/5 px-4 text-white hover:bg-white/10"
                            >
                                Скасувати
                            </Button>
                            <Button
                                type="button"
                                onClick={handleConfirmLink}
                                className="h-10 rounded-xl border border-[#46D6C8]/40 bg-[#46D6C8]/15 px-4 text-[#46D6C8] hover:bg-[#46D6C8]/25"
                            >
                                Вставити
                            </Button>
                        </div>
                    </div>
                </div>
            )}
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
                    className="rounded-xl border border-white/10 bg-[#04070A]/80 p-3 shadow-[0_0_24px_rgba(70,214,200,0.15)]"
                />
                <div className="flex items-center gap-2">
                    <Input
                        type="time"
                        value={selected ? `${String(selected.getHours()).padStart(2, "0")}:${String(selected.getMinutes()).padStart(2, "0")}` : ""}
                        onChange={handleTimeChange}
                        disabled={disabled}
                        className={`
              ${glass} h-9 w-32
              hover:shadow-[0_0_14px_rgba(70,214,200,0.18)]
              focus:border-[#46D6C8] focus:shadow-[0_0_18px_rgba(70,214,200,0.30)]
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
                        <SelectTrigger className={`${glass} h-9 w-24 border-[#46D6C8]/30 ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-target"}`}>
                            <SelectValue placeholder="Години" />
                        </SelectTrigger>
                        <SelectContent className="backdrop-blur bg-[#04070A]/80 border border-white/10 shadow-[0_0_40px_rgba(70,214,200,0.15)]">
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
                className={`${glass} h-9 w-9 p-0 hover:shadow-[0_0_16px_rgba(70,214,200,0.35)] group cursor-target ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                aria-label="Вибрати дату"
            >
                <Calendar className="h-4 w-4 text-[#46D6C8] transition-transform duration-200 group-hover:scale-110" />
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
            <div className="text-[11px] mb-1 text-[#46D6C8]/60">{label}</div>
            <div 
                ref={scrollRef}
                className="relative h-36 w-full overflow-y-auto
                            rsf-wheel border border-[#46D6C8]/20 rounded-xl
                            bg-black/40 pl-1 pr-2">
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
                                            ? "text-[#46D6C8] font-semibold bg-[#46D6C8]/20 ring-1 ring-[#46D6C8]/40"
                                            : "text-gray-400 hover:bg-white/5 hover:text-[#46D6C8]"}`}
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
const ArticleEditorModern = forwardRef<ArticleEditorRef, ArticleEditorModernProps>(({ initial, onSubmit, uploadImage, uploadVideo, onSaveDraft, isModal = false }, ref) => {
    // Only use navigate when NOT in modal mode (modal doesn't need navigation)
    const navigate = isModal ? null : useNavigate();
    const { language } = useI18n();
    const { toast } = useToast();
    // --- state
    const [title, setTitle] = useState(initial?.title ?? "");
    const [preview, setPreview] = useState(initial?.preview ?? "");
    const [body, setBody] = useState(initial?.body ?? "");
    // Category types
    type CategoryKey = "news" | "tactics" | "equipment" | "game_reports" | "rules";
    const CATEGORY_STYLES: Record<CategoryKey, {
        text: string;
        activeBg: string;
        activeRing: string;
        hoverBg: string;
    }> = {
        tactics: {
            text: "text-violet-400",
            activeBg: "bg-violet-500/15",
            activeRing: "ring-violet-400/40",
            hoverBg: "hover:bg-violet-500/10",
        },
        equipment: {
            text: "text-sky-400",
            activeBg: "bg-sky-500/15",
            activeRing: "ring-sky-400/40",
            hoverBg: "hover:bg-sky-500/10",
        },
        news: {
            text: "text-rose-400",
            activeBg: "bg-rose-500/15",
            activeRing: "ring-rose-400/40",
            hoverBg: "hover:bg-rose-500/10",
        },
        game_reports: {
            text: "text-emerald-400",
            activeBg: "bg-emerald-500/15",
            activeRing: "ring-emerald-400/40",
            hoverBg: "hover:bg-emerald-500/10",
        },
        rules: {
            text: "text-amber-400",
            activeBg: "bg-amber-500/15",
            activeRing: "ring-amber-400/40",
            hoverBg: "hover:bg-amber-500/10",
        },
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

    // Блокировка прокрутки страницы когда открыт календарь (отключаем в модалке, так как диалог сам блокирует)
    useLockBodyScroll(isModal ? false : isPopoverOpen);

    // Определение формата времени на основе языка
    const isEnglish = /^en(-|$)/i.test(language || "");
    const effective12h = timeFormatMode === "12" || (timeFormatMode === "auto" && isEnglish);

    // Утилиты для работы с датой
    const pad = (n: number) => String(n).padStart(2, "0");
    const toISO = (y: number, m: number, d: number, hh: number, mm: number) =>
        new Date(Date.UTC(y, m - 1, d, hh, mm)).toISOString();

    const getInputClass = (hasError: boolean) => `
        w-full px-3 py-2 rounded-lg bg-white/5 border text-white placeholder:text-gray-600
        ${hasError ? 'border-red-500/50 shadow-[0_0_10px_rgba(220,38,38,0.2)]' : 'border-white/10'}
        text-sm sm:text-base
        focus:outline-none focus:border-[#46D6C8]/50 focus:ring-1 focus:ring-[#46D6C8]/50
        hover:border-[#46D6C8]/30 hover:shadow-[0_0_15px_rgba(70,214,200,0.1)]
        transition-all
    `;

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
        if (!scheduleEnabled) setScheduleEnabled(true);

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
        if (!scheduleEnabled) setScheduleEnabled(true);

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
        const error = validateScheduleText(scheduleText);
        setScheduleInputError(error || "");
        if (isModal && error) {
            toast({
                variant: getGlassToastVariant("error"),
                title: "Невірна дата публікації",
                description: error,
                className: getGlassToastClassName("error"),
                duration: 4500,
            });
        }
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
        primary: "#46D6C8", // Teal
        secondary: "#46D6C8", // Teal
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
        metaStatus === "optimal" ? "text-[#46D6C8]" : metaStatus === "short" ? "text-amber-400" : "text-rose-400";

    const normalizeSlug = () => {
        if (!title || !title.trim()) {
            toast({
                variant: getGlassToastVariant("error"),
                title: "Неможливо нормалізувати slug",
                description: "Спочатку введіть заголовок статті.",
                className: getGlassToastClassName("error"),
                duration: 4000,
            });
            return;
        }
        const newSlug = slugify(title, {
            lower: true,
            remove: /[*+~\.()'"!:@#$?%^&;=]/g,
            locale: 'uk',
        });
        setSlug(newSlug);
    };

    const generateMeta = () => {
        // Використовуємо короткий опис (Превʼю)
        const shortDescription = preview?.trim() || "";
        if (!shortDescription) {
            toast({
                variant: getGlassToastVariant("error"),
                title: "Неможливо згенерувати SEO-опис",
                description: "Спочатку заповніть поле 'Превʼю / Короткий опис'.",
                className: getGlassToastClassName("error"),
                duration: 4000,
            });
            return;
        }
        let newDesc = shortDescription.trim();
        if (newDesc.length > 160) {
            newDesc = newDesc.substring(0, 157) + "...";
        }
        setMeta(newDesc);
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

    const validateForm = (): { isValid: boolean; missingFields: string[] } => {
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
        const fieldLabelMap: Record<string, string> = {
            title: "Заголовок статті",
            shortDescription: "Превʼю / Короткий опис",
            content: "Основний текст",
            image: "Головне зображення",
            category: "Категорія",
            slug: "Slug",
        };

        const missingFields = Object.keys(errs).map((key) => fieldLabelMap[key] ?? key);
        return { isValid: missingFields.length === 0, missingFields };
    };

    const handlePublish = async (e?: React.MouseEvent) => {
        e?.preventDefault();
        const { isValid, missingFields } = validateForm();
        if (!isValid) {
            console.warn("Форма не пройшла валідацію. Помилки:", formErrors);
            toast({
                variant: getGlassToastVariant("error"),
                title: "Помилка валідації",
                description: `Будь ласка, перевірте поля: ${missingFields.join(", ")}`,
                className: getGlassToastClassName("error"),
                duration: 5000,
            });
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
            toast({
                variant: getGlassToastVariant("success"),
                title: "Успіх",
                description: "Стаття успішно збережена!",
                className: getGlassToastClassName("success"),
                duration: 4500,
            });
        } catch (err: any) {
            console.error('Помилка сервера:', err);
            toast({
                variant: getGlassToastVariant("error"),
                title: "Помилка сервера",
                description: err?.message || "Failed to save article",
                className: getGlassToastClassName("error"),
                duration: 5000,
            });
        }
    };



    useImperativeHandle(ref, () => ({
        submit: () => handlePublish(),
        saveDraft: () => saveDraft()
    }));

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
    const getSectionClassName = (
        section: "title" | "preview" | "body" | "mainImage" | "gallery" | "video" | "category" | "seo"
    ) => {
        if (!isModal) return adminCardStyle;
        const withoutDivider =
            section === "title" ||
            section === "preview" ||
            section === "body" ||
            section === "mainImage" ||
            section === "category";

        return `space-y-4 pb-6 ${withoutDivider ? "" : "border-b border-white/10"} last:border-b-0`;
    };
    const sectionContentClassName = isModal ? "space-y-4" : adminCardContent;

    // ───────────────── UI – Admin Panel Style ──────────────────
    return (
        <div className={`mx-auto w-full ${isModal ? '' : 'max-w-[1400px] xl:max-w-[1500px] px-3 sm:px-4 md:px-5 xl:px-8 py-4 sm:py-5 md:py-6 bg-[var(--adm-bg)] min-h-screen'}`}>
            <main
                id="app-main"
                className={`relative z-[40] space-y-4 sm:space-y-5 md:space-y-6 lg:space-y-8 pointer-events-auto touch-auto isolate ${isModal ? '' : 'lg:-translate-x-[120px]'}`}
            >
                {/* Back Button - отдельно (скрываем в модалке) */}
                {!isModal && (
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
                )}

                {!isModal && (
                    <>
                        {/* Quick Actions - Сохранить, Опубликовать и Запланировать */}
                        <div className="mb-4 sm:mb-5 md:mb-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 pointer-events-auto">
                            <Button
                                onClick={saveDraft}
                                disabled={isUploading || !hasChanges}
                                className="h-11 sm:h-9 px-4 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-target flex-1 sm:flex-initial"
                            >
                                <Save className="h-4 w-4 mr-2 text-[#46D6C8]" />
                                <span className="text-sm sm:text-base">Зберегти чернетку</span>
                            </Button>
                            <Button
                                onClick={handlePublish}
                                disabled={isUploading || publishDisabled}
                                aria-label="Опублікувати статтю"
                                className="h-11 sm:h-9 px-4 rounded-lg bg-[#46D6C8] text-black font-semibold hover:opacity-90 hover:shadow-[0_0_30px_rgba(70,214,200,0.8)] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-target flex-1 sm:flex-initial"
                            >
                                <SendHorizonal className="h-4 w-4 mr-2" />
                                <span className="text-sm sm:text-base">
                                    Опублікувати
                                </span>
                            </Button>
                        </div>

                        {/* Status Bar */}
                        {hasChanges && (
                            <span className="relative inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs ring-1 transition-colors bg-yellow-500/10 text-yellow-300 ring-yellow-400/30 animate-fade-in leading-none">
                                <Circle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-pulse shrink-0" />
                                <span className="leading-none pl-5">Незбережені зміни</span>
                            </span>
                        )}
                    </>
                )}

                <div className={isModal ? "space-y-6" : "mx-auto max-w-6xl space-y-6"}>
                    {/* Single Column Flow */}
                    <div className="space-y-6">
                        {/* Title */}
                        <section className={getSectionClassName("title")}>
                            {!isModal && <span className="pointer-events-none absolute left-0 top-0 h-full w-[3px] bg-[var(--adm-bar)]" />}
                            <div className={sectionContentClassName}>
                                <header className="flex items-center gap-2 border-b border-white/10 pb-2 mb-4">
                                    <div className="relative h-12 w-12 flex items-center justify-center overflow-visible" style={{ minWidth: '3rem', minHeight: '3rem' }}>
                                        <OptimizedLottie
                                            src="/lottie/Address-Book.json"
                                            className="h-12 w-12 rsf-lottie-emerald"
                                            autoplay={isTitleFocused}
                                            loop={isTitleFocused}
                                        />
                                    </div>
                                    <h3 className="text-lg font-semibold text-[#46D6C8]">Заголовок статті</h3>
                                </header>
                                <div className="space-y-4">
                                    <Input
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        onFocus={() => {
                                            setIsBodyFocused(false);
                                            setIsPreviewFocused(false);
                                            setIsTitleFocused(true);
                                        }}
                                        onBlur={(e) => {
                                            setTimeout(() => {
                                                const activeElement = document.activeElement as HTMLElement;
                                                const toolbarDiv = document.querySelector('.flex.flex-wrap.gap-1.rounded-xl.border');
                                                const isToolbarButton = toolbarDiv?.contains(activeElement) || false;
                                                const isFormField = activeElement?.tagName === 'TEXTAREA' ||
                                                    activeElement?.tagName === 'INPUT' ||
                                                    (activeElement?.contentEditable === 'true');
                                                if (!isFormField && !isToolbarButton) {
                                                    setIsTitleFocused(false);
                                                }
                                            }, 100);
                                        }}
                                        placeholder="Введіть заголовок статті..."
                                        className={`${getInputClass(!!formErrors.title)} text-lg font-medium h-12`}
                                    />
                                    {/* Error message reused from outside if possible, otherwise define here */}
                                    
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-semibold text-[#46D6C8] flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-[#46D6C8]" />
                                            Дата публікації
                                        </h4>
                                        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                                            <PopoverAnchor asChild>
                                                <div className="relative flex items-center gap-2 w-full">
                                                    {/* Overlay hints */}
                                                    <div
                                                        aria-hidden
                                                        className="pointer-events-none absolute inset-0 z-[10] flex items-center px-3 text-base font-medium font-mono select-none tracking-wider"
                                                        style={{ opacity: 0.78 - overallProgress(scheduleText, effective12h) * 0.58 }}
                                                    >
                                                    {effective12h ? (
                                                        <div className="flex items-center text-gray-600 whitespace-pre">
                                                            <span style={{ opacity: 1 - segmentProgress(scheduleText, true).MM }}>mm</span>
                                                            <span style={{ opacity: 1 - segmentProgress(scheduleText, true).MM }}>/</span>
                                                            <span style={{ opacity: 1 - segmentProgress(scheduleText, true).DD }}>dd</span>
                                                            <span style={{ opacity: 1 - segmentProgress(scheduleText, true).DD }}>/</span>
                                                            <span style={{ opacity: 1 - segmentProgress(scheduleText, true).YYYY }}>yyyy</span>
                                                            <span style={{ opacity: 1 - segmentProgress(scheduleText, true).YYYY }}>   </span>
                                                            <span style={{ opacity: 1 - segmentProgress(scheduleText, true).HH }}>hh</span>
                                                            <span style={{ opacity: 1 - segmentProgress(scheduleText, true).HH }}>:</span>
                                                            <span style={{ opacity: 1 - segmentProgress(scheduleText, true).mm }}>mm</span>
                                                            <span style={{ opacity: 1 - segmentProgress(scheduleText, true).mm }}>      </span>
                                                            <span style={{ opacity: 1 - segmentProgress(scheduleText, true).AMPM }}>am/pm</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center text-gray-600 whitespace-pre">
                                                            <span style={{ opacity: 1 - segmentProgress(scheduleText, false).DD }}>дд</span>
                                                            <span style={{ opacity: 1 - segmentProgress(scheduleText, false).DD }}>.</span>
                                                            <span style={{ opacity: 1 - segmentProgress(scheduleText, false).MM }}>мм</span>
                                                            <span style={{ opacity: 1 - segmentProgress(scheduleText, false).MM }}>.</span>
                                                            <span style={{ opacity: 1 - segmentProgress(scheduleText, false).YYYY }}>рррр</span>
                                                            <span style={{ opacity: 1 - segmentProgress(scheduleText, false).YYYY }}>   </span>
                                                            <span style={{ opacity: 1 - segmentProgress(scheduleText, false).HH }}>гг</span>
                                                            <span style={{ opacity: 1 - segmentProgress(scheduleText, false).HH }}>:</span>
                                                            <span style={{ opacity: 1 - segmentProgress(scheduleText, false).mm }}>хх</span>
                                                        </div>
                                                    )}
                                                    </div>
                                                <Input
                                                    name="schedule_display"
                                                    value={scheduleText}
                                                    onChange={handleScheduleInputChange}
                                                    onKeyDown={handleScheduleKeyDown}
                                                    placeholder=""
                                                    className={`${getInputClass(!!scheduleInputError)} flex-1 font-mono tracking-wider z-[20] relative text-base`}
                                                    onFocus={() => {
                                                        setScheduleEnabled(true);
                                                        setIsInputFocused(true);
                                                    }}
                                                    onBlur={() => {
                                                        setIsInputFocused(false);
                                                        handleScheduleBlur();
                                                    }}
                                                    autoComplete="off"
                                                />
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        className="backdrop-blur-md bg-[#04070A]/80 border border-white/10 shadow-[0_0_0_1px_rgba(255,255,255,0.05)] hover:bg-white/10 hover:border-[#46D6C8]/20 transition-colors h-11 w-12 p-0 hover:shadow-[0_0_16px_rgba(70,214,200,0.35)] group cursor-target relative overflow-visible active:scale-90 transition-transform duration-150 shrink-0"
                                                        aria-label="Вибрати дату"
                                                        onMouseEnter={() => setIsButtonHovering(true)}
                                                        onMouseLeave={() => setIsButtonHovering(false)}
                                                        onClick={() => {
                                                            setScheduleEnabled(true);
                                                            setIsPopoverOpen(true);
                                                        }}
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
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            className="backdrop-blur-md bg-[#04070A]/80 border border-white/10 shadow-[0_0_0_1px_rgba(255,255,255,0.05)] hover:bg-white/10 hover:border-[#46D6C8]/20 transition-colors h-11 w-12 p-0 hover:shadow-[0_0_16px_rgba(70,214,200,0.35)] group cursor-target relative overflow-visible active:scale-90 transition-transform duration-150 shrink-0"
                                                            aria-label="Встановити поточну дату і час"
                                                            tabIndex={0}
                                                            onClick={() => {
                                                                const now = new Date().toISOString();
                                                                setScheduleEnabled(true);
                                                                setSchedule(now);
                                                                setScheduleText(fromISOToText(now));
                                                                setScheduleInputError("");
                                                                wasManuallyCleared.current = false;
                                                            }}
                                                        >
                                                            <Clock className="h-5 w-5 text-white/70 group-hover:text-[#46D6C8] transition-colors duration-300" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent
                                                        side="top"
                                                        className="select-none bg-[#04070A]/80 text-white border border-[#46D6C8]/30 shadow-[0_0_20px_rgba(70,214,200,.15)]"
                                                    >
                                                        Зараз
                                                    </TooltipContent>
                                                </Tooltip>
                                                </div>
                                            </PopoverAnchor>
                                            {!isModal && scheduleInputError && (
                                                <p className="mt-1 text-xs text-rose-400">{scheduleInputError}</p>
                                            )}
                                            <PopoverContent
                                                className="w-auto p-0 bg-[#04070A]/45 backdrop-blur-md border border-[#46D6C8]/20 rounded-2xl shadow-[0_0_40px_rgba(70,214,200,0.12)]"
                                                align="end"
                                                side="bottom"
                                                sideOffset={2}
                                            >
                                                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-0">
                                                    <div className="p-3 md:p-4">
                                                        <DayPicker
                                                            mode="single"
                                                            selected={schedule ? new Date(schedule) : undefined}
                                                            onSelect={(day) => {
                                                                if (!day) return;
                                                                const cur = schedule ? new Date(schedule) : new Date();
                                                                const d = new Date(day);
                                                                d.setHours(cur.getHours(), cur.getMinutes(), 0, 0);
                                                                setScheduleEnabled(true);
                                                                setSchedule(d.toISOString());
                                                                setScheduleInputError("");
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
                                                            <div className="flex flex-col items-center gap-3">
                                                                <EventTimeWheel
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
                                                                            const currentH = base.getHours();
                                                                            const isPM = currentH >= 12;
                                                                            const newHour = h === 12
                                                                                ? (isPM ? 12 : 0)
                                                                                : (isPM ? h + 12 : h);
                                                                            base.setHours(newHour);
                                                                        } else {
                                                                            base.setHours(h);
                                                                        }
                                                                        setScheduleEnabled(true);
                                                                        setSchedule(base.toISOString());
                                                                    }}
                                                                    range={effective12h ? [1, 12] : [0, 23]}
                                                                    pad
                                                                    className="w-24"
                                                                />
                                                            </div>

                                                            <div className="pt-6 text-2xl font-bold text-[#46D6C8]/70">:</div>

                                                            <div className="flex flex-col items-center">
                                                                <EventTimeWheel
                                                                    label="Хвилини"
                                                                    value={schedule ? new Date(schedule).getMinutes() : 0}
                                                                    onChange={(m) => {
                                                                        const base = schedule ? new Date(schedule) : new Date();
                                                                        base.setMinutes(m);
                                                                        setScheduleEnabled(true);
                                                                        setSchedule(base.toISOString());
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

                                                            {effective12h && (
                                                                <div className="inline-flex rounded-lg overflow-hidden ring-1 ring-[#46D6C8]/20 bg-white/5 p-0.5 h-9 items-center w-fit">
                                                                    {(["AM", "PM"] as const).map((p) => {
                                                                        const curH = schedule ? new Date(schedule).getHours() : 0;
                                                                        const active = (p === "AM" && curH < 12) || (p === "PM" && curH >= 12);
                                                                        return (
                                                                            <button
                                                                                key={p}
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    const d = schedule ? new Date(schedule) : new Date();
                                                                                    const h = d.getHours();
                                                                                    if (p === "AM" && h >= 12) d.setHours(h - 12);
                                                                                    if (p === "PM" && h < 12) d.setHours(h + 12);
                                                                                    setScheduleEnabled(true);
                                                                                    setSchedule(d.toISOString());
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
                                </div>
                                {!isModal && formErrors.title && (
                                    <p className="mt-1 text-xs text-rose-400">{formErrors.title}</p>
                                )}
                            </div>
                        </section>

                        {/* Preview */}
                        <section className={getSectionClassName("preview")}>
                            {!isModal && <span className="pointer-events-none absolute left-0 top-0 h-full w-[3px] bg-[var(--adm-bar)]" />}
                            <div className={sectionContentClassName}>
                                <header className="flex items-center gap-2 border-b border-white/10 pb-2 mb-4">
                                    <div className="relative h-9 w-9 flex items-center justify-center">
                                        <OptimizedLottie
                                            src="/lottie/Book.json"
                                            className="h-9 w-9 rsf-lottie-emerald"
                                            autoplay={isPreviewFocused}
                                            loop={isPreviewFocused}
                                        />
                                    </div>
                                    <h3 className="text-lg font-semibold text-[#46D6C8]">Превʼю / Короткий опис</h3>
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
                                            const toolbarDiv = document.querySelector('.flex.flex-wrap.gap-1.rounded-xl.border');
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
                                {!isModal && formErrors.shortDescription && (
                                    <p className="mt-1 text-xs text-rose-400">{formErrors.shortDescription}</p>
                                )}
                            </div>
                        </section>

                        {/* Body */}
                        <section className={getSectionClassName("body")}>
                            {!isModal && <span className="pointer-events-none absolute left-0 top-0 h-full w-[3px] bg-[var(--adm-bar)]" />}
                            <div className={sectionContentClassName}>
                                <header className="flex items-center gap-2 border-b border-white/10 pb-2 mb-4">
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
                                    <h3 className="text-lg font-semibold text-[#46D6C8]">Основний текст</h3>
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
                                {!isModal && formErrors.content && (
                                    <p className="mt-2 text-xs text-rose-400">{formErrors.content}</p>
                                )}
                                <p className="mt-3 text-xs text-[#46D6C8]/60">
                                    💡 Підказка: виділіть текст і натискайте кнопки над редактором (жирний, курсив, заголовки, списки, цитата, посилання тощо).
                                </p>
                            </div>
                        </section>

                        {/* Main Image */}
                        <section className={getSectionClassName("mainImage")}>
                            {!isModal && <span className="pointer-events-none absolute left-0 top-0 h-full w-[3px] bg-[var(--adm-bar)]" />}
                            <div className={sectionContentClassName}>
                                <header className="flex items-center gap-2 border-b border-white/10 pb-2 mb-4">
                                    <Image className="h-4 w-4 text-[#46D6C8]" />
                                    <h3 className="text-lg font-semibold text-[#46D6C8]">Головне зображення</h3>
                                </header>
                                <div className="space-y-2">
                                    <ImageUploader
                                        label="Фото статті"
                                        folder="articles"
                                        currentUrl={mainImageUrl}
                                        onUpload={(url) => {
                                            setMainImageUrl(url);
                                            // Очистка ошибки при успешной загрузке
                                            if (url) {
                                                setFormErrors(prev => {
                                                    const next = { ...prev };
                                                    delete next.image;
                                                    return next;
                                                });
                                            }
                                        }}
                                        error={!!formErrors.image}
                                    />
                                    {!isModal && formErrors.image && (
                                        <p className="mt-2 text-xs text-rose-400">{formErrors.image}</p>
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* Gallery */}
                        <section className={getSectionClassName("gallery")}>
                            {!isModal && <span className="pointer-events-none absolute left-0 top-0 h-full w-[3px] bg-[var(--adm-bar)]" />}
                            <div className={sectionContentClassName}>
                                <header className="flex items-center gap-2 border-b border-white/10 pb-2 mb-4">
                                    <Image className="h-4 w-4 text-[#46D6C8]" />
                                    <h3 className="text-lg font-semibold text-[#46D6C8]">Галерея</h3>
                                </header>
                                <div className="mb-4">
                                    <ImageUploader
                                        label=""
                                        folder="articles"
                                        currentUrl={null}
                                        onUpload={() => {}}
                                        multiple
                                        onUploadMany={(urls) => {
                                            // Використовуємо Set для уникнення дублікатів, так як ImageUploader може повертати накопичувальний список
                                            setGallery(prev => Array.from(new Set([...prev, ...urls])));
                                        }}
                                    />
                                    {/* Поскольку ImageUploader не поддерживает initialPreviews, 
                                        существующая галерея (при редактировании) не будет видна в нем.
                                        Нужно отобразить существующую галерею ОТДЕЛЬНО, если ImageUploader ее не показывает. */}
                                    
                                    {gallery.length > 0 && (
                                        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 mt-4">
                                            {gallery.map((src, i) => (
                                                <div
                                                    key={i}
                                                    className="group relative overflow-hidden rounded-lg border border-white/10 hover:border-[#46D6C8]/30 transition-all"
                                                >
                                                    <img src={src} alt="gallery" className="h-36 w-full object-cover" />
                                                    <button
                                                        onClick={() => setGallery(g => g.filter((_, idx) => idx !== i))}
                                                        className="absolute right-2 top-2 rounded-full bg-red-500/80 p-1.5 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-500 hover:scale-110"
                                                    >
                                                        <X className="h-3.5 w-3.5 text-white" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Moved Right Column Sections (Category, SEO, Video) to Main Flow */}
                    
                    {/* Video */}
                     <section className={getSectionClassName("video")}>
                        {!isModal && <span className="pointer-events-none absolute left-0 top-0 h-full w-[3px] bg-[var(--adm-bar)]" />}
                        <div className={sectionContentClassName}>
                            <header className="flex items-center gap-2 border-b border-white/10 pb-2 mb-4">
                                <Film className="h-4 w-4 text-[#46D6C8]" />
                                <h3 className="text-lg font-semibold text-[#46D6C8]">Відео</h3>
                            </header>
                            <Tabs value={videoTab} onValueChange={(v) => setVideoTab(v as any)} className="w-full">
                                <TabsList className={`${glass} grid w-full grid-cols-2 overflow-hidden shadow-[0_0_20px_rgba(70,214,200,0.12)]`}>
                                    <TabsTrigger
                                        value="url"
                                        className="cursor-target transition-colors data-[state=active]:bg-[#46D6C8]/20"
                                    >
                                        URL
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="file"
                                        className="cursor-target transition-colors data-[state=active]:bg-[#46D6C8]/20"
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
                                        <div className="mt-4 overflow-hidden rounded-lg border border-white/10">
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
                                    <div className="space-y-4">
                                         <ImageUploader
                                            label=""
                                            folder="articles/videos"
                                            accept="video/mp4,video/webm,video/quicktime"
                                            fileType="video"
                                            currentUrl={videoFileUrl}
                                            onUpload={(url) => setVideoFileUrl(url)}
                                        />
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>
                    </section>

                    {/* Category */}
                    <section className={getSectionClassName("category")}>
                        {!isModal && <span className="pointer-events-none absolute left-0 top-0 h-full w-[3px] bg-[var(--adm-bar)]" />}
                         <div className={sectionContentClassName}>
                            <header className="flex items-center gap-2 border-b border-white/10 pb-2 mb-4">
                                <Settings2 className="h-4 w-4 text-[#46D6C8]" />
                                <h3 className="text-lg font-semibold text-[#46D6C8]">Категорія</h3>
                            </header>
                            <div className="flex flex-wrap gap-2">
                                {(Object.keys(categoryLabels) as CategoryKey[]).map((catKey) => {
                                    const isActive = category === catKey;
                                    const label = categoryLabels[catKey];
                                    const style = CATEGORY_STYLES[catKey];
                                    return (
                                        <button
                                            key={catKey}
                                            type="button"
                                            onClick={() => setCategory(catKey)}
                                            className={`
                                                px-4 py-2 rounded-lg text-sm font-medium transition-all border
                                                ${isActive
                                                    ? `${style.activeBg} ${style.text} ring-1 ${style.activeRing} border-transparent shadow-[0_0_15px_rgba(70,214,200,0.2)]`
                                                    : `bg-white/5 border-white/10 ${style.text} ${style.hoverBg} hover:shadow-[0_0_12px_rgba(70,214,200,0.12)]`}
                                            `}
                                        >
                                            {label}
                                        </button>
                                    );
                                })}
                            </div>
                            {!isModal && formErrors.category && (
                                <p className="mt-2 text-xs text-rose-400">{formErrors.category}</p>
                            )}
                        </div>
                    </section>

                    {/* SEO */}
                    <section className={getSectionClassName("seo")}>
                        {!isModal && <span className="pointer-events-none absolute left-0 top-0 h-full w-[3px] bg-[var(--adm-bar)]" />}
                        <div className={sectionContentClassName}>
                           <header className="flex items-center gap-2 border-b border-white/10 pb-2 mb-4">
                                <Settings2 className="h-4 w-4 text-[#46D6C8]" />
                                <h3 className="text-lg font-semibold text-[#46D6C8]">SEO</h3>
                            </header>
                            {/* Slug */}
                            <div className="space-y-3 mb-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <FileText className="h-4 w-4 text-[#46D6C8]/70" />
                                    <Label className="text-sm font-medium text-white/80">Slug</Label>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <Input
                                        value={slug}
                                        onChange={(e) => setSlug(e.target.value)}
                                        placeholder="article-slug"
                                        className={`${glassInput} flex-1 focus:glow-focus ${formErrors.slug ? '!ring-rose-500/70 !border-rose-500/70' : ''}`}
                                    />
                                    {!isModal && formErrors.slug && (
                                        <p className="sm:col-span-2 text-xs text-rose-400">{formErrors.slug}</p>
                                    )}
                                    <button
                                        type="button"
                                        onClick={normalizeSlug}
                                        className="px-3 py-2.5 sm:py-2 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all cursor-target text-sm sm:text-base whitespace-nowrap"
                                    >
                                        Нормалізувати
                                    </button>
                                </div>
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 text-xs text-[#46D6C8]/60">
                                    <span className="break-all">
                                        URL: <span className="text-[#46D6C8]/90">/articles/{slug || "article-slug"}</span>
                                    </span>
                                    <span className="whitespace-nowrap">Дозволені: a–z, 0–9, дефіси</span>
                                </div>
                            </div>

                            <div className="border-b border-white/10 mb-4" />

                            {/* Meta Description */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 mb-1">
                                    <Settings2 className="h-4 w-4 text-[#46D6C8]/70" />
                                    <Label className="text-sm font-medium text-white/80">Meta Description</Label>
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
                                            ? "bg-[#46D6C8]"
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
                                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all cursor-target"
                                >
                                    <Sparkles className="h-4 w-4" />
                                    Згенерувати опис
                                </button>
                                <p className="text-xs text-[#46D6C8]/60">
                                    💡 Порада: тримай 140–160 символів, уникай лапок та html, додай 1–2 ключових фрази з тексту.
                                </p>
                            </div>
                         </div>
                    </section>
                </div>

        </main>

            {/* Loading Overlay */}
            {isUploading && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-[#04070A]/80 rounded-xl p-6 ring-1 ring-[#46D6C8]/30 shadow-[0_0_40px_rgba(70,214,200,.3)]">
                        <div className="flex items-center gap-3">
                            <RadarLoader label="Завантаження..." size={40} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});

ArticleEditorModern.displayName = 'ArticleEditorModern';

export default ArticleEditorModern;
