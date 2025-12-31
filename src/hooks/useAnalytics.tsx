import { useMemo } from 'react';
import { useContracts } from './useContracts';
import { Contract } from '@/types/contract';

export interface ContractTypeData {
    name: string;
    value: number;
    color: string;
}

export interface StageData {
    stage: number;
    name: string;
    count: number;
    color: string;
}

export interface BudgetData {
    name: string;
    budget: number;
    budgetFormatted: string;
}

export interface ContractorData {
    name: string;
    count: number;
}

const CONTRACT_TYPE_COLORS: Record<string, string> = {
    'پیمانکاری': '#8b5cf6',
    'خرید': '#06b6d4',
    'اجاره': '#f59e0b',
    'مشاوره': '#10b981',
    'تامین و دستمزد': '#ec4899',
};

const STAGE_COLORS: Record<number, string> = {
    0: '#22c55e',  // ابلاغ شده - سبز
    1: '#3b82f6',  // در حال ابلاغ - آبی
    2: '#8b5cf6',  // صدور مجوز - بنفش
    3: '#f59e0b',  // در انتظار - نارنجی
    3.5: '#f97316', // مناقصه بی‌نتیجه - نارنجی تیره
    4: '#ef4444',  // در حال تهیه - قرمز
    5: '#6b7280',  // تعیین تکلیف نشده - خاکستری
    6: '#dc2626',  // از برنامه خارج - قرمز تیره
};

const STAGE_NAMES: Record<number, string> = {
    0: 'ابلاغ قرارداد',
    1: 'در حال ابلاغ',
    2: 'صدور فرم مجوز',
    3: 'در انتظار',
    3.5: 'مناقصه بی‌نتیجه',
    4: 'در حال تهیه',
    5: 'تعیین تکلیف نشده',
    6: 'از برنامه خارج',
};

export const useAnalytics = () => {
    const { data: contracts, isLoading } = useContracts();

    return useMemo(() => {
        if (isLoading || !contracts || contracts.length === 0) {
            return {
                contractsByType: [] as ContractTypeData[],
                contractsByStage: [] as StageData[],
                budgetByType: [] as BudgetData[],
                topContractors: [] as ContractorData[],
                totalBudget: 0,
                isLoading,
            };
        }

        // توزیع قراردادها بر اساس نوع
        const typeCount: Record<string, number> = {};
        const typeBudget: Record<string, number> = {};

        contracts.forEach((contract: Contract) => {
            const type = contract.contractType || 'نامشخص';
            typeCount[type] = (typeCount[type] || 0) + 1;
            typeBudget[type] = (typeBudget[type] || 0) + (contract.estimate || 0);
        });

        const contractsByType: ContractTypeData[] = Object.entries(typeCount).map(([name, value]) => ({
            name,
            value,
            color: CONTRACT_TYPE_COLORS[name] || '#6b7280',
        }));

        // توزیع بودجه بر اساس نوع
        const budgetByType: BudgetData[] = Object.entries(typeBudget)
            .map(([name, budget]) => ({
                name,
                budget,
                budgetFormatted: (budget / 1000000000).toLocaleString('fa-IR', { maximumFractionDigits: 0 }),
            }))
            .sort((a, b) => b.budget - a.budget);

        // توزیع بر اساس مرحله قرارداد
        const stageCount: Record<number, number> = {};
        contracts.forEach((contract: Contract) => {
            const stage = contract.stageCode ?? 0;
            stageCount[stage] = (stageCount[stage] || 0) + 1;
        });

        const contractsByStage: StageData[] = Object.entries(stageCount)
            .map(([stage, count]) => ({
                stage: parseFloat(stage),
                name: STAGE_NAMES[parseFloat(stage)] || `مرحله ${stage}`,
                count,
                color: STAGE_COLORS[parseFloat(stage)] || '#6b7280',
            }))
            .sort((a, b) => a.stage - b.stage);

        // پیمانکاران برتر
        const contractorCount: Record<string, number> = {};
        contracts.forEach((contract: Contract) => {
            const contractor = contract.contractor;
            if (contractor && contractor !== '...' && contractor.trim()) {
                contractorCount[contractor] = (contractorCount[contractor] || 0) + 1;
            }
        });

        const topContractors: ContractorData[] = Object.entries(contractorCount)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        const totalBudget = contracts.reduce((sum, c) => sum + (c.estimate || 0), 0);

        return {
            contractsByType,
            contractsByStage,
            budgetByType,
            topContractors,
            totalBudget,
            isLoading,
        };
    }, [contracts, isLoading]);
};
