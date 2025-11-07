import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { Home } from 'lucide-react';
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

    const handleLogout = () => {
        signOut();
    };

    const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            action();
        }
    };

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
                        <BurgerMenuLottie isOpen={isMenuOpen} className="w-6 h-6" />
                    </div>
                    <a href="#" className="sparkle-nav__logo">
                        <div className="sparkle-nav__logo-icon">
                            <span>A</span>
                        </div>
                        <span className="sparkle-nav__logo-text hidden sm:inline">
                            {t('admin.title', 'Akayo Admin')}
                        </span>
                    </a>
                </div>

                {/* Центр - User info */}
                <div className="hidden sm:flex sparkle-nav__user-info">
                    <Avatar className="h-7 w-7">
                        <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.display_name || 'User'} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                            {getInitials(profile?.display_name || null)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                        <span className="sparkle-nav__user-name">
                            {profile?.display_name || t('common.user', 'User')}
                        </span>
                        <span className="sparkle-nav__user-role">
                            {profile?.role || 'admin'}
                        </span>
                    </div>
                </div>

                {/* Правая секция - Actions (скрыта на мобильных, показывается в бургер-меню) */}
                <div className="sparkle-nav__right hidden lg:flex items-center gap-2">
                    {/* Home link */}
                    <Link
                        to="/"
                        className="btn-home nav-link flex items-center gap-2 cursor-target"
                        tabIndex={0}
                        aria-label={t('nav.home', 'На головну')}
                        onKeyDown={(e) => handleKeyDown(e, () => window.location.href = '/')}
                        data-brackets
                    >
                        <Home className="h-4 w-4" />
                        <span>{t('nav.home', 'На головну')}</span>
                    </Link>

                    {/* Animated Logout button */}
                    <AnimatedLogoutButton onClick={handleLogout} />
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

