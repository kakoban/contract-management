import { useState, useMemo } from "react";
import { Search, Filter, X, Loader2, AlertCircle, Plus, MoreHorizontal, MessageSquare, Route, ArrowUpDown, SortAsc, SortDesc } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Contract } from "@/types/contract";
import { useContracts, useUpdateContract, useDeleteContract } from "@/hooks/useContracts";
import { ContractorAvatar } from "@/components/ContractorAvatar";
import { ContractStatusBadge, stageLabels } from "@/components/StatusBadge";
import { ContractTypeBadge, PriorityTag } from "@/components/TypeBadge";
import { CommentsPopover } from "@/components/CommentsPopover";
import { ContractForm } from "@/components/ContractForm";
import { ContractJourneyModal } from "@/components/ContractJourneyModal";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

function formatBudget(num: number): string {
    if (!num) return '-';
    const billion = num / 1000000000;
    return billion.toLocaleString('fa-IR', { maximumFractionDigits: 0 }) + ' میلیارد';
}

// Check if contract has urgent status
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

export function TaskListView() {
    const { data: contracts = [], isLoading, error } = useContracts();
    const deleteContractMutation = useDeleteContract();

    const [formOpen, setFormOpen] = useState(false);
    const [editingContract, setEditingContract] = useState<Contract | null>(null);
    const [journeyContract, setJourneyContract] = useState<Contract | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [searchQuery, setSearchQuery] = useState("");
    const [stageFilter, setStageFilter] = useState<string>("all");
    const [sortBy, setSortBy] = useState<string>("default");

    // Sort options
    const sortOptions = [
        { value: 'default', label: 'پیش‌فرض' },
        { value: 'date-desc', label: 'تاریخ (جدیدترین)' },
        { value: 'date-asc', label: 'تاریخ (قدیمی‌ترین)' },
        { value: 'budget-desc', label: 'بودجه (بیشترین)' },
        { value: 'budget-asc', label: 'بودجه (کمترین)' },
        { value: 'status-pending', label: 'انجام نشده' },
        { value: 'status-done', label: 'ابلاغ شده' },
        { value: 'urgent', label: 'اولویت (فوری)' },
        { value: 'contractor', label: 'پیمانکار' },
    ];

    // Filter and sort contracts
    const filteredContracts = useMemo(() => {
        let result = contracts.filter((contract) => {
            const matchesSearch =
                searchQuery === "" ||
                contract.contractor?.includes(searchQuery) ||
                contract.description?.includes(searchQuery);

            const matchesStage = stageFilter === "all" || contract.stageCode.toString() === stageFilter;

            return matchesSearch && matchesStage;
        });

        // Apply sorting
        switch (sortBy) {
            case 'date-desc':
                result = [...result].sort((a, b) => {
                    const dateA = a.holdingDate || '';
                    const dateB = b.holdingDate || '';
                    return dateB.localeCompare(dateA);
                });
                break;
            case 'date-asc':
                result = [...result].sort((a, b) => {
                    const dateA = a.holdingDate || '';
                    const dateB = b.holdingDate || '';
                    return dateA.localeCompare(dateB);
                });
                break;
            case 'budget-desc':
                result = [...result].sort((a, b) => (b.estimate || 0) - (a.estimate || 0));
                break;
            case 'budget-asc':
                result = [...result].sort((a, b) => (a.estimate || 0) - (b.estimate || 0));
                break;
            case 'status-pending':
                result = [...result].sort((a, b) => {
                    const aIsDone = a.outsourcingStatus?.includes('ابلاغ قرارداد') ? 1 : 0;
                    const bIsDone = b.outsourcingStatus?.includes('ابلاغ قرارداد') ? 1 : 0;
                    return aIsDone - bIsDone;
                });
                break;
            case 'status-done':
                result = [...result].sort((a, b) => {
                    const aIsDone = a.outsourcingStatus?.includes('ابلاغ قرارداد') ? 1 : 0;
                    const bIsDone = b.outsourcingStatus?.includes('ابلاغ قرارداد') ? 1 : 0;
                    return bIsDone - aIsDone;
                });
                break;
            case 'urgent':
                result = [...result].sort((a, b) => {
                    const urgencyA = isUrgent(a) ? (isUrgent(a) === 'asap' ? 2 : 1) : 0;
                    const urgencyB = isUrgent(b) ? (isUrgent(b) === 'asap' ? 2 : 1) : 0;
                    return urgencyB - urgencyA;
                });
                break;
            case 'contractor':
                result = [...result].sort((a, b) => {
                    return (a.contractor || '').localeCompare(b.contractor || '', 'fa');
                });
                break;
        }

        return result;
    }, [contracts, searchQuery, stageFilter, sortBy]);

    const hasActiveFilters = searchQuery !== "" || stageFilter !== "all" || sortBy !== "default";

    const clearFilters = () => {
        setSearchQuery("");
        setStageFilter("all");
        setSortBy("default");
    };

    const toggleSelect = (id: number) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === filteredContracts.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredContracts.map(c => c.id)));
        }
    };

    const handleEditClick = (contract: Contract) => {
        setEditingContract(contract);
        setFormOpen(true);
    };

    const handleDeleteClick = (contract: Contract, index: number) => {
        deleteContractMutation.mutate(index);
    };

    const handleFormSubmit = (data: Omit<Contract, "id"> & { id?: number }) => {
        setFormOpen(false);
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">در حال بارگذاری...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="flex flex-col items-center gap-4 text-center">
                    <AlertCircle className="h-12 w-12 text-destructive" />
                    <p className="text-muted-foreground">خطا در بارگذاری داده‌ها</p>
                    <Button onClick={() => window.location.reload()}>تلاش مجدد</Button>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="bg-card rounded-xl border border-border overflow-hidden">
                {/* Header Toolbar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between p-3 md:p-4 gap-3 border-b border-border bg-muted/30">
                    <div className="flex items-center gap-2 md:gap-3">
                        <Button size="sm" className="gap-2 bg-primary hover:bg-primary/90 text-xs md:text-sm">
                            <Plus className="w-4 h-4" />
                            <span className="hidden sm:inline">افزودن جدید</span>
                            <span className="sm:hidden">افزودن</span>
                        </Button>
                        <div className="h-6 w-px bg-border hidden md:block" />
                        <span className="text-xs md:text-sm text-muted-foreground">
                            {filteredContracts.length} قرارداد
                        </span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Search */}
                        <div className="relative flex-1 min-w-[120px] md:flex-initial">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="جستجو..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full md:w-40 bg-background border border-border rounded-lg pr-9 pl-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                        {/* Stage Filter */}
                        <Select value={stageFilter} onValueChange={setStageFilter}>
                            <SelectTrigger className="w-28 md:w-36 h-8 text-xs md:text-sm">
                                <Filter className="w-3 h-3 md:w-4 md:h-4 ml-1" />
                                <SelectValue placeholder="فیلتر" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">همه</SelectItem>
                                {Object.entries(stageLabels).map(([code, label]) => (
                                    <SelectItem key={code} value={code}>{label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {/* Sort */}
                        <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger className="w-28 md:w-40 h-8 text-xs md:text-sm">
                                <ArrowUpDown className="w-3 h-3 md:w-4 md:h-4 ml-1" />
                                <SelectValue placeholder="مرتب‌سازی" />
                            </SelectTrigger>
                            <SelectContent>
                                {sortOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {hasActiveFilters && (
                            <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 h-8 px-2">
                                <X className="w-4 h-4" />
                                <span className="hidden sm:inline">پاک کردن</span>
                            </Button>
                        )}
                    </div>
                </div>

                {/* Table Header - Hidden on mobile */}
                <div className="hidden lg:grid grid-cols-[40px_1fr_180px_120px_100px_140px_100px_80px] gap-2 px-4 py-3 bg-muted/50 text-xs font-medium text-muted-foreground border-b border-border">
                    <div className="flex items-center justify-center">
                        <Checkbox
                            checked={selectedIds.size === filteredContracts.length && filteredContracts.length > 0}
                            onCheckedChange={toggleSelectAll}
                        />
                    </div>
                    <div>شرح عملیات</div>
                    <div>وضعیت برون‌سپاری</div>
                    <div>نوع</div>
                    <div>بودجه</div>
                    <div>پیمانکار</div>
                    <div>مسیر</div>
                    <div></div>
                </div>

                {/* Table Body / Card List */}
                <div className="divide-y divide-border">
                    {filteredContracts.length === 0 ? (
                        <div className="py-12 text-center text-muted-foreground">
                            <Search className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
                            <p>هیچ قراردادی یافت نشد</p>
                        </div>
                    ) : (
                        filteredContracts.map((contract, index) => {
                            const urgency = isUrgent(contract);

                            return (
                                <div key={contract.id}>
                                    {/* Desktop Table Row */}
                                    <div
                                        className="hidden lg:grid grid-cols-[40px_1fr_180px_120px_100px_140px_100px_80px] gap-2 px-4 py-3 items-center hover:bg-muted/30 transition-colors group"
                                    >
                                        {/* Checkbox */}
                                        <div className="flex items-center justify-center">
                                            <Checkbox
                                                checked={selectedIds.has(contract.id)}
                                                onCheckedChange={() => toggleSelect(contract.id)}
                                            />
                                        </div>

                                        {/* Title with tags */}
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="text-sm font-medium text-foreground truncate">
                                                {contract.description}
                                            </span>
                                            {urgency && <PriorityTag priority={urgency} />}
                                            {contract.comments && contract.comments.length > 0 && (
                                                <CommentsPopover
                                                    rowIndex={contract.id - 1}
                                                    comments={contract.comments}
                                                    contractTitle={contract.description}
                                                />
                                            )}
                                        </div>

                                        {/* Status */}
                                        <div className="truncate">
                                            <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
                                                {contract.outsourcingStatus || 'نامشخص'}
                                            </span>
                                        </div>

                                        {/* Type */}
                                        <div>
                                            <ContractTypeBadge contractType={contract.contractType || 'پیمانکاری'} />
                                        </div>

                                        {/* Budget */}
                                        <div className="text-sm text-muted-foreground">
                                            {formatBudget(contract.estimate)}
                                        </div>

                                        {/* Contractor with Avatar */}
                                        <div className="flex items-center gap-2">
                                            <ContractorAvatar name={contract.contractor} size="sm" />
                                            <span className="text-sm text-foreground truncate">
                                                {contract.contractor || '-'}
                                            </span>
                                        </div>

                                        {/* Journey Button */}
                                        <div>
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => setJourneyContract(contract)}
                                                            className="gap-1.5 h-7 px-2 text-xs hover:bg-primary/10 hover:text-primary"
                                                        >
                                                            <Route className="w-3.5 h-3.5" />
                                                            مشاهده
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>مشاهده مسیر کامل قرارداد</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>

                                        {/* Actions */}
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleEditClick(contract)}>
                                                        ویرایش
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-destructive"
                                                        onClick={() => handleDeleteClick(contract, index)}
                                                    >
                                                        حذف
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>

                                    {/* Mobile Card View */}
                                    <div className="lg:hidden p-3 hover:bg-muted/30 transition-colors">
                                        <div className="flex items-start gap-3">
                                            <ContractorAvatar name={contract.contractor} size="sm" />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2 mb-2">
                                                    <p className="text-sm font-medium text-foreground line-clamp-2">
                                                        {contract.description}
                                                    </p>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                                                                <MoreHorizontal className="w-4 h-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => setJourneyContract(contract)}>
                                                                مسیر قرارداد
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleEditClick(contract)}>
                                                                ویرایش
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                className="text-destructive"
                                                                onClick={() => handleDeleteClick(contract, index)}
                                                            >
                                                                حذف
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                                <div className="flex items-center gap-2 flex-wrap mb-2">
                                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                                                        {contract.outsourcingStatus || 'نامشخص'}
                                                    </span>
                                                    <ContractTypeBadge contractType={contract.contractType || 'پیمانکاری'} />
                                                    {urgency && <PriorityTag priority={urgency} />}
                                                </div>
                                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                    <span>{contract.contractor || '-'}</span>
                                                    <span>{formatBudget(contract.estimate)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            <ContractForm
                open={formOpen}
                onOpenChange={setFormOpen}
                contract={editingContract}
                onSubmit={handleFormSubmit}
            />

            {journeyContract && (
                <ContractJourneyModal
                    contract={journeyContract}
                    open={true}
                    onClose={() => setJourneyContract(null)}
                />
            )}
        </>
    );
}
