import React from 'react';

export const roleColors: Record<string, {
    text: string;
    bg: string;
    ring: string;
    shadow: string;
    shadowHover: string;
}> = {
    editor: {
        text: "text-[#A020F0]",
        bg: "bg-[#A020F0]/20",
        ring: "ring-[#A020F0]/40",
        shadow: "shadow-[0_0_10px_rgba(160,32,240,0.3)]",
        shadowHover: "hover:shadow-[0_0_14px_rgba(160,32,240,0.45)]",
    },
    admin: {
        text: "text-[#00FF00]",
        bg: "bg-[#00FF00]/20",
        ring: "ring-[#00FF00]/40",
        shadow: "shadow-[0_0_10px_rgba(0,255,0,0.3)]",
        shadowHover: "hover:shadow-[0_0_14px_rgba(0,255,0,0.45)]",
    },
    superadmin: {
        text: "text-[#FF7F3B]",
        bg: "bg-[#FF7F3B]/20",
        ring: "ring-[#FF7F3B]/40",
        shadow: "shadow-[0_0_10px_rgba(255,127,59,0.3)]",
        shadowHover: "hover:shadow-[0_0_14px_rgba(255,127,59,0.45)]",
    },
    user: {
        text: "text-[#808080]",
        bg: "bg-[#808080]/20",
        ring: "ring-[#808080]/40",
        shadow: "",
        shadowHover: "",
    },
};

interface RolePillProps {
    role: 'editor' | 'admin' | 'superadmin' | 'user' | string;
    className?: string;
    onClick?: () => void;
    interactive?: boolean;
}

export function RolePill({ role, className = '', onClick, interactive = false }: RolePillProps) {
    const roleLower = role?.toLowerCase() || 'user';
    const colors = roleColors[roleLower] || roleColors.user;
    
    const baseClasses = `inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full
        backdrop-blur-sm ring-1 ring-inset text-xs font-semibold tracking-wide
        transition-all ${colors.text} ${colors.bg} ${colors.ring} ${colors.shadow}`;
    
    const hoverClasses = interactive ? ` ${colors.shadowHover} cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 focus-visible:ring-offset-0` : '';
    
    const displayName = roleLower === 'superadmin' ? 'SuperAdmin' :
                       roleLower === 'admin' ? 'Admin' :
                       roleLower === 'editor' ? 'Editor' :
                       'User';

    return (
        <span
            className={`${baseClasses}${hoverClasses} ${className}`}
            onClick={onClick}
            role={interactive ? 'button' : undefined}
            tabIndex={interactive ? 0 : undefined}
            onKeyDown={(e) => {
                if (interactive && onClick && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    onClick();
                }
            }}
        >
            {displayName}
        </span>
    );
}

