import { useMemo, useState, DragEvent } from 'react';
import { MessageSquare, MoreHorizontal, GripVertical } from 'lucide-react';
import { useContracts, useUpdateContract } from '@/hooks/useContracts';
import { Contract } from '@/types/contract';
import { ContractorAvatar } from '@/components/ContractorAvatar';
import { PriorityTag } from '@/components/TypeBadge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface KanbanColumn {
    id: string;
    title: string;
    stages: number[];
    defaultStage: number;
    color: string;
    bgColor: string;
    permitStageValue: string;
}

const KANBAN_COLUMNS: KanbanColumn[] = [
    {
        id: 'new',
        title: 'در حال تهیه',
        stages: [4, 5],
        defaultStage: 4,
        permitStageValue: 'در حال تهیه',
        color: 'text-slate-600 dark:text-slate-300',
        bgColor: 'bg-slate-100 dark:bg-slate-800/50',
    },
    {
        id: 'scheduled',
        title: 'صدور مجوز',
        stages: [2, 3, 3.5],
        defaultStage: 3,
        permitStageValue: 'صدور مجوز',
        color: 'text-violet-600 dark:text-violet-300',
        bgColor: 'bg-violet-100 dark:bg-violet-900/30',
    },
    {
        id: 'in-progress',
        title: 'در حال ابلاغ',
        stages: [1],
        defaultStage: 1,
        permitStageValue: 'تایید شوراهای معاملات',
        color: 'text-amber-600 dark:text-amber-300',
        bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    },
    {
        id: 'completed',
        title: 'ابلاغ شده',
        stages: [0],
        defaultStage: 0,
        permitStageValue: 'ابلاغ قرارداد',
        color: 'text-emerald-600 dark:text-emerald-300',
        bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
    },
];

function formatBudgetShort(num: number): string {
    if (!num) return '';
    const billion = num / 1000000000;
    if (billion >= 1) {
        return billion.toLocaleString('fa-IR', { maximumFractionDigits: 0 }) + ' میلیارد';
    }
    const million = num / 1000000;
    return million.toLocaleString('fa-IR', { maximumFractionDigits: 0 }) + ' میلیون';
}

function isUrgent(contract: Contract): 'asap' | 'blocked' | null {
    const status = contract.outsourcingStatus?.toLowerCase() || '';
    const docStatus = contract.documentStatus?.toLowerCase() || '';

    if (status.includes('متوقف') || status.includes('بی‌نتیجه') || status.includes('خارج')) {
        return 'blocked';
    }
    if (docStatus.includes('نقص') || docStatus.includes('مشکل')) {
        return 'asap';
    }
    return null;
}

interface KanbanCardProps {
    contract: Contract;
    onDragStart: (contract: Contract) => void;
}

