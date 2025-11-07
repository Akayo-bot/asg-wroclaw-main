import { useState } from 'react';
import { Menu, X, Target, User, LogOut, Crown, Search, Bell, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Disclosure, Transition } from '@headlessui/react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Пример 1: Минималистичный Navbar
export const MinimalNavbar = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Disclosure as="nav" className="bg-white shadow-sm border-b">
            {({ open }) => (
                <>
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex h-16 justify-between">
                            <div className="flex">
                                <div className="flex flex-shrink-0 items-center">
                                    <Link to="/" className="flex items-center space-x-2">
                                        <Target className="h-8 w-8 text-blue-600" />
                                        <span className="text-xl font-bold text-gray-900">Brand</span>
                                    </Link>
                                </div>
                                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                                    <Link to="/" className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700">
                                        Home
                                    </Link>
                                    <Link to="/about" className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700">
                                        About
                                    </Link>
                                    <Link to="/contact" className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700">
                                        Contact
                                    </Link>
                                </div>
                            </div>
                            <div className="hidden sm:ml-6 sm:flex sm:items-center">
                                <Button variant="outline" size="sm">
                                    Sign in
                                </Button>
                            </div>
                            <div className="-mr-2 flex items-center sm:hidden">
                                <Disclosure.Button className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500">
                                    <span className="sr-only">Open main menu</span>
                                    {open ? (
                                        <X className="block h-6 w-6" aria-hidden="true" />
                                    ) : (
                                        <Menu className="block h-6 w-6" aria-hidden="true" />
                                    )}
                                </Disclosure.Button>
                            </div>
                        </div>
                    </div>

                    <Disclosure.Panel className="sm:hidden">
                        <div className="space-y-1 pb-3 pt-2">
                            <Disclosure.Button as={Link} to="/" className="block border-l-4 border-transparent py-2 pl-3 pr-4 text-base font-medium text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700">
                                Home
                            </Disclosure.Button>
                            <Disclosure.Button as={Link} to="/about" className="block border-l-4 border-transparent py-2 pl-3 pr-4 text-base font-medium text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700">
                                About
                            </Disclosure.Button>
                            <Disclosure.Button as={Link} to="/contact" className="block border-l-4 border-transparent py-2 pl-3 pr-4 text-base font-medium text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700">
                                Contact
                            </Disclosure.Button>
                        </div>
                    </Disclosure.Panel>
                </>
            )}
        </Disclosure>
    );
};

// Пример 2: Современный Navbar с поиском
export const SearchNavbar = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Disclosure as="nav" className="bg-white shadow-lg">
            {({ open }) => (
                <>
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex h-20 justify-between">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <Link to="/" className="flex items-center space-x-3">
                                        <Target className="h-10 w-10 text-blue-600" />
                                        <div>
                                            <h1 className="text-2xl font-bold text-gray-900">Brand</h1>
                                            <p className="text-xs text-gray-500">Tagline</p>
                                        </div>
                                    </Link>
                                </div>
                                <div className="hidden md:ml-10 md:flex md:space-x-8">
                                    <Link to="/" className="text-gray-900 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors">
                                        Home
                                    </Link>
                                    <Link to="/products" className="text-gray-500 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors">
                                        Products
                                    </Link>
                                    <Link to="/services" className="text-gray-500 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors">
                                        Services
                                    </Link>
                                    <Link to="/about" className="text-gray-500 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors">
                                        About
                                    </Link>
                                </div>
                            </div>

                            <div className="flex items-center space-x-4">
                                <div className="hidden md:block">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                        <Input
                                            type="text"
                                            placeholder="Search..."
                                            className="pl-10 w-64"
                                        />
                                    </div>
                                </div>

                                <Button variant="ghost" size="sm" className="relative">
                                    <Bell className="h-5 w-5" />
                                    <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs">3</Badge>
                                </Button>

                                <Avatar className="h-8 w-8">
                                    <AvatarImage src="" alt="User" />
                                    <AvatarFallback>U</AvatarFallback>
                                </Avatar>
                            </div>

                            <div className="md:hidden">
                                <Disclosure.Button className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500">
                                    <span className="sr-only">Open main menu</span>
                                    {open ? (
                                        <X className="block h-6 w-6" aria-hidden="true" />
                                    ) : (
                                        <Menu className="block h-6 w-6" aria-hidden="true" />
                                    )}
                                </Disclosure.Button>
                            </div>
                        </div>
                    </div>

                    <Disclosure.Panel className="md:hidden">
                        <div className="space-y-1 px-2 pb-3 pt-2">
                            <div className="px-3 py-2">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                    <Input
                                        type="text"
                                        placeholder="Search..."
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                            <Disclosure.Button as={Link} to="/" className="block rounded-md px-3 py-2 text-base font-medium text-gray-900 hover:bg-gray-50">
                                Home
                            </Disclosure.Button>
                            <Disclosure.Button as={Link} to="/products" className="block rounded-md px-3 py-2 text-base font-medium text-gray-500 hover:bg-gray-50">
                                Products
                            </Disclosure.Button>
                            <Disclosure.Button as={Link} to="/services" className="block rounded-md px-3 py-2 text-base font-medium text-gray-500 hover:bg-gray-50">
                                Services
                            </Disclosure.Button>
                            <Disclosure.Button as={Link} to="/about" className="block rounded-md px-3 py-2 text-base font-medium text-gray-500 hover:bg-gray-50">
                                About
                            </Disclosure.Button>
                        </div>
                    </Disclosure.Panel>
                </>
            )}
        </Disclosure>
    );
};

