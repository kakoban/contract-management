import { cn } from '@/lib/utils';

type StatusType = 'new' | 'scheduled' | 'in-progress' | 'completed' | 'on-hold' | 'blocked';

interface StatusBadgeProps {
    status: StatusType;
    label?: string;
    className?: string;
}

const statusConfig: Record<StatusType, { bg: string; text: string; dot: string; defaultLabel: string }> = {
    'new': {
        bg: 'bg-slate-100 dark:bg-slate-800',
        text: 'text-slate-700 dark:text-slate-300',
        dot: 'bg-slate-500',
        defaultLabel: 'New task',
    },
    'scheduled': {
        bg: 'bg-violet-100 dark:bg-violet-900/30',
        text: 'text-violet-700 dark:text-violet-300',
        dot: 'bg-violet-500',
        defaultLabel: 'Scheduled',
    },
    'in-progress': {
        bg: 'bg-amber-100 dark:bg-amber-900/30',
        text: 'text-amber-700 dark:text-amber-300',
        dot: 'bg-amber-500',
        defaultLabel: 'In Progress',
    },
    'completed': {
        bg: 'bg-emerald-100 dark:bg-emerald-900/30',
        text: 'text-emerald-700 dark:text-emerald-300',
        dot: 'bg-emerald-500',
        defaultLabel: 'Completed',
    },
    'on-hold': {
        bg: 'bg-gray-100 dark:bg-gray-800',
        text: 'text-gray-600 dark:text-gray-400',
        dot: 'bg-gray-400',
        defaultLabel: 'On Hold',
    },
    'blocked': {
        bg: 'bg-red-100 dark:bg-red-900/30',
        text: 'text-red-700 dark:text-red-300',
        dot: 'bg-red-500',
        defaultLabel: 'Blocked',
    },
};

// Map Persian status to StatusType
export function mapContractStageToStatus(stageCode: number): StatusType {
    switch (stageCode) {
        case 0: return 'completed';      // ابلاغ قرارداد
        case 1: return 'in-progress';    // در حال ابلاغ
        case 2: return 'scheduled';      // صدور فرم مجوز
        case 3:
        case 3.5: return 'on-hold';      // در انتظار
        case 4: return 'new';            // در حال تهیه
        case 5: return 'on-hold';        // تعیین تکلیف نشده
        case 6: return 'blocked';        // از برنامه خارج
        default: return 'new';
    }
}

// Persian labels for stages
export const stageLabels: Record<number, string> = {
    0: 'ابلاغ شده',
    1: 'در حال ابلاغ',
    2: 'صدور مجوز',
    3: 'در انتظار',
    3.5: 'مناقصه بی‌نتیجه',
    4: 'در حال تهیه',
    5: 'تعیین تکلیف نشده',
    6: 'از برنامه خارج',
};

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
    const config = statusConfig[status];

    return (
        <div className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium',
            config.bg,
            config.text,
            className
        )}>
            <span className={cn('w-1.5 h-1.5 rounded-full', config.dot)} />
            <span>{label || config.defaultLabel}</span>
        </div>
    );
}

// Convenience component for contract stage
interface ContractStatusBadgeProps {
    stageCode: number;
    className?: string;
}

export function ContractStatusBadge({ stageCode, className }: ContractStatusBadgeProps) {
    const status = mapContractStageToStatus(stageCode);
    const label = stageLabels[stageCode] || 'نامشخص';

    return <StatusBadge status={status} label={label} className={className} />;
}
