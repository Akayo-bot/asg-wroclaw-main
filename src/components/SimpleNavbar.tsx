import { useState, useRef, useEffect } from 'react';
import { Menu, X, Target, User, LogOut, Crown } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Disclosure } from '@headlessui/react';
import { gsap } from 'gsap';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useI18n } from '@/contexts/I18nContext';
import { useAuth } from '@/contexts/AuthContext';
import { useBranding } from '@/contexts/BrandingContext';

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const SimpleNavbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { t } = useI18n();
    const { user, profile, signOut } = useAuth();
    const { settings } = useBranding();

    // Refs for GSAP animations
    const navRef = useRef<HTMLDivElement>(null);
    const activeElementRef = useRef<HTMLDivElement>(null);
    const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

    const navItems = [
        {
            label: t('nav.home', 'Home'),
            path: '/',
            description: t('nav.home_desc', 'Go to homepage')
        },
        {
            label: t('nav.games', 'Games'),
            path: '/games',
            description: t('nav.games_desc', 'View available games')
        },
        {
            label: t('nav.team', 'Team'),
            path: '/team',
            description: t('nav.team_desc', 'Meet our team')
        },
        {
            label: t('nav.gallery', 'Gallery'),
            path: '/gallery',
            description: t('nav.gallery_desc', 'View our gallery')
        },
        {
            label: t('nav.articles', 'Articles'),
            path: '/articles',
            description: t('nav.articles_desc', 'Read our articles')
        },
        {
            label: t('nav.contacts', 'Contacts'),
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

    // Update active index when route changes
    useEffect(() => {
        const currentPath = location.pathname;
        const index = navItems.findIndex(item => {
            if (item.path === '/' && currentPath === '/') return true;
            return currentPath.startsWith(item.path) && item.path !== '/';
        });
        console.log('SimpleNavbar: Route changed', {
            currentPath,
            index,
            activeIndex,
            navItems: navItems.map(item => item.path)
        });
        if (index >= 0 && index !== activeIndex) {
            console.log('SimpleNavbar: Updating activeIndex', { from: activeIndex, to: index });
            setActiveIndex(index);
        }
    }, [location.pathname, activeIndex, navItems]);

    // Helper function to calculate the horizontal offset for the active element
    const getOffsetLeft = (element: HTMLButtonElement) => {
        if (!navRef.current || !activeElementRef.current) {
            console.log('SimpleNavbar: getOffsetLeft - missing refs');
            return 0;
        }
        const elementRect = element.getBoundingClientRect();
        const navRect = navRef.current.getBoundingClientRect();
        const activeElementWidth = activeElementRef.current.offsetWidth;

        const offset = elementRect.left - navRect.left + (elementRect.width - activeElementWidth) / 2;
        console.log('SimpleNavbar: getOffsetLeft calculation', {
            elementRect: elementRect,
            navRect: navRect,
            activeElementWidth,
            offset
        });

        return offset;
    };

    // Initialize animation
    useEffect(() => {
        const initAnimation = () => {
            console.log('SimpleNavbar: Initializing animation');

            if (!navRef.current || !activeElementRef.current) {
                console.log('SimpleNavbar: Missing refs, retrying...');
                setTimeout(initAnimation, 100);
                return;
            }

            const activeButton = buttonRefs.current[activeIndex];
            if (!activeButton) {
                console.log('SimpleNavbar: No active button found');
                return;
            }

            console.log('SimpleNavbar: Found all elements, initializing...');

            // Set initial position
            const offset = getOffsetLeft(activeButton);
            gsap.set(activeElementRef.current, {
                x: offset,
                opacity: 1
            });

            console.log('SimpleNavbar: Animation initialized');
        };

        initAnimation();
    }, [activeIndex]);

    // Handler for button clicks
    const handleClick = (index: number) => {
        console.log('SimpleNavbar: handleClick called', { index, activeIndex });

        if (index === activeIndex) {
            console.log('SimpleNavbar: Same index, no animation needed');
            return;
        }

        const activeElement = activeElementRef.current;
        const newButton = buttonRefs.current[index];

        if (!activeElement || !newButton) {
            console.log('SimpleNavbar: Missing elements for animation');
            return;
        }

        console.log('SimpleNavbar: Starting animation to index', index);

        // Navigate to the selected route
        const selectedItem = navItems[index];
        if (selectedItem) {
            navigate(selectedItem.path);
        }

        // Simple animation
        const offset = getOffsetLeft(newButton);
        gsap.to(activeElement, {
            x: offset,
            duration: 0.3,
            ease: "power2.out"
        });

        setActiveIndex(index);
    };

    return (
        <>
            <style>{`
        .navigation-menu {
          margin: 0;
          position: relative;
          z-index: 1;
        }

        .navigation-menu ul {
          margin: 0;
          padding: 0;
          list-style: none;
          display: flex;
          gap: 40px;
        }

        .navigation-menu ul li button {
          -webkit-appearance: none;
          -moz-appearance: none;
          appearance: none;
          background: none;
          border: none;
          padding: 0;
          margin: 0;
          font: inherit;
          color: inherit;
          cursor: pointer;
          font-family: 'Rajdhani', sans-serif;
          font-weight: 600;
          font-size: 16px;
          letter-spacing: 0.05em;
          transition: color 0.2s ease;
        }

        .navigation-menu ul li:not(.active):hover button {
          color: #4CAF50;
        }

        .navigation-menu .active-element {
          position: absolute;
          top: 50%;
          left: 0;
          width: 100px;
          height: 4px;
          background: linear-gradient(90deg, #4CAF50, white);
          border-radius: 2px;
          transform: translateY(-50%);
          opacity: 0;
          pointer-events: none;
        }
      `}</style>

            <nav className="bg-background/95 backdrop-blur-md border-b border-border/20 sticky top-0 z-50">
                <div className="container mx-auto px-4 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        {/* Logo */}
                        <div className="flex items-center">
                            <Link to="/" className="flex items-center space-x-3 cursor-target">
                                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                                    <Target className="w-6 h-6 text-primary-foreground" />
                                </div>
                                <div className="hidden sm:block">
                                    <h1 className="font-rajdhani text-xl font-bold text-foreground">
                                        {settings?.siteName || 'RAVEN STRIKE'}
                                    </h1>
                                    <p className="font-inter text-xs text-muted-foreground uppercase tracking-wider">
                                        {settings?.tagline || 'TACTICAL AIRSOFT'}
                                    </p>
                                </div>
                            </Link>
                        </div>

                        {/* Desktop Navigation */}
                        <div className="hidden lg:flex lg:items-center lg:space-x-8">
                            <div className="flex items-center">
                                <nav className="navigation-menu" ref={navRef}>
                                    <ul>
                                        {navItems.map((item, index) => (
                                            <li key={item.path} className={index === activeIndex ? "active" : ""}>
                                                <button
                                                    ref={(el) => {
                                                        buttonRefs.current[index] = el;
                                                    }}
                                                    onClick={() => handleClick(index)}
                                                    className="text-foreground cursor-target"
                                                >
                                                    {item.label.toUpperCase()}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                    <div className="active-element" ref={activeElementRef} />
                                </nav>
                            </div>

                            <div className="flex items-center space-x-4">
                                <LanguageSwitcher />

                                {/* Auth Section */}
                                {user ? (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="relative h-10 w-10 rounded-full cursor-target">
                                                <Avatar className="h-10 w-10">
                                                    <AvatarImage src={profile?.avatar_url} alt={profile?.display_name} />
                                                    <AvatarFallback>
                                                        {profile?.display_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                                                    </AvatarFallback>
                                                </Avatar>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="w-56" align="end" forceMount>
                                            <div className="flex items-center justify-start gap-2 p-2">
                                                <div className="flex flex-col space-y-1 leading-none">
                                                    {profile?.display_name && (
                                                        <p className="font-medium">{profile.display_name}</p>
                                                    )}
                                                    {user.email && (
                                                        <p className="w-[200px] truncate text-sm text-muted-foreground">
                                                            {user.email}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem asChild>
                                                <Link to="/profile" className="flex items-center cursor-target">
                                                    <User className="mr-2 h-4 w-4" />
                                                    <span>{t('profile.title', 'Profile')}</span>
                                                </Link>
                                            </DropdownMenuItem>
                                            {(profile?.role === 'admin' || profile?.role === 'editor') && (
                                                <DropdownMenuItem asChild>
                                                    <Link to="/admin" className="flex items-center cursor-target">
                                                        <Target className="mr-2 h-4 w-4" />
                                                        <span>{t('admin.title', 'Admin Panel')}</span>
                                                    </Link>
                                                </DropdownMenuItem>
                                            )}
                                            {profile?.role === 'superadmin' && (
                                                <DropdownMenuItem asChild>
                                                    <Link to="/admin" className="flex items-center cursor-target">
                                                        <Crown className="mr-2 h-4 w-4 text-primary" />
                                                        <span>{t('admin.title', 'Admin Panel')}</span>
                                                    </Link>
                                                </DropdownMenuItem>
                                            )}
                                            <DropdownMenuItem asChild>
                                                <Link to="/games" className="flex items-center cursor-target">
                                                    <Target className="mr-2 h-4 w-4" />
                                                    <span>{t('nav.games', 'Games')}</span>
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={handleSignOut} className="cursor-target">
                                                <LogOut className="mr-2 h-4 w-4" />
                                                <span>{t('auth.logout', 'Logout')}</span>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                ) : (
                                    <Button asChild size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground cursor-target">
                                        <Link to="/auth">{t('auth.login', 'Login')}</Link>
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Mobile menu button */}
                        <div className="md:hidden">
                            <Disclosure.Button className="inline-flex items-center justify-center rounded-md p-2 text-foreground hover:text-primary hover:bg-muted focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary transition-colors cursor-target">
                                <span className="sr-only">Open main menu</span>
                                {isMenuOpen ? (
                                    <X className="block h-6 w-6" aria-hidden="true" />
                                ) : (
                                    <Menu className="block h-6 w-6" aria-hidden="true" />
                                )}
                            </Disclosure.Button>
                        </div>
                    </div>
                </div>

                {/* Mobile menu */}
                <Disclosure as="div" className="md:hidden">
                    {({ open, close }) => (
                        <>
                            <Disclosure.Panel className="bg-background/95 backdrop-blur-md border-t border-border/20">
                                <div className="px-2 pt-2 pb-3 space-y-1">
                                    {navItems.map((item) => (
                                        <Disclosure.Button
                                            key={item.path}
                                            as={Link}
                                            to={item.path}
                                            className={cn(
                                                "block px-3 py-2 rounded-md text-base font-medium transition-colors cursor-target",
                                                isActive(item.path)
                                                    ? "text-primary bg-primary/10"
                                                    : "text-foreground hover:text-primary hover:bg-muted"
                                            )}
                                            onClick={() => close()}
                                        >
                                            {item.label}
                                        </Disclosure.Button>
                                    ))}
                                </div>
                                <div className="pt-4 pb-3 border-t border-border/20">
                                    {user ? (
                                        <div className="px-3 py-2">
                                            <div className="flex items-center">
                                                <Avatar className="h-10 w-10">
                                                    <AvatarImage src={profile?.avatar_url} alt={profile?.display_name} />
                                                    <AvatarFallback>
                                                        {profile?.display_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="ml-3">
                                                    <div className="text-base font-medium text-foreground">
                                                        {profile?.display_name || user.email}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="mt-3 space-y-1">
                                                <Disclosure.Button
                                                    as={Link}
                                                    to="/profile"
                                                    className="block px-3 py-2 rounded-md text-base font-medium text-foreground hover:text-primary hover:bg-muted cursor-target"
                                                    onClick={() => close()}
                                                >
                                                    {t('profile.title', 'Profile')}
                                                </Disclosure.Button>
                                                {(profile?.role === 'admin' || profile?.role === 'editor') && (
                                                    <Disclosure.Button
                                                        as={Link}
                                                        to="/admin"
                                                        className="block px-3 py-2 rounded-md text-base font-medium text-foreground hover:text-primary hover:bg-muted cursor-target"
                                                        onClick={() => close()}
                                                    >
                                                        {t('admin.title', 'Admin Panel')}
                                                    </Disclosure.Button>
                                                )}
                                                <Disclosure.Button
                                                    onClick={() => {
                                                        handleSignOut();
                                                        close();
                                                    }}
                                                    className="block px-3 py-2 rounded-md text-base font-medium text-foreground hover:text-primary hover:bg-muted cursor-target"
                                                >
                                                    {t('auth.logout', 'Logout')}
                                                </Disclosure.Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="px-3 py-2">
                                            <Button
                                                asChild
                                                size="sm"
                                                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground cursor-target"
                                            >
                                                <Link to="/auth" onClick={() => close()}>
                                                    {t('auth.login', 'Login')}
                                                </Link>
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </Disclosure.Panel>
                        </>
                    )}
                </Disclosure>
            </nav>
        </>
    );
};

export default SimpleNavbar;
