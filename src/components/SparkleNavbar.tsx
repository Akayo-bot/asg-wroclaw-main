import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { Language } from '@/types/i18n';
import { useBranding } from '@/contexts/BrandingContext';
import { X, User, Settings, LogOut, Target, Crown } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import SparkleEffect from '@/components/admin/SparkleEffect';
import AnimatedLogoutButton from '@/components/admin/AnimatedLogoutButton';
import BurgerMenuLottie from '@/components/BurgerMenuLottie';
import { cn } from '@/lib/utils';
import { gsap } from 'gsap';
import { motion, AnimatePresence } from 'framer-motion';
import './admin/SparkleNavbar.css';

const languageCodes: Record<string, string> = {
    'uk': 'UA',
    'ru': 'RU',
    'en': 'EN',
    'pl': 'PL'
};

const SparkleNavbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const location = useLocation();
    const navigate = useNavigate();
    const { t, language, setLanguage } = useI18n();
    const { user, profile, signOut } = useAuth();
    const { settings } = useBranding();

    // Refs для анимации активного элемента
    const navRef = useRef<HTMLDivElement>(null);
    const activeElementRef = useRef<HTMLDivElement>(null);
    const linkRefs = useRef<(HTMLAnchorElement | null)[]>([]);
    const isAnimatingRef = useRef(false);

    const navItems = [
        {
            label: t('nav.home', 'HOME'),
            path: '/',
            description: t('nav.home_desc', 'Go to homepage')
        },
        {
            label: t('nav.games', 'ІГРИ'),
            path: '/games',
            description: t('nav.games_desc', 'Browse our airsoft games and events')
        },
        {
            label: t('nav.team', 'КОМАНДА'),
            path: '/team',
            description: t('nav.team_desc', 'Meet our experienced team members')
        },
        {
            label: t('nav.gallery', 'ГАЛЕРЕЯ'),
            path: '/gallery',
            description: t('nav.gallery_desc', 'View photos from our games and events')
        },
        {
            label: t('nav.articles', 'СТАТТІ'),
            path: '/articles',
            description: t('nav.articles_desc', 'Read our latest articles and guides')
        },
        {
            label: t('nav.contacts', 'КОНТАКТИ'),
            path: '/contacts',
            description: t('nav.contacts_desc', 'Get in touch with us')
        },
    ];

    const [activeIndex, setActiveIndex] = useState(() => {
        const currentPath = location.pathname;
        const index = navItems.findIndex(item => {
            if (item.path === '/' && currentPath === '/') return true;
            return currentPath.startsWith(item.path) && item.path !== '/';
        });
        return index >= 0 ? index : 0;
    });

    const handleSignOut = async () => {
        await signOut();
        navigate('/');
    };

    const isActive = (path: string) => {
        if (path === '/' && location.pathname === '/') return true;
        return location.pathname.startsWith(path) && path !== '/';
    };

    // Update active index when route changes (from browser back/forward)
    useEffect(() => {
        const currentPath = location.pathname;
        const index = navItems.findIndex(item => {
            if (item.path === '/' && currentPath === '/') return true;
            return currentPath.startsWith(item.path) && item.path !== '/';
        });
        if (index >= 0) {
            setActiveIndex(index);
            // Позиция обновится автоматически через useLayoutEffect
        } else {
            // Если путь не найден (например, /profile), выбираем индекс HOME
            setActiveIndex(0);
        }
    }, [location.pathname, navItems]);

    // Update bar on resize
    useEffect(() => {
        const handleResize = () => {
            const activeLink = linkRefs.current[activeIndex];
            if (navRef.current && activeElementRef.current && activeLink) {
                const x = getOffsetLeft(activeLink);
                gsap.set(activeElementRef.current, { x });
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [activeIndex]);

    // Create SVG для анимированной полоски
    const createSVG = (element: HTMLDivElement) => {
        const color = '#00ff88'; // Green color
        element.innerHTML = `
            <svg viewBox="0 0 116 5" preserveAspectRatio="none" class="beam">
                <path d="M0.5 2.5L113 0.534929C114.099 0.515738 115 1.40113 115 2.5C115 3.59887 114.099 4.48426 113 4.46507L0.5 2.5Z" fill="url(#gradient-beam)"/>
                <defs>
                    <linearGradient id="gradient-beam" x1="2" y1="2.5" x2="115" y2="2.5" gradientUnits="userSpaceOnUse">
                        <stop stop-color="${color}"/>
                        <stop offset="1" stop-color="white"/>
                    </linearGradient>
                </defs>
            </svg>
            <div class="strike">
                <svg viewBox="0 0 114 12" preserveAspectRatio="none">
                    <g fill="none" stroke="white" stroke-width="0.75" stroke-linecap="round">
                        <path d="M113.5 6.5L109.068 8.9621C109.023 8.98721 108.974 9.00516 108.923 9.01531L106.889 9.42219C106.661 9.46776 106.432 9.35034 106.336 9.1388L104.045 4.0986C104.015 4.03362 104 3.96307 104 3.8917V2.12268C104 1.6898 103.487 1.46145 103.166 1.75103L99.2887 5.24019C99.1188 5.39305 98.867 5.41132 98.6768 5.28457L95.0699 2.87996C94.7881 2.69205 94.4049 2.83291 94.3118 3.15862L92.6148 9.09827C92.5483 9.33084 92.3249 9.48249 92.0843 9.45843L87.7087 9.02087C87.5752 9.00752 87.4419 9.04839 87.3389 9.13428L84.9485 11.1263C84.7128 11.3227 84.3575 11.2625 84.1996 10.9994L81.7602 6.93359C81.617 6.69492 81.3064 6.61913 81.0694 6.76501L75.3165 10.3052C75.1286 10.4209 74.8871 10.3997 74.7223 10.2531L70.6678 6.64917C70.5611 6.55429 70.5 6.41829 70.5 6.27547V1.20711C70.5 1.0745 70.4473 0.947322 70.3536 0.853553L70.2185 0.718508C70.0846 0.584592 69.8865 0.537831 69.7068 0.59772L69.2675 0.744166C68.9149 0.861705 68.8092 1.30924 69.0721 1.57206L69.605 2.10499C69.8157 2.31571 69.7965 2.66281 69.5638 2.84897L67.5 4.5L65.2715 6.28282C65.1083 6.41338 64.8811 6.42866 64.7019 6.32113L60.3621 3.71725C60.153 3.59179 59.8839 3.63546 59.7252 3.8206L57.0401 6.95327C57.0135 6.9843 56.9908 7.01849 56.9725 7.05505L55.2533 10.4934C55.1188 10.7624 54.779 10.8526 54.5287 10.6858L50.7686 8.17907C50.6051 8.07006 50.3929 8.06694 50.2263 8.17109L46.7094 10.3691C46.5774 10.4516 46.4145 10.468 46.2688 10.4133L42.6586 9.05949C42.5558 9.02091 42.4684 8.94951 42.4102 8.85633L40.1248 5.1997C40.0458 5.07323 40.0273 4.91808 40.0745 4.77659L40.6374 3.08777C40.7755 2.67359 40.3536 2.29381 39.9562 2.47447L35.5 4.5L32.2657 5.88613C32.1013 5.95658 31.9118 5.93386 31.7687 5.82656L30.1904 4.64279C30.0699 4.55245 29.9152 4.5212 29.7691 4.55772L26.2009 5.44977C26.0723 5.48193 25.9617 5.56388 25.8934 5.67759L23.1949 10.1752C23.0796 10.3673 22.8507 10.4593 22.6346 10.4003L17.6887 9.05148C17.5674 9.01838 17.463 8.94076 17.3963 8.83409L15.3331 5.53299C15.1627 5.26032 14.7829 5.21707 14.5556 5.44443L12.1464 7.85355C12.0527 7.94732 11.9255 8 11.7929 8H8.15139C8.05268 8 7.95617 7.97078 7.87404 7.91603L3.74143 5.16095C3.59214 5.06142 3.40096 5.04952 3.24047 5.12976L0.5 6.5" />
                    </g>
                </svg>
            </div>
        `;
    };

    // Helper to get offset left for active element
    const getOffsetLeft = (element: HTMLAnchorElement) => {
        if (!navRef.current || !activeElementRef.current) return 0;
        const elementRect = element.getBoundingClientRect();
        const navRect = navRef.current.getBoundingClientRect();
        const activeElementWidth = activeElementRef.current.offsetWidth;
        return (
            elementRect.left -
            navRect.left +
            (elementRect.width - activeElementWidth) / 2
        );
    };

    // Bar width calculation - красивая ширина относительно кнопки
    const barWidthFor = (el: HTMLAnchorElement) => {
        const w = el.getBoundingClientRect().width;
        return Math.round(Math.min(64, Math.max(36, w - 16))); // 36-64px
    };

    // Position bar under active link
    const positionBar = (target?: HTMLAnchorElement) => {
        if (!navRef.current || !activeElementRef.current) return;
        const targetLink = target || linkRefs.current[activeIndex];
        if (!targetLink) return;

        const wrapBox = navRef.current.getBoundingClientRect();
        const linkBox = targetLink.getBoundingClientRect();
        const barW = barWidthFor(targetLink);

        // Центрируем полосу под кнопкой
        const x = (linkBox.left - wrapBox.left) + (linkBox.width - barW) / 2;

        gsap.set(activeElementRef.current, { x });
    };

    // Initialize bar position - после полной прогрузки всех стилей
    useLayoutEffect(() => {
        // Двойной requestAnimationFrame для гарантии, что все стили применены
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                const activeLink = linkRefs.current[activeIndex];
                if (navRef.current && activeElementRef.current && activeLink) {
                    // Дополнительная задержка для применения всех стилей
                    setTimeout(() => {
                        const x = getOffsetLeft(activeLink);
                        gsap.set(activeElementRef.current, { x });
                        // Показываем полоску только после позиционирования
                        gsap.to(activeElementRef.current, {
                            '--active-element-show': '1',
                            duration: 0.1,
                        });
                    }, 300); // Увеличена задержка для полной прогрузки всех элементов
                }
            });
        });
    }, [activeIndex]);

    // Handler for link clicks - с полной keyframes анимацией
    const handleLinkClick = (index: number) => {
        const navElement = navRef.current;
        const activeElement = activeElementRef.current;
        const oldLink = linkRefs.current[activeIndex];
        const newLink = linkRefs.current[index];

        if (!navElement || !activeElement || !oldLink || !newLink) return;
        if (isAnimatingRef.current) return; // игнор пока анимация идёт
        isAnimatingRef.current = true;

        const selectedItem = navItems[index];

        const x = getOffsetLeft(newLink);
        const direction = index > activeIndex ? 'after' : 'before';
        const spacing = Math.abs(x - getOffsetLeft(oldLink));

        navElement.classList.add(direction);

        gsap.set(activeElement, {
            rotateY: direction === 'before' ? '180deg' : '0deg',
        });

        gsap.to(activeElement, {
            keyframes: [
                {
                    '--active-element-width': `${spacing > navElement.offsetWidth - 60 ? navElement.offsetWidth - 60 : spacing}px`,
                    duration: 0.3,
                    ease: 'none',
                    onStart: () => {
                        createSVG(activeElement);
                        gsap.to(activeElement, {
                            '--active-element-opacity': 1,
                            duration: 0.1,
                        });
                    },
                },
                {
                    '--active-element-scale-x': '0',
                    '--active-element-scale-y': '.25',
                    '--active-element-width': '0px',
                    duration: 0.3,
                    onStart: () => {
                        gsap.to(activeElement, {
                            '--active-element-mask-position': '40%',
                            duration: 0.5,
                        });
                        gsap.to(activeElement, {
                            '--active-element-opacity': 0,
                            delay: 0.45,
                            duration: 0.25,
                        });
                    },
                    onComplete: () => {
                        activeElement.innerHTML = '';
                        navElement.classList.remove('before', 'after');
                        gsap.set(activeElement, {
                            x: getOffsetLeft(newLink),
                            '--active-element-show': '1',
                        });
                        setActiveIndex(index);
                        isAnimatingRef.current = false;
                        if (selectedItem) navigate(selectedItem.path); // <-- навигация после анимации
                    },
                },
            ],
        });

        gsap.to(activeElement, {
            x,
            '--active-element-strike-x': '-50%',
            duration: 0.6,
            ease: 'none',
        });
    };


    // Get initials for avatar fallback
    const getInitials = (name: string | null) => {
        if (!name) return 'U';
        const names = name.split(' ');
        if (names.length >= 2) {
            return `${names[0][0]}${names[1][0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    // Check if user has admin access
    const hasAdminAccess = profile && ['superadmin', 'admin', 'editor'].includes(profile.role);

    // Dropdown handlers
    const toggleDropdown = (dropdownName: string) => {
        setOpenDropdown(openDropdown === dropdownName ? null : dropdownName);
    };

    const closeDropdowns = () => {
        setOpenDropdown(null);
    };

    // Language change handler
    const handleLanguageChange = (lang: Language) => {
        setLanguage(lang);
        setOpenDropdown(null);
    };

    // Close dropdowns on outside click
    useEffect(() => {
        const handleClickOutside = () => {
            if (openDropdown) {
                closeDropdowns();
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [openDropdown]);

    return (
        <nav className="sparkle-nav">
            {/* GLASS-фон (под спарками) */}
            <div className="sparkle-nav__glass"></div>

            <div className="sparkle-nav__inner">
                {/* Левая секция - Logo */}
                <Link to="/" className="sparkle-nav__logo">
                    <div className="sparkle-nav__logo-icon">
                        {settings?.logo_url ? (
                            <img src={settings.logo_url} alt="Logo" className="w-full h-full object-contain" />
                        ) : (
                            <Target className="w-5 h-5" />
                        )}
                    </div>
                    <span className="sparkle-nav__logo-text">
                        {settings?.site_name || 'ASG Wrocław'}
                    </span>
                </Link>

                {/* Центр - Navigation Links (Desktop) */}
                <div ref={navRef} className="hidden lg:flex sparkle-nav__links items-center gap-2 relative">
                    {navItems.map((item, index) => (
                        <Link
                            key={item.path}
                            ref={el => linkRefs.current[index] = el}
                            to={item.path}
                            onClick={(e) => {
                                e.preventDefault();
                                handleLinkClick(index);
                            }}
                            className={cn(
                                'nav-link',
                                isActive(item.path) && 'is-active'
                            )}
                            data-brackets
                            aria-label={item.description}
                        >
                            {item.label}
                        </Link>
                    ))}

                    {/* Анимированная полоска */}
                    <div className="active-element" ref={activeElementRef} />
                </div>

                {/* Правая секция - Language, User, Admin */}
                <div className="sparkle-nav__right">
                    {/* Language Switcher */}
                    <div className={cn("dropdown")} onClick={(e) => e.stopPropagation()}>
                        <button
                            className="btn-icon"
                            onClick={() => toggleDropdown('language')}
                            aria-label="Select language"
                        >
                            <span className="icon">🌐</span>
                            <span className="ml-2">{languageCodes[language] || 'UA'}</span>
                        </button>
                        <AnimatePresence>
                            {openDropdown === 'language' && (
                                <motion.div
                                    className="menu-panel"
                                    role="menu"
                                    initial={{ y: 70, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    exit={{ y: 100, opacity: 0 }}
                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                >
                                    <button
                                        className={cn("menu-item", language === 'uk' && "is-active")}
                                        role="menuitem"
                                        onClick={() => handleLanguageChange('uk')}
                                    >
                                        <span className="tag">UA</span> Українська
                                    </button>
                                    <button
                                        className={cn("menu-item", language === 'ru' && "is-active")}
                                        role="menuitem"
                                        onClick={() => handleLanguageChange('ru')}
                                    >
                                        <span className="tag">RU</span> Русский
                                    </button>
                                    <button
                                        className={cn("menu-item", language === 'pl' && "is-active")}
                                        role="menuitem"
                                        onClick={() => handleLanguageChange('pl')}
                                    >
                                        <span className="tag">PL</span> Polski
                                    </button>
                                    <button
                                        className={cn("menu-item", language === 'en' && "is-active")}
                                        role="menuitem"
                                        onClick={() => handleLanguageChange('en')}
                                    >
                                        <span className="tag">EN</span> English
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* User Menu */}
                    {user && profile ? (
                        <div className={cn("dropdown")} onClick={(e) => e.stopPropagation()}>
                            <button
                                className="btn-avatar"
                                onClick={() => toggleDropdown('user')}
                                aria-label="User menu"
                            >
                                <Avatar className="h-8 w-8 border-2" style={{ borderColor: 'var(--acc)' }}>
                                    <AvatarImage
                                        src={profile.avatar_url || undefined}
                                        alt={profile.display_name || 'User'}
                                    />
                                    <AvatarFallback className="bg-gradient-to-br from-green-500 to-emerald-600 text-white text-xs">
                                        {getInitials(profile.display_name || null)}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="name hidden sm:block">{profile.display_name}</span>
                            </button>
                            <AnimatePresence>
                                {openDropdown === 'user' && (
                                    <motion.div
                                        className="menu-panel"
                                        role="menu"
                                        initial={{ y: 70, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        exit={{ y: 100, opacity: 0 }}
                                        transition={{ duration: 0.3, ease: "easeInOut" }}
                                    >
                                        <Link
                                            to="/profile"
                                            className="menu-item"
                                            role="menuitem"
                                            onClick={() => setOpenDropdown(null)}
                                        >
                                            <span className="mi mi-user"></span>
                                            Profile
                                        </Link>
                                        {hasAdminAccess && (
                                            <>
                                                <Link
                                                    to="/admin"
                                                    className="menu-item"
                                                    role="menuitem"
                                                    onClick={() => setOpenDropdown(null)}
                                                >
                                                    <span className="mi mi-crown mi-neon"></span>
                                                    Admin Panel
                                                </Link>
                                            </>
                                        )}
                                        <div className="sep"></div>
                                        <div className="menu-item danger" role="menuitem" style={{ padding: 0, border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                                            <AnimatedLogoutButton onClick={handleSignOut} />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <Link
                            to="/auth"
                            className="nav-link flex items-center gap-2"
                            data-brackets
                        >
                            <User className="h-4 w-4" />
                            <span className="hidden sm:inline">{t('auth.login', 'Login')}</span>
                        </Link>
                    )}

                    {/* Mobile Menu Button */}
                    <div className={cn("dropdown")} onClick={(e) => e.stopPropagation()}>
                        <button
                            className="btn-icon lg:hidden flex items-center justify-center"
                            onClick={() => setOpenDropdown(openDropdown === 'burger' ? null : 'burger')}
                            aria-label="Toggle menu"
                        >
                            <BurgerMenuLottie isOpen={openDropdown === 'burger'} className="w-6 h-6" />
                        </button>
                        <AnimatePresence>
                            {openDropdown === 'burger' && (
                                <motion.div
                                    className="menu-panel"
                                    role="menu"
                                    initial={{ y: 70, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    exit={{ y: 100, opacity: 0 }}
                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                >
                                    {navItems.map((item, index) => (
                                        <Link
                                            key={item.path}
                                            to={item.path}
                                            className={cn("menu-item", isActive(item.path) && "is-active")}
                                            role="menuitem"
                                            onClick={() => {
                                                setOpenDropdown(null);
                                                handleLinkClick(index);
                                            }}
                                        >
                                            {item.label}
                                        </Link>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>


            {/* Слой с «спарками/рамками/искрой» */}
            <div className="sparkle-layer">
                <SparkleEffect />
                {/* Декоративная градиентная линия */}
                <div className="sparkle-nav__gradient-line" />
            </div>
        </nav>
    );
};

export default SparkleNavbar;

