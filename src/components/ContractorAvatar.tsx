import { useMemo } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface ContractorAvatarProps {
    name: string;
    size?: 'sm' | 'md' | 'lg';
    showTooltip?: boolean;
}

// Generate consistent color based on name
function getColorFromName(name: string): string {
    const colors = [
        'bg-violet-500',
        'bg-blue-500',
        'bg-emerald-500',
        'bg-amber-500',
        'bg-rose-500',
        'bg-cyan-500',
        'bg-pink-500',
        'bg-indigo-500',
        'bg-teal-500',
        'bg-orange-500',
    ];

    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
}

// Get initials from Persian/English name
function getInitials(name: string): string {
    if (!name || name === '...' || name.trim() === '') {
        return '؟';
    }

    const words = name.trim().split(/\s+/);
    if (words.length === 1) {
        return words[0].substring(0, 2);
    }

    // For Persian names, take first character of first two words
    return words.slice(0, 2).map(w => w.charAt(0)).join('');
}

const sizeClasses = {
    sm: 'h-7 w-7 text-xs',
    md: 'h-9 w-9 text-sm',
    lg: 'h-11 w-11 text-base',
};

export function ContractorAvatar({ name, size = 'md', showTooltip = true }: ContractorAvatarProps) {
    const colorClass = useMemo(() => getColorFromName(name), [name]);
    const initials = useMemo(() => getInitials(name), [name]);

    const avatar = (
        <Avatar className={`${sizeClasses[size]} cursor-pointer transition-transform hover:scale-110`}>
            <AvatarFallback className={`${colorClass} text-white font-medium`}>
                {initials}
            </AvatarFallback>
        </Avatar>
    );

    if (!showTooltip) {
        return avatar;
    }

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                {avatar}
            </TooltipTrigger>
            <TooltipContent side="top" className="text-sm">
                {name || 'نامشخص'}
            </TooltipContent>
        </Tooltip>
    );
}
