import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Search, Filter, X, Loader2, AlertCircle } from "lucide-react";
import { ContractForm } from "@/components/ContractForm";
import { Contract } from "@/types/contract";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useContracts, useUpdateContract, useDeleteContract } from "@/hooks/useContracts";
import { toast } from "sonner";
import { CommentsPopover } from "@/components/CommentsPopover";

function formatNumber(num: number): string {
  return new Intl.NumberFormat('fa-IR').format(num);
}

function getStatusVariant(status: string): "issued" | "pending" | "rejected" {
  if (status.includes("عدم صدور")) return "rejected";
  if (status.includes("صدور")) return "issued";
  return "pending";
}

export function ContractTable() {
  // Use React Query hooks for data fetching
  const { data: contracts = [], isLoading, error } = useContracts();
  const updateContractMutation = useUpdateContract();
  const deleteContractMutation = useDeleteContract();

  const [formOpen, setFormOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [permitStageFilter, setPermitStageFilter] = useState<string>("all");
  const [documentStatusFilter, setDocumentStatusFilter] = useState<string>("all");

  // Get unique filter options from actual data
  const permitStageOptions = useMemo(() => {
    const options = new Set(contracts.map(c => c.permitStage).filter(Boolean));
    return Array.from(options);
  }, [contracts]);

  const documentStatusOptions = useMemo(() => {
    const options = new Set(contracts.map(c => c.documentStatus).filter(Boolean));
    return Array.from(options);
  }, [contracts]);

  // Filtered contracts
  const filteredContracts = useMemo(() => {
    return contracts.filter((contract) => {
      const matchesSearch =
        searchQuery === "" ||
        contract.contractor?.includes(searchQuery) ||
        contract.description?.includes(searchQuery);

      const matchesPermitStage =
        permitStageFilter === "all" || contract.permitStage === permitStageFilter;

      const matchesDocumentStatus =
        documentStatusFilter === "all" || contract.documentStatus === documentStatusFilter;

      return matchesSearch && matchesPermitStage && matchesDocumentStatus;
    });
  }, [contracts, searchQuery, permitStageFilter, documentStatusFilter]);

  const hasActiveFilters = searchQuery !== "" || permitStageFilter !== "all" || documentStatusFilter !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setPermitStageFilter("all");
    setDocumentStatusFilter("all");
  };

  const handleAddClick = () => {
    setEditingContract(null);
    setFormOpen(true);
  };

  const handleEditClick = (contract: Contract) => {
    setEditingContract(contract);
    setFormOpen(true);
  };

  const handleDeleteClick = (contract: Contract, index: number) => {
    deleteContractMutation.mutate(index);
  };

  const handleFormSubmit = (data: Omit<Contract, "id"> & { id?: number }) => {
    if (data.id) {
      // Edit existing - find the index
      const index = contracts.findIndex(c => c.id === data.id);
      if (index !== -1) {
        updateContractMutation.mutate({ rowIndex: index, data });
      }
    } else {
      // TODO: Add new contract functionality
      toast.error("افزودن قرارداد جدید هنوز پیاده‌سازی نشده است");
    }
    setFormOpen(false);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">در حال بارگذاری داده‌ها...</p>
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
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">خطا در بارگذاری داده‌ها</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {error instanceof Error ? error.message : "لطفاً بعداً دوباره تلاش کنید"}
            </p>
            <Button onClick={() => window.location.reload()}>تلاش مجدد</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="opacity-0 animate-fade-in" style={{ animationDelay: "400ms" }}>
        {/* Header */}
        <div className="gradient-header rounded-t-xl p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-primary-foreground/80" />
              <span className="text-sm text-primary-foreground/80">
                {filteredContracts.length} قرارداد از {contracts.length}
              </span>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 gap-1"
                  onClick={clearFilters}
                >
                  <X className="h-4 w-4" />
                  پاک کردن فیلترها
                </Button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-primary-foreground">لیست قراردادها</h2>
              <Button variant="gradient" size="sm" className="gap-2" onClick={handleAddClick}>
                <span>+</span>
                افزودن قرارداد
              </Button>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="جستجو در پیمانکار و عنوان..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-background/20 backdrop-blur-sm border-0 rounded-lg pr-10 pl-4 py-2 text-sm text-foreground placeholder:text-foreground/60 focus:outline-none focus:ring-2 focus:ring-foreground/30"
              />
            </div>
            <Select value={permitStageFilter} onValueChange={setPermitStageFilter}>
              <SelectTrigger className="w-[180px] bg-background/20 border-0 text-foreground">
                <SelectValue placeholder="مرحله مجوز" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه مراحل مجوز</SelectItem>
                {permitStageOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={documentStatusFilter} onValueChange={setDocumentStatusFilter}>
              <SelectTrigger className="w-[200px] bg-background/20 border-0 text-foreground">
                <SelectValue placeholder="وضعیت اسناد" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                {documentStatusOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border border-t-0 border-border rounded-b-xl">
          <table className="w-full">
            <thead>
              <tr className="bg-secondary/50 text-muted-foreground text-sm">
                <th className="text-right py-4 px-4 font-medium">عملیات</th>
                <th className="text-right py-4 px-4 font-medium">نظرات</th>
                <th className="text-right py-4 px-4 font-medium">برآورد اولیه</th>
                <th className="text-right py-4 px-4 font-medium">وضعیت اسناد</th>
                <th className="text-right py-4 px-4 font-medium">مرحله مجوز</th>
                <th className="text-right py-4 px-4 font-medium">شرح عملیات</th>
                <th className="text-right py-4 px-4 font-medium">پیمانکار</th>
              </tr>
            </thead>
            <tbody>
              {filteredContracts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Search className="h-10 w-10 text-muted-foreground/50" />
                      <p>هیچ قراردادی با این فیلترها یافت نشد</p>
                      <Button variant="ghost" size="sm" onClick={clearFilters}>
                        پاک کردن فیلترها
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredContracts.map((contract, index) => (
                  <tr
                    key={contract.id}
                    className="border-t border-border hover:bg-secondary/30 transition-colors opacity-0 animate-slide-in"
                    style={{ animationDelay: `${500 + index * 50}ms` }}
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeleteClick(contract, index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          onClick={() => handleEditClick(contract)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <CommentsPopover
                        rowIndex={contract.id - 1}
                        comments={contract.comments || []}
                        contractTitle={contract.description}
                      />
                    </td>
                    <td className="py-4 px-4 text-foreground font-medium">
                      {formatNumber(contract.estimate)}
                    </td>
                    <td className="py-4 px-4 text-muted-foreground text-sm">
                      {contract.documentStatus}
                    </td>
                    <td className="py-4 px-4">
                      <Badge variant={getStatusVariant(contract.permitStage)}>
                        {contract.permitStage}
                      </Badge>
                    </td>
                    <td className="py-4 px-4 text-primary font-medium max-w-md">
                      {contract.description}
                    </td>
                    <td className="py-4 px-4 text-foreground">
                      {contract.contractor}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ContractForm
        open={formOpen}
        onOpenChange={setFormOpen}
        contract={editingContract}
        onSubmit={handleFormSubmit}
      />
    </>
  );
}
