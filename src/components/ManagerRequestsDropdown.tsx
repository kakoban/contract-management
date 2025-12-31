import { useState, useEffect } from "react";
import { Plus, AlertCircle, CheckCircle2, Clock, Loader2, Send, X, ClipboardList, Bell, Trash2, Edit2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { fetchManagerRequests, addManagerRequest, deleteManagerRequest, updateManagerRequest, ManagerRequest } from "@/services/googleSheetsService";

export function ManagerRequestsDropdown() {
    const [requests, setRequests] = useState<ManagerRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        priority: 'متوسط'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const loadRequests = async () => {
        setIsLoading(true);
        try {
            const data = await fetchManagerRequests();
            setRequests(data);
        } catch (error) {
            console.error('خطا در بارگذاری درخواست‌ها:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            loadRequests();
        }
    }, [isOpen]);

    const handleSubmit = async () => {
        if (!formData.title.trim()) return;

        setIsSubmitting(true);
        try {
            if (editingId) {
                await updateManagerRequest(editingId, {
                    title: formData.title,
                    description: formData.description,
                    priority: formData.priority,
                });
            } else {
                await addManagerRequest(formData.title, formData.description, formData.priority);
            }
            setFormData({ title: '', description: '', priority: 'متوسط' });
            setShowForm(false);
            setEditingId(null);
            await loadRequests();
        } catch (error) {
            console.error('خطا در ثبت درخواست:', error);
            alert('خطا در ثبت درخواست. لطفاً Apps Script را Deploy کنید.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (requestId: number) => {
        if (!confirm('آیا از حذف این درخواست مطمئن هستید؟')) return;

        try {
            await deleteManagerRequest(requestId);
            await loadRequests();
        } catch (error) {
            console.error('خطا در حذف درخواست:', error);
            alert('خطا در حذف درخواست. لطفاً Apps Script را Deploy کنید.');
        }
    };

    const handleEdit = (req: ManagerRequest) => {
        setFormData({
            title: req.عنوان,
            description: req.توضیحات || '',
            priority: req.اولویت || 'متوسط',
        });
        setEditingId(req.id);
        setShowForm(true);
    };

    const handleStatusChange = async (req: ManagerRequest, newStatus: string) => {
        try {
            await updateManagerRequest(req.id, { status: newStatus });
            await loadRequests();
        } catch (error) {
            console.error('خطا در تغییر وضعیت:', error);
        }
    };

    const cancelEdit = () => {
        setFormData({ title: '', description: '', priority: 'متوسط' });
        setShowForm(false);
        setEditingId(null);
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'فوری': return 'bg-red-500/10 text-red-500 border-red-500/30';
            case 'بالا': return 'bg-orange-500/10 text-orange-500 border-orange-500/30';
            case 'متوسط': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30';
            default: return 'bg-green-500/10 text-green-500 border-green-500/30';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'انجام شده': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
            case 'در حال انجام': return <Clock className="w-4 h-4 text-yellow-500" />;
            default: return <AlertCircle className="w-4 h-4 text-primary" />;
        }
    };

    const statusOptions = ['جدید', 'در حال انجام', 'انجام شده'];
    const newRequestsCount = requests.filter(r => r.وضعیت === 'جدید').length;

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 relative"
                >
                    <ClipboardList className="w-4 h-4" />
                    درخواست‌ها
                    {newRequestsCount > 0 && (
                        <span className="absolute -top-1 -left-1 w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                            {newRequestsCount > 9 ? '9+' : newRequestsCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-[420px] p-0"
                align="end"
                sideOffset={8}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-l from-primary/10 to-transparent">
                    <div className="flex items-center gap-2">
                        <Bell className="w-5 h-5 text-primary" />
                        <span className="font-semibold text-foreground">درخواست‌های مدیر</span>
                        <span className="text-xs text-muted-foreground">({requests.length})</span>
                    </div>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => showForm ? cancelEdit() : setShowForm(true)}
                        className="gap-1 h-7 px-2"
                    >
                        {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        {showForm ? 'بستن' : 'جدید'}
                    </Button>
                </div>

                {/* Add/Edit Form */}
                {showForm && (
                    <div className="p-4 border-b border-border bg-muted/30">
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-sm font-medium text-foreground">
                                    {editingId ? 'ویرایش درخواست' : 'درخواست جدید'}
                                </span>
                            </div>
                            <input
                                type="text"
                                placeholder="عنوان درخواست..."
                                value={formData.title}
                                onChange={(e) => setFormData(d => ({ ...d, title: e.target.value }))}
                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                            <textarea
                                placeholder="توضیحات (اختیاری)..."
                                value={formData.description}
                                onChange={(e) => setFormData(d => ({ ...d, description: e.target.value }))}
                                rows={2}
                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                            />
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs text-muted-foreground">اولویت:</span>
                                {['کم', 'متوسط', 'بالا', 'فوری'].map(p => (
                                    <button
                                        key={p}
                                        onClick={() => setFormData(d => ({ ...d, priority: p }))}
                                        className={`px-2 py-0.5 rounded-full text-[10px] border transition-all ${formData.priority === p
                                                ? getPriorityColor(p)
                                                : 'bg-muted text-muted-foreground border-transparent hover:border-border'
                                            }`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    onClick={handleSubmit}
                                    disabled={isSubmitting || !formData.title.trim()}
                                    className="flex-1 gap-2"
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : editingId ? (
                                        <Check className="w-4 h-4" />
                                    ) : (
                                        <Send className="w-4 h-4" />
                                    )}
                                    {editingId ? 'ذخیره تغییرات' : 'ثبت درخواست'}
                                </Button>
                                {editingId && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={cancelEdit}
                                    >
                                        انصراف
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Content */}
                <div className="max-h-96 overflow-y-auto">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        </div>
                    ) : requests.length === 0 ? (
                        <div className="text-center py-8">
                            <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
                            <p className="text-sm text-muted-foreground">هیچ درخواستی ثبت نشده</p>
                            <p className="text-xs text-muted-foreground/70 mt-1">برای افزودن روی دکمه "جدید" کلیک کنید</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {requests.map((req, index) => (
                                <div
                                    key={req.id || index}
                                    className="p-3 hover:bg-muted/30 transition-colors group"
                                >
                                    <div className="flex items-start gap-3">
                                        {/* Status Dropdown */}
                                        <div className="relative">
                                            <button
                                                onClick={() => {
                                                    const currentIndex = statusOptions.indexOf(req.وضعیت || 'جدید');
                                                    const nextStatus = statusOptions[(currentIndex + 1) % statusOptions.length];
                                                    handleStatusChange(req, nextStatus);
                                                }}
                                                className="cursor-pointer"
                                                title="کلیک برای تغییر وضعیت"
                                            >
                                                {getStatusIcon(req.وضعیت)}
                                            </button>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-sm font-medium text-foreground truncate">
                                                    {req.عنوان}
                                                </span>
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] border shrink-0 ${getPriorityColor(req.اولویت)}`}>
                                                    {req.اولویت}
                                                </span>
                                            </div>
                                            {req.توضیحات && (
                                                <p className="text-xs text-muted-foreground line-clamp-2">
                                                    {req.توضیحات}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-2 mt-1">
                                                <p className="text-[10px] text-muted-foreground/70">
                                                    {req.تاریخ}
                                                </p>
                                                <span className="text-[10px] text-muted-foreground/50">•</span>
                                                <span className="text-[10px] text-muted-foreground/70">
                                                    {req.وضعیت}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6"
                                                onClick={() => handleEdit(req)}
                                                title="ویرایش"
                                            >
                                                <Edit2 className="w-3 h-3" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-destructive hover:text-destructive"
                                                onClick={() => handleDelete(req.id)}
                                                title="حذف"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
