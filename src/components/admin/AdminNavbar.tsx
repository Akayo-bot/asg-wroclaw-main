import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { Home, ChevronDown, User } from 'lucide-react';
import { roleColors } from '@/components/admin/RolePill';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import AnimatedLogoutButton from '@/components/admin/AnimatedLogoutButton';
import SparkleEffect from '@/components/admin/SparkleEffect';
import BurgerMenuLottie from '@/components/BurgerMenuLottie';
import './AdminNavbarButtons.css';
import './SparkleNavbar.css';

interface AdminNavbarProps {
    onMenuClick?: () => void;
    isMenuOpen?: boolean;
}

const AdminNavbar = ({ onMenuClick, isMenuOpen = false }: AdminNavbarProps) => {
    const { profile, signOut } = useAuth();
    const { t } = useI18n();
    const navigate = useNavigate();
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const profileMenuRef = useRef<HTMLDivElement>(null);

    const handleLogout = async () => {
        setIsProfileMenuOpen(false);
        const { error } = await signOut();
        if (!error) {
            // Редирект на главную страницу после успешного выхода
            window.location.href = '/';
        } else {
            console.error('Logout error:', error);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            action();
        }
    };

    // Закрытие меню при клике вне его
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
                setIsProfileMenuOpen(false);
            }
        };

        if (isProfileMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isProfileMenuOpen]);

    // Get initials for avatar fallback
    const getInitials = (name: string | null) => {
        if (!name) return 'AD';
        const names = name.split(' ');
        if (names.length >= 2) {
            return `${names[0][0]}${names[1][0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    return (
        <nav className="sparkle-nav">
            {/* GLASS-фон (под спарками) */}
            <div className="sparkle-nav__glass"></div>

            <div className="sparkle-nav__inner">
                {/* Левая секция - Logo + Mobile Menu Button */}
                <div className="flex items-center gap-3">
                    {/* Mobile Menu Button */}
                    <div
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('Menu button clicked, calling onMenuClick');
                            onMenuClick?.();
                        }}
                        onTouchStart={(e) => {
                            e.stopPropagation();
                        }}
                        className="lg:hidden p-3 rounded-lg hover:bg-white/5 transition-colors cursor-target pointer-events-auto"
                        style={{
                            minWidth: '44px',
                            minHeight: '44px',
                            position: 'relative',
                            zIndex: 100
                        }}
                    >
                        <BurgerMenuLottie isOpen={isMenuOpen} className="w-5 h-5" />
                    </div>
                    <a href="#" className="sparkle-nav__logo">
                        <div 
                            className="sparkle-nav__logo-icon"
                            style={{
                                background: profile?.role === 'superadmin' ? 'linear-gradient(to bottom right, #FF7F3B, #FF5A1F)' :
                                           profile?.role === 'admin' ? 'linear-gradient(to bottom right, #00FF00, #00CC00)' :
                                           profile?.role === 'editor' ? 'linear-gradient(to bottom right, #A020F0, #8B1FA9)' :
                                           'linear-gradient(to bottom right, #808080, #666666)',
                                boxShadow: profile?.role === 'superadmin' ? '0 0 12px rgba(255,127,59,0.5)' :
                                          profile?.role === 'admin' ? '0 0 12px rgba(0,255,0,0.5)' :
                                          profile?.role === 'editor' ? '0 0 12px rgba(160,32,240,0.5)' :
                                          '0 0 8px rgba(128,128,128,0.3)',
                                border: `1px solid ${
                                    profile?.role === 'superadmin' ? 'rgba(255,127,59,0.4)' :
                                    profile?.role === 'admin' ? 'rgba(0,255,0,0.4)' :
                                    profile?.role === 'editor' ? 'rgba(160,32,240,0.4)' :
                                    'rgba(128,128,128,0.2)'
                                }`
                            }}
                        >
                            <span 
                                style={{
                                    color: profile?.role === 'superadmin' ? '#0a0a0a' :
                                          profile?.role === 'admin' ? '#0a0a0a' :
                                          profile?.role === 'editor' ? '#ffffff' :
                                          '#ffffff'
                                }}
                            >
                                A
                            </span>
                        </div>
                        <span className="sparkle-nav__logo-text hidden lg:inline">
                            {t('admin.title', 'Akayo Admin')}
                        </span>
                    </a>
                </div>

                {/* Правая секция - Actions (десктоп и мобильный) */}
                <div className="sparkle-nav__right flex items-center gap-2 lg:gap-3">
                    {/* --- 1. КНОПКА "НА ГОЛОВНУ" (только на десктопе) --- */}
                    <Link
                        to="/"
                        className="btn-home nav-link hidden lg:flex items-center gap-2 cursor-target"
                        tabIndex={0}
                        aria-label={t('nav.home', 'На головну')}
                        onKeyDown={(e) => handleKeyDown(e, () => window.location.href = '/')}
                        data-brackets
                    >
                        <Home className="h-4 w-4" />
                        <span>{t('nav.home', 'На головну')}</span>
                    </Link>

                    {/* --- 2. МЕНЮ ПРОФІЛЮ (Аватар + Текст) - видимо на всех экранах --- */}
                    <div className="relative" ref={profileMenuRef}>
                        <button
                            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                            className="btn-avatar cursor-target"
                            tabIndex={0}
                            aria-label="Меню профілю"
                            aria-expanded={isProfileMenuOpen}
                        >
                            <Avatar className="h-8 w-8 border-2" style={{ borderColor: 'var(--acc)' }}>
                                <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.display_name || 'User'} />
                                <AvatarFallback className="bg-gradient-to-br from-[#46D6C8] to-[#46D6C8] text-white text-xs">
                                    {getInitials(profile?.display_name || null)}
                                </AvatarFallback>
                            </Avatar>
                            {/* На мобильных: только имя, на десктопе: имя + роль */}
                            <div className="flex flex-col items-start hidden lg:flex">
                                <span className="name">{profile?.display_name || t('common.user', 'User')}</span>
                                <span 
                                    className={`text-xs font-medium ${
                                        roleColors[profile?.role?.toLowerCase() || 'user']?.text || roleColors.user.text
                                    }`}
                                >
                                    {profile?.role === 'superadmin' ? 'SuperAdmin' :
                                     profile?.role === 'admin' ? 'Admin' :
                                     profile?.role === 'editor' ? 'Editor' :
                                     'User'}
                                </span>
                            </div>
                            {/* На мобильных: только имя */}
                            <span className="name text-white text-sm font-medium lg:hidden">{profile?.display_name || t('common.user', 'User')}</span>
                            <ChevronDown className={`h-4 w-4 text-white transition-transform duration-200 ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Меню, що випадає */}
                        <AnimatePresence>
                            {isProfileMenuOpen && (
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
                                        onClick={() => setIsProfileMenuOpen(false)}
                                    >
                                        <span className="mi mi-user"></span>
                                        Profile
                                    </Link>
                                    <div className="sep"></div>
                                    <div className="menu-item danger" role="menuitem" style={{ padding: 0, border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                                        <AnimatedLogoutButton onClick={handleLogout} />
                                    </div>
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

export default AdminNavbar;