// Пример 3: Темный Navbar
export const DarkNavbar = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Disclosure as="nav" className="bg-gray-900">
            {({ open }) => (
                <>
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex h-16 justify-between">
                            <div className="flex">
                                <div className="flex flex-shrink-0 items-center">
                                    <Link to="/" className="flex items-center space-x-2">
                                        <Target className="h-8 w-8 text-blue-400" />
                                        <span className="text-xl font-bold text-white">Brand</span>
                                    </Link>
                                </div>
                                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                                    <Link to="/" className="text-white hover:text-blue-400 px-3 py-2 text-sm font-medium transition-colors">
                                        Home
                                    </Link>
                                    <Link to="/about" className="text-gray-300 hover:text-blue-400 px-3 py-2 text-sm font-medium transition-colors">
                                        About
                                    </Link>
                                    <Link to="/contact" className="text-gray-300 hover:text-blue-400 px-3 py-2 text-sm font-medium transition-colors">
                                        Contact
                                    </Link>
                                </div>
                            </div>
                            <div className="hidden sm:ml-6 sm:flex sm:items-center">
                                <Button variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-gray-800">
                                    Sign in
                                </Button>
                            </div>
                            <div className="-mr-2 flex items-center sm:hidden">
                                <Disclosure.Button className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500">
                                    <span className="sr-only">Open main menu</span>
                                    {open ? (
                                        <X className="block h-6 w-6" aria-hidden="true" />
                                    ) : (
                                        <Menu className="block h-6 w-6" aria-hidden="true" />
                                    )}
                                </Disclosure.Button>
                            </div>
                        </div>
                    </div>

                    <Disclosure.Panel className="sm:hidden">
                        <div className="space-y-1 px-2 pb-3 pt-2">
                            <Disclosure.Button as={Link} to="/" className="block rounded-md px-3 py-2 text-base font-medium text-white hover:bg-gray-700">
                                Home
                            </Disclosure.Button>
                            <Disclosure.Button as={Link} to="/about" className="block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-gray-700">
                                About
                            </Disclosure.Button>
                            <Disclosure.Button as={Link} to="/contact" className="block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-gray-700">
                                Contact
                            </Disclosure.Button>
                        </div>
                    </Disclosure.Panel>
                </>
            )}
        </Disclosure>
    );
};

