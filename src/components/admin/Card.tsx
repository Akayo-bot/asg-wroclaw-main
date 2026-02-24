import React from 'react';
import { LucideIcon } from 'lucide-react';

interface CardProps {
    title: string;
    icon: LucideIcon;
    subtitle?: string;
    children: React.ReactNode;
    className?: string;
}

const Card: React.FC<CardProps> = ({ title, icon: Icon, subtitle, children, className = '' }) => {
    return (
        <div className={`rounded-xl border border-white/10 bg-white/5 p-5 ${className}`}>
            <div className="mb-4 flex items-start gap-3 border-b border-white/10 pb-3">
                <div className="rounded-lg bg-[#46D6C8]/10 p-2 text-[#46D6C8]">
                    <Icon size={20} />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-white">{title}</h3>
                    {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
                </div>
            </div>
            {children}
        </div>
    );
};

export default Card;
