import { useState, useEffect } from "react";
import { X, MessageSquare, Send, Check, Clock, FileText, Briefcase, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Contract, Comment } from "@/types/contract";
import { useUpdateContract } from "@/hooks/useContracts";
import { fetchEditors, Editor } from "@/services/googleSheetsService";
import { ContractorAvatar } from "@/components/ContractorAvatar";

interface ContractJourneyModalProps {
    contract: Contract;
    open: boolean;
    onClose: () => void;
}

// تعیین وضعیت مرحله برای Timeline
function getStepStatus(
    stepType: 'permit' | 'document' | 'outsourcing',
    contract: Contract
): 'completed' | 'current' | 'pending' {
    const outsourcingStatus = contract.outsourcingStatus?.toLowerCase() || '';

    if (stepType === 'permit') {
        // مرحله انجام مجوز - اگر وضعیت اسناد یا برونسپاری پر شده، یعنی این مرحله کامل شده
        if (contract.documentStatus || contract.outsourcingStatus) return 'completed';
        if (contract.permitStage) return 'current';
        return 'pending';
    }

    if (stepType === 'document') {
        // وضعیت اسناد - اگر برونسپاری پر شده، کامل شده
        if (contract.outsourcingStatus && !outsourcingStatus.includes('در حال')) return 'completed';
        if (contract.documentStatus) return 'current';
        return 'pending';
    }

    if (stepType === 'outsourcing') {
        // برونسپاری - آخرین مرحله
        if (outsourcingStatus.includes('ابلاغ قرارداد') && !outsourcingStatus.includes('در حال')) {
            return 'completed';
        }
        if (contract.outsourcingStatus) return 'current';
        return 'pending';
    }

    return 'pending';
}

