import { useState, useEffect } from "react";
import { Plus, AlertCircle, CheckCircle2, Clock, Loader2, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchManagerRequests, addManagerRequest, ManagerRequest } from "@/services/googleSheetsService";

interface ManagerRequestsPanelProps {
    className?: string;
}

export function ManagerRequestsPanel({ className }: ManagerRequestsPanelProps) {
    const [requests, setRequests] = useState<ManagerRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        priority: 'متوسط'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const loadRequests = async () => {
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
        loadRequests();
    }, []);

    const handleSubmit = async () => {
        if (!formData.title.trim()) return;

        setIsSubmitting(true);
        try {
            await addManagerRequest(formData.title, formData.description, formData.priority);
            setFormData({ title: '', description: '', priority: 'متوسط' });
            setShowForm(false);
            await loadRequests();
        } catch (error) {
            console.error('خطا در افزودن درخواست:', error);
        } finally {
            setIsSubmitting(false);
        }
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

    return (
        <div className={`bg-card rounded-xl border border-border overflow-hidden ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-l from-primary/10 to-transparent">
                <div>
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-primary" />
                        درخواست‌های مدیر
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                        موارد جدید برای پیگیری تیم
                    </p>
                </div>
                <Button
                    size="sm"
                    onClick={() => setShowForm(true)}
                    className="gap-2"
                >
                    <Plus className="w-4 h-4" />
                    درخواست جدید
                </Button>
            </div>

            {/* Add Form */}
            {showForm && (
                <div className="p-4 border-b border-border bg-muted/30">
                    <div className="space-y-3">
                        <input
                            type="text"
                            placeholder="عنوان درخواست..."
                            value={formData.title}
                            onChange={(e) => setFormData(d => ({ ...d, title: e.target.value }))}
                            className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                        <textarea
                            placeholder="توضیحات (اختیاری)..."
                            value={formData.description}
                            onChange={(e) => setFormData(d => ({ ...d, description: e.target.value }))}
                            rows={2}
                            className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                        />
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">اولویت:</span>
                            {['کم', 'متوسط', 'بالا', 'فوری'].map(p => (
                                <button
                                    key={p}
                                    onClick={() => setFormData(d => ({ ...d, priority: p }))}
                                    className={`px-3 py-1 rounded-full text-xs border transition-all ${formData.priority === p
                                            ? getPriorityColor(p)
                                            : 'bg-muted text-muted-foreground border-transparent'
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
                                className="gap-2"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Send className="w-4 h-4" />
                                )}
                                ثبت
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setShowForm(false)}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Content */}
            <div className="p-4">
                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                ) : requests.length === 0 ? (
                    <div className="text-center py-8">
                        <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
                        <p className="text-sm text-muted-foreground">هیچ درخواستی ثبت نشده</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {requests.slice(0, 5).map((req, index) => (
                            <div
                                key={req.id || index}
                                className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border hover:bg-muted/50 transition-colors"
                            >
                                {getStatusIcon(req.وضعیت)}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm font-medium text-foreground truncate">
                                            {req.عنوان}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] border ${getPriorityColor(req.اولویت)}`}>
                                            {req.اولویت}
                                        </span>
                                    </div>
                                    {req.توضیحات && (
                                        <p className="text-xs text-muted-foreground line-clamp-1">
                                            {req.توضیحات}
                                        </p>
                                    )}
                                    <p className="text-[10px] text-muted-foreground/70 mt-1">
                                        {req.تاریخ}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {requests.length > 5 && (
                            <p className="text-xs text-center text-muted-foreground">
                                و {requests.length - 5} مورد دیگر...
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
