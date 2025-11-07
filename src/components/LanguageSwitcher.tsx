import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import { Language } from '@/types/i18n';

const languages = [
    { code: 'uk' as Language, name: 'Українська', short: 'UA' },
    { code: 'ru' as Language, name: 'Русский', short: 'RU' },
    { code: 'pl' as Language, name: 'Polski', short: 'PL' },
    { code: 'en' as Language, name: 'English', short: 'EN' },
];

export const LanguageSwitcher = () => {
    const { language, setLanguage } = useI18n();

    const currentLang = languages.find(lang => lang.code === language);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1 cursor-target px-2">
                    <Globe className="h-4 w-4" />
                    <span className="text-xs font-medium">{currentLang?.short}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass-panel">
                {languages.map((lang) => (
                    <DropdownMenuItem
                        key={lang.code}
                        onClick={() => setLanguage(lang.code)}
                        className={`cursor-target ${language === lang.code
                            ? 'bg-primary/10 text-primary'
                            : 'hover:bg-muted'
                            }`}
                    >
                        <span className="mr-3 text-sm font-medium">{lang.short}</span>
                        <span>{lang.name}</span>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};