export function ContractJourneyModal({ contract, open, onClose }: ContractJourneyModalProps) {
    const [editors, setEditors] = useState<Editor[]>([]);
    const [newComment, setNewComment] = useState("");
    const [userName, setUserName] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('commentUserName') || '';
        }
        return '';
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const updateContract = useUpdateContract();

    useEffect(() => {
        if (open) {
            fetchEditors().then(setEditors);
        }
    }, [open]);

    // Save username to localStorage when it changes
    useEffect(() => {
        if (userName) {
            localStorage.setItem('commentUserName', userName);
        }
    }, [userName]);

    if (!open) return null;

    const handleAddComment = async () => {
        if (!newComment.trim() || !userName.trim()) return;

        setIsSubmitting(true);
        try {
            const comment: Comment = {
                id: Date.now().toString(),
                text: newComment.trim(),
                author: userName.trim(),
                date: new Date().toLocaleDateString('fa-IR'),
            };

            const updatedComments = [...(contract.comments || []), comment];

            await updateContract.mutateAsync({
                rowIndex: contract.id - 1,
                data: { comments: updatedComments }
            });

            setNewComment("");
        } catch (error) {
            console.error('خطا در افزودن کامنت:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const steps = [
        {
            id: 'permit',
            title: 'مرحله انجام مجوز',
            value: contract.permitStage || 'نامشخص',
            icon: FileText,
            status: getStepStatus('permit', contract),
        },
        {
            id: 'document',
            title: 'وضعیت اسناد',
            value: contract.documentStatus || 'نامشخص',
            icon: Briefcase,
            status: getStepStatus('document', contract),
        },
        {
            id: 'outsourcing',
            title: 'وضعیت برون‌سپاری',
            value: contract.outsourcingStatus || 'نامشخص',
            icon: Check,
            status: getStepStatus('outsourcing', contract),
        },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-gradient-to-l from-primary/20 via-primary/10 to-transparent p-6 border-b border-border">
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-foreground mb-2">
                                مسیر قرارداد
                            </h2>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                                {contract.description}
                            </p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={onClose}>
                            <X className="w-5 h-5" />
                        </Button>
                    </div>

                    {/* Editors */}
                    {editors.length > 0 && (
                        <div className="mt-4 flex items-center gap-2">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">اعضای تیم:</span>
                            <div className="flex -space-x-2 space-x-reverse">
                                {editors.slice(0, 5).map((editor, i) => {
                                    const displayName = editor.name || editor.email?.split('@')[0] || '?';
                                    return (
                                        <div
                                            key={editor.email || i}
                                            title={displayName}
                                            className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-xs font-bold text-primary-foreground ring-2 ring-card"
                                        >
                                            {displayName.charAt(0).toUpperCase()}
                                        </div>
                                    );
                                })}
                                {editors.length > 5 && (
                                    <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground ring-2 ring-card">
                                        +{editors.length - 5}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Timeline */}
                <div className="p-6">
                    <h3 className="text-sm font-semibold text-muted-foreground mb-6">
                        مسیر پیشرفت
                    </h3>

                    <div className="relative">
                        {/* Vertical Line */}
                        <div className="absolute right-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-primary/50 to-muted" />

                        {/* Steps */}
                        <div className="space-y-6">
                            {steps.map((step, index) => {
                                const Icon = step.icon;
                                const isCompleted = step.status === 'completed';
                                const isCurrent = step.status === 'current';

                                return (
                                    <div key={step.id} className="relative flex gap-4">
                                        {/* Icon Circle */}
                                        <div
                                            className={`
                                                relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0
                                                transition-all duration-300
                                                ${isCompleted
                                                    ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                                                    : isCurrent
                                                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30 animate-pulse'
                                                        : 'bg-muted text-muted-foreground'
                                                }
                                            `}
                                        >
                                            {isCompleted ? (
                                                <Check className="w-4 h-4" />
                                            ) : isCurrent ? (
                                                <Clock className="w-4 h-4" />
                                            ) : (
                                                <Icon className="w-4 h-4" />
                                            )}
                                        </div>

                                        {/* Content Card */}
                                        <div
                                            className={`
                                                flex-1 p-4 rounded-xl border transition-all duration-300
                                                ${isCompleted
                                                    ? 'bg-green-500/10 border-green-500/30'
                                                    : isCurrent
                                                        ? 'bg-primary/10 border-primary/30 shadow-lg'
                                                        : 'bg-muted/30 border-border'
                                                }
                                            `}
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <h4 className="text-sm font-semibold text-foreground">
                                                    {step.title}
                                                </h4>
                                                {isCompleted && (
                                                    <span className="text-xs text-green-500 font-medium">
                                                        ✓ انجام شده
                                                    </span>
                                                )}
                                                {isCurrent && (
                                                    <span className="text-xs text-primary font-medium">
                                                        در حال انجام
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                {step.value}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Comments Section */}
                <div className="border-t border-border p-6 bg-muted/20">
                    <div className="flex items-center gap-2 mb-4">
                        <MessageSquare className="w-4 h-4 text-primary" />
                        <h3 className="text-sm font-semibold text-foreground">
                            نظرات ({contract.comments?.length || 0})
                        </h3>
                    </div>

                    {/* Existing Comments */}
                    {contract.comments && contract.comments.length > 0 && (
                        <div className="space-y-3 mb-4 max-h-40 overflow-y-auto">
                            {contract.comments.map((comment) => (
                                <div
                                    key={comment.id}
                                    className="bg-card p-3 rounded-lg border border-border"
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <ContractorAvatar name={comment.author} size="sm" />
                                        <span className="text-xs font-medium text-foreground">
                                            {comment.author}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {comment.date}
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground pr-8">
                                        {comment.text}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Add Comment */}
                    <div className="space-y-2">
                        {/* Username Input */}
                        <div className="flex items-center gap-2">
                            <ContractorAvatar name={userName || 'نام'} size="sm" />
                            <input
                                type="text"
                                placeholder="نام شما..."
                                value={userName}
                                onChange={(e) => setUserName(e.target.value)}
                                className="flex-1 bg-background border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                        {/* Comment Input */}
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder={userName ? "نظر خود را بنویسید..." : "ابتدا نام خود را وارد کنید"}
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                                disabled={!userName.trim()}
                                className="flex-1 bg-background border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            <Button
                                size="sm"
                                onClick={handleAddComment}
                                disabled={isSubmitting || !newComment.trim() || !userName.trim()}
                                className="gap-2"
                            >
                                <Send className="w-4 h-4" />
                                ارسال
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