function KanbanCard({ contract, onDragStart }: KanbanCardProps) {
    const urgency = isUrgent(contract);

    const typeColors: Record<string, string> = {
        'پیمانکاری': 'border-l-blue-500',
        'خرید': 'border-l-emerald-500',
        'اجاره': 'border-l-amber-500',
        'مشاوره': 'border-l-violet-500',
        'تامین و دستمزد': 'border-l-rose-500',
    };

    const borderColor = typeColors[contract.contractType] || 'border-l-gray-400';

    const handleDragStart = (e: DragEvent<HTMLDivElement>) => {
        e.dataTransfer.setData('contractId', contract.id.toString());
        e.dataTransfer.effectAllowed = 'move';
        onDragStart(contract);
    };

    return (
        <div
            draggable
            onDragStart={handleDragStart}
        >
            <Card className={cn(
                'cursor-grab hover:shadow-md transition-all border-l-4 group active:cursor-grabbing',
                borderColor
            )}>
                <CardContent className="p-3">
                    <div className="flex items-start gap-2">
                        <div className="mt-1 text-muted-foreground/50 hover:text-muted-foreground">
                            <GripVertical className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground mb-2 line-clamp-2">
                                {contract.description}
                            </p>

                            <div className="flex items-center gap-1 flex-wrap mb-3">
                                {urgency && <PriorityTag priority={urgency} />}
                                {contract.biddingMethod && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                        {contract.biddingMethod}
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <ContractorAvatar name={contract.contractor} size="sm" />
                                    {contract.estimate > 0 && (
                                        <span className="text-[10px] text-muted-foreground">
                                            {formatBudgetShort(contract.estimate)}
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {contract.comments && contract.comments.length > 0 && (
                                        <div className="flex items-center gap-0.5 text-muted-foreground">
                                            <MessageSquare className="w-3 h-3" />
                                            <span className="text-[10px]">{contract.comments.length}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

interface ColumnProps {
    column: KanbanColumn;
    contracts: Contract[];
    onDragStart: (contract: Contract) => void;
    onDrop: (columnId: string) => void;
    isDropTarget: boolean;
}

function Column({ column, contracts, onDragStart, onDrop, isDropTarget }: ColumnProps) {
    const [isDragOver, setIsDragOver] = useState(false);

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setIsDragOver(true);
    };

    const handleDragLeave = () => {
        setIsDragOver(false);
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(false);
        onDrop(column.id);
    };

    return (
        <div className="flex-shrink-0 w-72">
            {/* Column Header */}
            <div className={cn(
                'px-3 py-2 rounded-t-lg flex items-center justify-between',
                column.bgColor
            )}>
                <div className="flex items-center gap-2">
                    <span className={cn('font-medium text-sm', column.color)}>
                        {column.title}
                    </span>
                    <span className="text-xs text-muted-foreground bg-background/50 px-1.5 py-0.5 rounded">
                        {contracts.length}
                    </span>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                    <MoreHorizontal className="w-4 h-4" />
                </Button>
            </div>

            {/* Column Body - Drop Zone */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                    'bg-muted/30 rounded-b-lg p-2 min-h-[400px] space-y-2 transition-all duration-200',
                    isDragOver && 'bg-primary/10 ring-2 ring-primary ring-inset'
                )}
            >
                {contracts.map((contract) => (
                    <KanbanCard
                        key={contract.id}
                        contract={contract}
                        onDragStart={onDragStart}
                    />
                ))}

                {contracts.length === 0 && (
                    <div className={cn(
                        'text-center py-8 text-sm text-muted-foreground border-2 border-dashed rounded-lg transition-colors',
                        isDragOver ? 'border-primary bg-primary/5' : 'border-border/50'
                    )}>
                        کارت‌ها را اینجا رها کنید
                    </div>
                )}
            </div>
        </div>
    );
}

export function KanbanBoard() {
    const { data: contracts = [], isLoading, refetch } = useContracts();
    const updateContract = useUpdateContract();
    const [draggingContract, setDraggingContract] = useState<Contract | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);

    // Group contracts by column
    const groupedContracts = useMemo(() => {
        const groups: Record<string, Contract[]> = {};

        KANBAN_COLUMNS.forEach(col => {
            groups[col.id] = [];
        });

        contracts.forEach((contract) => {
            const stageCode = contract.stageCode ?? 4;

            const column = KANBAN_COLUMNS.find(col => col.stages.includes(stageCode));
            if (column) {
                groups[column.id].push(contract);
            } else {
                groups['new'].push(contract);
            }
        });

        return groups;
    }, [contracts]);

    const findColumnByContractId = (contractId: number): string | null => {
        for (const [columnId, items] of Object.entries(groupedContracts)) {
            if (items.some(item => item.id === contractId)) {
                return columnId;
            }
        }
        return null;
    };

    const handleDragStart = (contract: Contract) => {
        setDraggingContract(contract);
    };

    const handleDrop = async (targetColumnId: string) => {
        if (!draggingContract || isUpdating) return;

        const sourceColumnId = findColumnByContractId(draggingContract.id);

        // If same column, no need to update
        if (sourceColumnId === targetColumnId) {
            setDraggingContract(null);
            return;
        }

        const targetColumn = KANBAN_COLUMNS.find(c => c.id === targetColumnId);
        if (!targetColumn) {
            setDraggingContract(null);
            return;
        }

        setIsUpdating(true);

        try {
            await updateContract.mutateAsync({
                rowIndex: draggingContract.id - 1,
                data: {
                    permitStage: targetColumn.permitStageValue
                }
            });

            await refetch();
        } catch (error) {
            console.error('Error updating contract:', error);
            alert('خطا در بروزرسانی وضعیت');
        } finally {
            setDraggingContract(null);
            setIsUpdating(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex gap-4 overflow-x-auto pb-4">
                {KANBAN_COLUMNS.map(col => (
                    <div key={col.id} className="flex-shrink-0 w-72">
                        <Skeleton className="h-10 rounded-t-lg mb-2" />
                        <div className="space-y-2">
                            <Skeleton className="h-24 rounded-lg" />
                            <Skeleton className="h-24 rounded-lg" />
                            <Skeleton className="h-24 rounded-lg" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="overflow-x-auto pb-4">
            {isUpdating && (
                <div className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center">
                    <div className="bg-card p-4 rounded-lg shadow-lg">
                        در حال بروزرسانی...
                    </div>
                </div>
            )}
            <div className="flex gap-4 min-w-max">
                {KANBAN_COLUMNS.map(column => (
                    <Column
                        key={column.id}
                        column={column}
                        contracts={groupedContracts[column.id] || []}
                        onDragStart={handleDragStart}
                        onDrop={handleDrop}
                        isDropTarget={draggingContract !== null}
                    />
                ))}
            </div>
        </div>
    );
}
