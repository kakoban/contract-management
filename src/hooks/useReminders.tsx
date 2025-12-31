import { useMemo } from 'react';
import { Contract } from '@/types/contract';
import { useContracts } from './useContracts';

export interface Reminder {
    contract: Contract;
    type: 'urgent' | 'pending' | 'warning';
    message: string;
}

/**
 * Hook برای تشخیص قراردادهای نیازمند توجه
 * بر اساس وضعیت مرحله مجوز و اسناد
 */
export function useReminders() {
    const { data: contracts = [] } = useContracts();

    const reminders = useMemo(() => {
        const result: Reminder[] = [];

        contracts.forEach((contract) => {
            // قراردادهای در انتظار امضا (اضطراری)
            if (contract.permitStage?.includes('در انتظار امضا')) {
                result.push({
                    contract,
                    type: 'urgent',
                    message: `قرارداد "${contract.description?.substring(0, 40)}..." در انتظار امضا است`
                });
            }
            // قراردادهای با وضعیت "عدم صدور"
            else if (contract.permitStage?.includes('عدم صدور') && !contract.permitStage?.includes('لغو')) {
                result.push({
                    contract,
                    type: 'warning',
                    message: `قرارداد "${contract.description?.substring(0, 40)}..." هنوز صادر نشده`
                });
            }
            // قراردادهای با اسناد ناقص
            else if (contract.documentStatus?.includes('در حال تهیه')) {
                result.push({
                    contract,
                    type: 'pending',
                    message: `اسناد "${contract.description?.substring(0, 40)}..." در حال تهیه است`
                });
            }
            // قراردادهای با وضعیت بازگشت
            else if (contract.documentStatus?.includes('بازگشت')) {
                result.push({
                    contract,
                    type: 'warning',
                    message: `قرارداد "${contract.description?.substring(0, 40)}..." بازگشته و نیاز به بررسی دارد`
                });
            }
        });

        // مرتب‌سازی: اضطراری اول
        return result.sort((a, b) => {
            const priority = { urgent: 0, warning: 1, pending: 2 };
            return priority[a.type] - priority[b.type];
        });
    }, [contracts]);

    const urgentCount = reminders.filter(r => r.type === 'urgent').length;
    const warningCount = reminders.filter(r => r.type === 'warning').length;
    const pendingCount = reminders.filter(r => r.type === 'pending').length;

    return {
        reminders,
        urgentCount,
        warningCount,
        pendingCount,
        totalCount: reminders.length,
        hasReminders: reminders.length > 0
    };
}
