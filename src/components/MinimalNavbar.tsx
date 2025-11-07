import { useState } from 'react';
import { Menu, X, Target, User, LogOut, Crown } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Disclosure } from '@headlessui/react';

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const MinimalNavbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    const navItems = [
        { label: 'Home', path: '/' },
        { label: 'Games', path: '/games' },
        { label: 'Team', path: '/team' },
        { label: 'Gallery', path: '/gallery' },
        { label: 'Articles', path: '/articles' },
        { label: 'Contacts', path: '/contacts' },
    ];

    const handleSignOut = async () => {
        navigate('/');
    };

    const isActive = (path: string) => {
        if (path === '/' && location.pathname === '/') return true;
        return location.pathname.startsWith(path) && path !== '/';
    };

    return (
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
                                    RAVEN STRIKE
                                </h1>
                                <p className="font-inter text-xs text-muted-foreground uppercase tracking-wider">
                                    TACTICAL AIRSOFT
                                </p>
                            </div>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden lg:flex lg:items-center lg:space-x-8">
                        <div className="flex items-center">
                            <nav className="flex items-center space-x-8">
                                {navItems.map((item) => (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        className={cn(
                                            "font-rajdhani font-semibold text-base transition-colors cursor-target",
                                            isActive(item.path)
                                                ? "text-primary"
                                                : "text-foreground hover:text-primary"
                                        )}
                                    >
                                        {item.label.toUpperCase()}
                                    </Link>
                                ))}
                            </nav>
                        </div>

                        <div className="flex items-center space-x-4">
                            {/* Auth Section */}
                            <Button asChild size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground cursor-target">
                                <Link to="/auth">Login</Link>
                            </Button>
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
                                <div className="px-3 py-2">
                                    <Button
                                        asChild
                                        size="sm"
                                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground cursor-target"
                                    >
                                        <Link to="/auth" onClick={() => close()}>
                                            Login
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </Disclosure.Panel>
                    </>
                )}
            </Disclosure>
        </nav>
    );
};

export default MinimalNavbar;



