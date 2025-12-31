import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Contract } from '@/types/contract';
import {
    fetchContracts,
    updateContract as updateContractService,
    addContract as addContractService,
    deleteContract as deleteContractService
} from '@/services/googleSheetsService';
import { toast } from 'sonner';

/**
 * Hook برای دریافت لیست قراردادها
 */
export const useContracts = () => {
    return useQuery({
        queryKey: ['contracts'],
        queryFn: fetchContracts,
        staleTime: 30000, // 30 ثانیه
        refetchInterval: 60000, // Auto-refresh هر 1 دقیقه
        retry: 3,
        retryDelay: 1000,
    });
};

/**
 * Hook برای بروزرسانی قرارداد
 */
export const useUpdateContract = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ rowIndex, data }: { rowIndex: number; data: Partial<Contract> }) =>
            updateContractService(rowIndex, data),
        onMutate: async ({ rowIndex, data }) => {
            // لغو query های در حال اجرا
            await queryClient.cancelQueries({ queryKey: ['contracts'] });

            // ذخیره وضعیت قبلی
            const previousContracts = queryClient.getQueryData<Contract[]>(['contracts']);

            // Optimistic update
            if (previousContracts) {
                queryClient.setQueryData<Contract[]>(['contracts'], (old) => {
                    if (!old) return [];
                    return old.map((contract, index) =>
                        index === rowIndex ? { ...contract, ...data } : contract
                    );
                });
            }

            return { previousContracts };
        },
        onError: (err, variables, context) => {
            // بازگردانی به وضعیت قبلی
            if (context?.previousContracts) {
                queryClient.setQueryData(['contracts'], context.previousContracts);
            }
            toast.error('خطا در بروزرسانی قرارداد');
            console.error(err);
        },
        onSuccess: () => {
            toast.success('قرارداد با موفقیت بروزرسانی شد');
        },
        onSettled: () => {
            // Refetch برای اطمینان از همگام‌سازی
            queryClient.invalidateQueries({ queryKey: ['contracts'] });
        },
    });
};

/**
 * Hook برای افزودن قرارداد جدید
 */
export const useAddContract = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: addContractService,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contracts'] });
            toast.success('قرارداد جدید با موفقیت اضافه شد');
        },
        onError: (err) => {
            toast.error('خطا در افزودن قرارداد');
            console.error(err);
        },
    });
};

/**
 * Hook برای حذف قرارداد
 */
export const useDeleteContract = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteContractService,
        onMutate: async (rowIndex) => {
            await queryClient.cancelQueries({ queryKey: ['contracts'] });

            const previousContracts = queryClient.getQueryData<Contract[]>(['contracts']);

            // Optimistic update
            if (previousContracts) {
                queryClient.setQueryData<Contract[]>(['contracts'], (old) => {
                    if (!old) return [];
                    return old.filter((_, index) => index !== rowIndex);
                });
            }

            return { previousContracts };
        },
        onError: (err, variables, context) => {
            if (context?.previousContracts) {
                queryClient.setQueryData(['contracts'], context.previousContracts);
            }
            toast.error('خطا در حذف قرارداد');
            console.error(err);
        },
        onSuccess: () => {
            toast.success('قرارداد با موفقیت حذف شد');
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['contracts'] });
        },
    });
};
