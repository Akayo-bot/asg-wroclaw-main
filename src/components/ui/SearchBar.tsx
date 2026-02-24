import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface SearchBarProps {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    className?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ value, onChange, placeholder = "Search...", className }) => {
    return (
        <div className={cn("relative", className)}>
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="pl-10 bg-black/20 border-white/10 text-white placeholder:text-gray-500 focus-visible:ring-[#46D6C8]"
            />
        </div>
    );
};

export default SearchBar;