// Пример 4: Градиентный Navbar
export const GradientNavbar = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Disclosure as="nav" className="bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg">
            {({ open }) => (
                <>
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex h-16 justify-between">
                            <div className="flex">
                                <div className="flex flex-shrink-0 items-center">
                                    <Link to="/" className="flex items-center space-x-2">
                                        <Target className="h-8 w-8 text-white" />
                                        <span className="text-xl font-bold text-white">Brand</span>
                                    </Link>
                                </div>
                                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                                    <Link to="/" className="text-white hover:text-blue-200 px-3 py-2 text-sm font-medium transition-colors">
                                        Home
                                    </Link>
                                    <Link to="/about" className="text-blue-100 hover:text-white px-3 py-2 text-sm font-medium transition-colors">
                                        About
                                    </Link>
                                    <Link to="/contact" className="text-blue-100 hover:text-white px-3 py-2 text-sm font-medium transition-colors">
                                        Contact
                                    </Link>
                                </div>
                            </div>
                            <div className="hidden sm:ml-6 sm:flex sm:items-center">
                                <Button variant="outline" size="sm" className="border-white text-white hover:bg-white hover:text-blue-600">
                                    Sign in
                                </Button>
                            </div>
                            <div className="-mr-2 flex items-center sm:hidden">
                                <Disclosure.Button className="inline-flex items-center justify-center rounded-md p-2 text-blue-100 hover:bg-blue-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
                                    <span className="sr-only">Open main menu</span>
                                    {open ? (
                                        <X className="block h-6 w-6" aria-hidden="true" />
                                    ) : (
                                        <Menu className="block h-6 w-6" aria-hidden="true" />
                                    )}
                                </Disclosure.Button>
                            </div>
                        </div>
                    </div>

                    <Disclosure.Panel className="sm:hidden">
                        <div className="space-y-1 px-2 pb-3 pt-2">
                            <Disclosure.Button as={Link} to="/" className="block rounded-md px-3 py-2 text-base font-medium text-white hover:bg-blue-700">
                                Home
                            </Disclosure.Button>
                            <Disclosure.Button as={Link} to="/about" className="block rounded-md px-3 py-2 text-base font-medium text-blue-100 hover:bg-blue-700">
                                About
                            </Disclosure.Button>
                            <Disclosure.Button as={Link} to="/contact" className="block rounded-md px-3 py-2 text-base font-medium text-blue-100 hover:bg-blue-700">
                                Contact
                            </Disclosure.Button>
                        </div>
                    </Disclosure.Panel>
                </>
            )}
        </Disclosure>
    );
};

// Демо компонент для показа всех стилей
export const NavbarShowcase = () => {
    const [activeExample, setActiveExample] = useState('minimal');

    const examples = [
        { id: 'minimal', name: 'Minimal', component: MinimalNavbar },
        { id: 'search', name: 'With Search', component: SearchNavbar },
        { id: 'dark', name: 'Dark Theme', component: DarkNavbar },
        { id: 'gradient', name: 'Gradient', component: GradientNavbar },
    ];

    const ActiveComponent = examples.find(ex => ex.id === activeExample)?.component || MinimalNavbar;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Контролы для переключения примеров */}
            <div className="bg-white shadow-sm border-b p-4">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Modern Navbar Examples</h2>
                    <div className="flex flex-wrap gap-2">
                        {examples.map((example) => (
                            <Button
                                key={example.id}
                                variant={activeExample === example.id ? "default" : "outline"}
                                size="sm"
                                onClick={() => setActiveExample(example.id)}
                            >
                                {example.name}
                            </Button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Активный пример */}
            <div className="relative">
                <ActiveComponent />

                {/* Контент для демонстрации */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="text-center">
                        <h1 className="text-4xl font-bold text-gray-900 mb-4">
                            Welcome to {examples.find(ex => ex.id === activeExample)?.name} Navbar
                        </h1>
                        <p className="text-xl text-gray-600 mb-8">
                            This is a demonstration of the {examples.find(ex => ex.id === activeExample)?.name.toLowerCase()} navbar style.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="bg-white p-6 rounded-lg shadow-md">
                                <h3 className="text-lg font-semibold mb-2">Feature 1</h3>
                                <p className="text-gray-600">Description of the first feature.</p>
                            </div>
                            <div className="bg-white p-6 rounded-lg shadow-md">
                                <h3 className="text-lg font-semibold mb-2">Feature 2</h3>
                                <p className="text-gray-600">Description of the second feature.</p>
                            </div>
                            <div className="bg-white p-6 rounded-lg shadow-md">
                                <h3 className="text-lg font-semibold mb-2">Feature 3</h3>
                                <p className="text-gray-600">Description of the third feature.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
