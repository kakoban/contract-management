import { cn } from '@/lib/utils';

type ContractType = 'contracting' | 'purchase' | 'rental' | 'consulting' | 'supply';

interface TypeBadgeProps {
    type: ContractType;
    label?: string;
    className?: string;
}

const typeConfig: Record<ContractType, { bg: string; text: string; defaultLabel: string }> = {
    'contracting': {
        bg: 'bg-blue-100 dark:bg-blue-900/30',
        text: 'text-blue-700 dark:text-blue-300',
        defaultLabel: 'پیمانکاری',
    },
    'purchase': {
        bg: 'bg-emerald-100 dark:bg-emerald-900/30',
        text: 'text-emerald-700 dark:text-emerald-300',
        defaultLabel: 'خرید',
    },
    'rental': {
        bg: 'bg-amber-100 dark:bg-amber-900/30',
        text: 'text-amber-700 dark:text-amber-300',
        defaultLabel: 'اجاره',
    },
    'consulting': {
        bg: 'bg-violet-100 dark:bg-violet-900/30',
        text: 'text-violet-700 dark:text-violet-300',
        defaultLabel: 'مشاوره',
    },
    'supply': {
        bg: 'bg-rose-100 dark:bg-rose-900/30',
        text: 'text-rose-700 dark:text-rose-300',
        defaultLabel: 'تامین و دستمزد',
    },
};

// Map Persian contract type to TypeCode
export function mapContractType(persianType: string): ContractType {
    const typeMap: Record<string, ContractType> = {
        'پیمانکاری': 'contracting',
        'خرید': 'purchase',
        'اجاره': 'rental',
        'مشاوره': 'consulting',
        'تامین و دستمزد': 'supply',
    };

    return typeMap[persianType] || 'contracting';
}

export function TypeBadge({ type, label, className }: TypeBadgeProps) {
    const config = typeConfig[type];

    return (
        <span className={cn(
            'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
            config.bg,
            config.text,
            className
        )}>
            {label || config.defaultLabel}
        </span>
    );
}

// Convenience component for contract type
interface ContractTypeBadgeProps {
    contractType: string;
    className?: string;
}

export function ContractTypeBadge({ contractType, className }: ContractTypeBadgeProps) {
    const type = mapContractType(contractType);

    return <TypeBadge type={type} label={contractType} className={className} />;
}

// Priority tag component (for ASAP, Blocked, etc.)
interface PriorityTagProps {
    priority: 'asap' | 'blocked' | 'feedback' | 'urgent';
    className?: string;
}

const priorityConfig: Record<string, { bg: string; text: string; label: string }> = {
    'asap': {
        bg: 'bg-orange-500',
        text: 'text-white',
        label: 'فوری',
    },
    'blocked': {
        bg: 'bg-red-500',
        text: 'text-white',
        label: 'متوقف',
    },
    'feedback': {
        bg: 'bg-blue-500',
        text: 'text-white',
        label: 'نیاز به بررسی',
    },
    'urgent': {
        bg: 'bg-rose-500',
        text: 'text-white',
        label: 'اضطراری',
    },
};

export function PriorityTag({ priority, className }: PriorityTagProps) {
    const config = priorityConfig[priority];

    return (
        <span className={cn(
            'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase',
            config.bg,
            config.text,
            className
        )}>
            {config.label}
        </span>
    );
}
