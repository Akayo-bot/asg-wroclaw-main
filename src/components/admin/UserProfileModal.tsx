import React, { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface UserProfileModalProps {
    user: {
        id: string;
        display_name: string | null;
        real_name?: string | null;
        email?: string;
        avatar_url?: string | null;
        role: 'superadmin' | 'admin' | 'editor' | 'user';
        status?: string | null;
        phone?: string | null;
        callsign?: string | null;
        created_at: string;
        last_sign_in_at?: string;
    };
    onClose: () => void;
}

// --- Помічники для стилізації ---

// 1. "Пігулки" Ролей (з нашої нової палітри)
const RolePill = ({ role }: { role: string }) => {
    const safeRole = role.toLowerCase();

    let styles = '';

    switch (safeRole) {
        case 'superadmin':
            // Червоний/Orange
            styles = 'bg-[#FF7F3B]/20 text-[#FF7F3B] ring-[#FF7F3B]/40 shadow-[0_0_10px_rgba(255,127,59,0.3)]';
            break;
        case 'admin':
            // Green
            styles = 'bg-[#00FF00]/20 text-[#00FF00] ring-[#00FF00]/40 shadow-[0_0_10px_rgba(0,255,0,0.3)]';
            break;
        case 'editor':
            // Фіолетовий
            styles = 'bg-[#A020F0]/20 text-[#A020F0] ring-[#A020F0]/40 shadow-[0_0_10px_rgba(160,32,240,0.3)]';
            break;
        default: // User
            // Сірий
            styles = 'bg-[#808080]/20 text-[#808080] ring-[#808080]/40';
    }

    return (
        <span className={`inline-block rounded-full px-3 py-0.5 text-xs font-semibold ring-1 ring-inset font-sans ${styles}`}>
            {role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()}
        </span>
    );
};

// 2. "Пігулки" Статусу
const StatusPill = ({ status }: { status: string }) => {
    const safeStatus = status?.toLowerCase() || 'active';
    let styles = '';

    switch (safeStatus) {
        case 'active':
            // Teal
            styles = 'bg-[#46D6C8]/20 text-[#46D6C8] ring-[#46D6C8]/40 shadow-[0_0_10px_rgba(70,214,200,0.3)]';
            break;
        case 'banned':
        case 'suspended':
            // Orange/Red
            styles = 'bg-[#FF7F3B]/20 text-[#FF7F3B] ring-[#FF7F3B]/40 shadow-[0_0_10px_rgba(255,127,59,0.3)]';
            break;
        case 'hidden':
            // Сірий
            styles = 'bg-[#808080]/20 text-[#808080] ring-[#808080]/40';
            break;
        default:
            // Teal для активного по умолчанию
            styles = 'bg-[#46D6C8]/20 text-[#46D6C8] ring-[#46D6C8]/40 shadow-[0_0_10px_rgba(70,214,200,0.3)]';
    }

    const displayStatus = safeStatus === 'suspended' ? 'Banned' : safeStatus.charAt(0).toUpperCase() + safeStatus.slice(1);

    return (
        <span className={`inline-block rounded-full px-3 py-0.5 text-xs font-semibold ring-1 ring-inset font-sans ${styles}`}>
            {displayStatus}
        </span>
    );
};

// 3. Форматування дати
const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Ніколи';
    return new Date(dateString).toLocaleString('uk-UA', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// --- Основний компонент Модалки ---
export default function UserProfileModal({ user, onClose }: UserProfileModalProps) {
    // --- 🔥 ПОКРАЩЕНА ЛОГІКА АНІМАЦІЇ ---
    const modalRef = useRef<HTMLDivElement>(null);

    // 🔥 ФІКС №2: Стан, щоб показати кнопку тільки на iOS
    const [needsGyroPermission, setNeedsGyroPermission] = useState(false);

    // 🔥 ФІКС №1: Визначаємо, чи це тач-пристрій
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // Нам потрібні Ref, щоб зберігати значення, не викликаючи ре-рендер
    const animationFrameId = useRef<number | null>(null);
    
    // Де картка має бути (встановлюється мишею або гіроскопом)
    const targetRotation = useRef({ x: 0, y: 0 }); 
    
    // Де картка знаходиться ЗАРАЗ (плавно "доганяє" ціль)
    const currentRotation = useRef({ x: 0, y: 0 });

    // 🔥 Калібрування: "домашня позиція" телефону (коли модалка відкривається)
    const homeRotation = useRef<{ beta: number; gamma: number } | null>(null);

    const easingFactor = 0.12;

    // --- 2. ЛОГІКА ДЛЯ ГІРОСКОПА (Телефон) ---
    const orientationHandler = (event: DeviceOrientationEvent) => {
        if (!modalRef.current || event.beta == null || event.gamma == null) {
            return;
        }
        
        const { beta, gamma } = event;

        if (!homeRotation.current) {
            homeRotation.current = { beta: beta, gamma: gamma };
            return; 
        }

        const deltaBeta = beta - homeRotation.current.beta;
        const deltaGamma = gamma - homeRotation.current.gamma;

        // 🔥 ОСЬ ФІКС: однаковий кут
        const maxRotation = 15; // Однаково для обох осей
        const sensitivity = 30; // 30 градусів нахилу = повний поворот

        // Обмежуємо ДЕЛЬТУ
        const clampedGammaDelta = Math.max(-sensitivity, Math.min(sensitivity, deltaGamma));
        const clampedBetaDelta = Math.max(-sensitivity, Math.min(sensitivity, deltaBeta));
        
        // Телефон Вперед/Назад (beta) -> Картка Вгору/Вниз (rotateX)
        const rotateX = (clampedBetaDelta / sensitivity) * maxRotation;
        // Телефон Вліво/Вправо (gamma) -> Картка Вліво/Вправо (rotateY)
        const rotateY = (clampedGammaDelta / sensitivity) * maxRotation;
            
        // Встановлюємо ціль для анімації
        targetRotation.current = { x: rotateX, y: rotateY };
    };
    
    // 🔥 ФІКС №2: Функція, яку викличе кнопка
    const requestPermission = () => {
        // @ts-ignore
        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
            // @ts-ignore
            DeviceOrientationEvent.requestPermission()
                .then((permissionState: string) => {
                    if (permissionState === 'granted') {
                        window.addEventListener('deviceorientation', orientationHandler);
                        setNeedsGyroPermission(false); // Ховаємо кнопку після успіху
                    }
                })
                .catch(console.error);
        }
    };

    useEffect(() => {
        const originalOverflow = window.getComputedStyle(document.body).overflow;
        const originalPaddingRight = window.getComputedStyle(document.body).paddingRight;
        document.body.style.overflow = 'hidden';

        const preventTouchMove = (e: TouchEvent) => { e.preventDefault(); };
        if (isTouchDevice) {
            document.body.addEventListener('touchmove', preventTouchMove, { passive: false });
        }

        // @ts-ignore
        if (isTouchDevice && typeof DeviceOrientationEvent.requestPermission === 'function') {
            setNeedsGyroPermission(true);
        } else if (isTouchDevice) {
            window.addEventListener('deviceorientation', orientationHandler);
        }

        const maxRotation = 12;
        const onMouseMove = (e: globalThis.MouseEvent) => {
            if (isTouchDevice || !modalRef.current) return;
            const rect = modalRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            const rotateY = (x / (rect.width / 2)) * maxRotation;
            const rotateX = -(y / (rect.height / 2)) * maxRotation;
            targetRotation.current = { x: rotateX, y: rotateY };
        };

        document.addEventListener('mousemove', onMouseMove);

        const animate = () => {
            if (!modalRef.current) return;
            currentRotation.current.x += (targetRotation.current.x - currentRotation.current.x) * easingFactor;
            currentRotation.current.y += (targetRotation.current.y - currentRotation.current.y) * easingFactor;
            modalRef.current.style.transform = `perspective(1000px) rotateX(${currentRotation.current.x}deg) rotateY(${currentRotation.current.y}deg)`;
            animationFrameId.current = requestAnimationFrame(animate);
        };
        animationFrameId.current = requestAnimationFrame(animate);

        return () => {
            document.body.style.overflow = originalOverflow;
            document.body.style.paddingRight = originalPaddingRight;
            if (isTouchDevice) {
                document.body.removeEventListener('touchmove', preventTouchMove);
            }
            document.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('deviceorientation', orientationHandler);
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
            homeRotation.current = null;
            targetRotation.current = { x: 0, y: 0 };
            currentRotation.current = { x: 0, y: 0 };
        };
    }, [isTouchDevice]);

    // Определяем цвет текста роли на основе роли пользователя
    const safeRole = user.role?.toLowerCase() || 'user';
    let roleTextColor = 'text-[#808080]'; // User - серый по умолчанию

    switch (safeRole) {
        case 'superadmin':
            roleTextColor = 'text-[#FF7F3B]'; // Orange
            break;
        case 'admin':
            roleTextColor = 'text-[#46D6C8]'; // Teal
            break;
        case 'editor':
            roleTextColor = 'text-[#A020F0]'; // Purple
            break;
        default: // User
            roleTextColor = 'text-[#808080]'; // Gray
    }

    return createPortal(
        <div
            onClick={onClose}
            className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 pl-[calc(1rem_+_var(--admin-sidebar-width,0px))] transition-all duration-300"
            style={{ cursor: 'none' }}
        >
            <div
                ref={modalRef}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-sm lg:max-w-md rounded-2xl border border-[#46D6C8]/20 bg-[#04070A]/80 backdrop-blur-lg shadow-[0_0_40px_rgba(70,214,200,0.2)]"
                style={{ transformStyle: 'preserve-3d' }}
            >
                <button
                    onClick={(e) => { e.stopPropagation(); onClose(); }}
                    className="absolute top-3 right-3 p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all z-10"
                    aria-label="Закрити"
                >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>

                {/* 🔥 ВНУТРІШНІЙ КОНТЕЙНЕР ("Контент")
                    Він відповідає ТІЛЬКИ за скрол.
                */}
                <div 
                    className="max-h-[85vh] overflow-y-auto p-4 lg:p-6"
                    style={{ transform: 'translateZ(0)' }} // Маленький трюк для плавності скролу
                >
                    {/* Заголовок (Аватар + Ім'я) */}
                    <div className="flex items-center space-x-3 lg:space-x-4 mb-4 lg:mb-6">
                        <span className="flex-shrink-0 h-16 w-16 flex items-center justify-center rounded-full bg-[#0a0e0c] ring-2 ring-[#46D6C8] text-3xl font-medium text-[#46D6C8] font-sans">
                            {user.display_name?.charAt(0).toUpperCase() || 'T'}
                        </span>
                        <div>
                            {/* Заголовок Tektur (display шрифт) */}
                            <h3 className="font-display text-2xl text-white">{user.display_name || 'Без імені'}</h3>
                            <p className="text-base text-gray-400 font-sans">{user.email || 'Email не вказано'}</p>
                        </div>
                    </div>

                    {/* Розділювач (неоновий) */}
                    <hr className="my-3 lg:my-4 h-px border-0 bg-white/10" />

                    {/* Інформація (дві колонки) */}
                    <dl className="grid grid-cols-1 gap-x-4 lg:gap-x-6 gap-y-2 lg:gap-y-3 sm:grid-cols-2">
                        {/* Роль | Статус */}
                        <div className="sm:col-span-1">
                            <dt className="text-sm lg:text-base font-medium text-gray-400 font-sans">Роль:</dt>
                            <dd className="mt-1 lg:mt-2">
                                <RolePill role={user.role} />
                            </dd>
                        </div>
                        <div className="sm:col-span-1">
                            <dt className="text-sm lg:text-base font-medium text-gray-400 font-sans">Статус:</dt>
                            <dd className="mt-1 lg:mt-2">
                                <StatusPill status={user.status || 'active'} />
                            </dd>
                        </div>
                        {/* Реальне ім'я | Позивний */}
                        <div className="sm:col-span-1">
                            <dt className="text-sm lg:text-base font-medium text-gray-400 font-sans">Реальне ім'я:</dt>
                            <dd className="text-base lg:text-lg text-white font-sans mt-1 lg:mt-2">{user.real_name || '—'}</dd>
                        </div>
                        <div className="sm:col-span-1">
                            <dt className="text-sm lg:text-base font-medium text-gray-400 font-sans">Позивний:</dt>
                            <dd className="text-base lg:text-lg text-white font-sans mt-1 lg:mt-2">{user.callsign || '—'}</dd>
                        </div>
                        {/* Телефон */}
                        <div className="sm:col-span-1">
                            <dt className="text-sm lg:text-base font-medium text-gray-400 font-sans">Телефон:</dt>
                            <dd className="text-base lg:text-lg text-white font-sans mt-1 lg:mt-2">{user.phone || '—'}</dd>
                        </div>
                        {/* ID (повна ширина) */}
                        <div className="sm:col-span-2">
                            <dt className="text-sm font-medium text-gray-400 font-sans">ID Користувача:</dt>
                            <dd className="text-xs text-gray-500 font-mono break-all font-sans">{user.id}</dd>
                        </div>

                        {/* Другий розділювач */}
                        <div className="sm:col-span-2">
                            <hr className="my-2 lg:my-3 h-px border-0 bg-white/10" />
                        </div>
                        <div className="sm:col-span-1">
                            <dt className="text-sm lg:text-base font-medium text-gray-400 font-sans">Дата реєстрації:</dt>
                            <dd className="text-base lg:text-lg text-white font-sans mt-1 lg:mt-2">{formatDate(user.created_at)}</dd>
                        </div>
                        <div className="sm:col-span-1">
                            <dt className="text-sm lg:text-base font-medium text-gray-400 font-sans">Останній візит:</dt>
                            <dd className="text-base lg:text-lg text-white font-sans mt-1 lg:mt-2">{formatDate(user.last_sign_in_at)}</dd>
                        </div>
                    </dl>

                    {/* 🔥 ФІКС №2: КНОПКА ДОЗВОЛУ ДЛЯ iOS 
                        Вона з'явиться тільки на iPhone, де потрібен дозвіл.
                    */}
                    {needsGyroPermission && (
                        <div className="mt-4 pt-4 border-t border-white/10">
                            <button
                                onClick={requestPermission}
                                className="w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold bg-[#46D6C8]/20 text-[#46D6C8] ring-1 ring-inset ring-[#46D6C8]/40 transition-all hover:bg-[#46D6C8]/30 font-sans cursor-target"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2h8a2 2 0 002-2v-1a2 2 0 012-2h1.945M7.688 15.312l-1.313 1.313m11-1.313l1.313 1.313M5.313 7.688l-1.313-1.313m1.313 1.313l-1.313-1.313M12 5.432v1.144M18.688 7.688l-1.313 1.313M12 18.568v-1.144m5.313-5.313l1.313 1.313M7.688 12h-1.144m11 0h1.144"></path>
                                </svg>
                                Увімкнути 3D (Гіроскоп)
                            </button>
                        </div>
                    )}
                </div> {/* Кінець внутрішнього контейнера скролу */}
            </div> {/* Кінець зовнішньої "рамки" 3D */}
        </div>,
        document.body
    );
}
