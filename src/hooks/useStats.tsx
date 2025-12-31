import { useMemo } from 'react';
import { useContracts } from './useContracts';

export const useStats = () => {
    const { data: contracts, isLoading } = useContracts();

    return useMemo(() => {
        if (isLoading || !contracts || contracts.length === 0) {
            return {
                total: 0,
                urgent: 0,
                budget: 0,
                budgetFormatted: '0',
                progress: 0,
            };
        }

        // تعداد کل
        const total = contracts.length;

        // موارد اضطراری (قراردادهایی که وضعیت برونسپاری یا وضعیت اسناد آنها مشکل دارد)
        const urgent = contracts.filter((contract) => {
            const status = contract.outsourcingStatus?.toLowerCase() || '';
            const docStatus = contract.documentStatus?.toLowerCase() || '';
            return (
                status.includes('متوقف') ||
                status.includes('مشکل') ||
                docStatus.includes('مشکل') ||
                docStatus.includes('نقص')
            );
        }).length;

        // مجموع بودجه
        const budget = contracts.reduce((sum, contract) => sum + (contract.estimate || 0), 0);

        // فرمت بودجه (به میلیارد ریال)
        const budgetInBillion = budget / 1000000000;
        const budgetFormatted = budgetInBillion.toLocaleString('fa-IR', {
            maximumFractionDigits: 0,
        });

        // محاسبه درصد پیشرفت (بر اساس تعداد قراردادهایی که تکمیل شده‌اند)
        const completed = contracts.filter((contract) => {
            const status = contract.outsourcingStatus?.toLowerCase() || '';
            return status.includes('تکمیل') || status.includes('اجرا شده');
        }).length;
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

        return {
            total,
            urgent,
            budget,
            budgetFormatted,
            progress,
        };
    }, [contracts, isLoading]);
};
