import { useState } from "react";
import { MessageSquare, Send, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Comment } from "@/types/contract";
import { useUpdateContract } from "@/hooks/useContracts";

interface CommentsPopoverProps {
    rowIndex: number;
    comments: Comment[];
    contractTitle?: string;
}

export function CommentsPopover({ rowIndex, comments = [], contractTitle }: CommentsPopoverProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [newComment, setNewComment] = useState("");
    const updateContractMutation = useUpdateContract();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        const comment: Comment = {
            id: crypto.randomUUID(),
            text: newComment.trim(),
            author: "کاربر سیستم", // در آینده می‌توان از کانتکست کاربر خواند
            date: new Date().toLocaleDateString('fa-IR', { hour: '2-digit', minute: '2-digit' })
        };

        const updatedComments = [...comments, comment];

        // Optimistic update happens in the hook, but we trigger it here
        updateContractMutation.mutate({
            rowIndex,
            data: { comments: updatedComments }
        }, {
            onSuccess: () => {
                setNewComment("");
            }
        });
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <MessageSquare className="h-4 w-4" />
                    {comments.length > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                            {comments.length}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between px-4 py-3 border-b">
                    <h4 className="font-semibold text-sm">نظرات و یادداشت‌ها</h4>
                    <span className="text-xs text-muted-foreground">{contractTitle}</span>
                </div>

                <ScrollArea className="h-[300px] p-4">
                    {comments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2 mt-10">
                            <MessageSquare className="h-8 w-8 opacity-20" />
                            <p className="text-sm">هنوز هیچ نظری ثبت نشده است</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {comments.map((comment) => (
                                <div key={comment.id} className="flex gap-3 text-right" dir="rtl">
                                    <Avatar className="h-8 w-8 border">
                                        <AvatarImage src="" />
                                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                            {comment.author.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col gap-1 flex-1">
                                        <div className="bg-muted/50 p-2 rounded-lg rounded-tr-none text-sm">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="font-semibold text-xs">{comment.author}</span>
                                            </div>
                                            <p className="text-foreground/90">{comment.text}</p>
                                        </div>
                                        <span className="text-[10px] text-muted-foreground px-1">
                                            {comment.date}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>

                <Separator />

                <form onSubmit={handleSubmit} className="p-3 flex gap-2">
                    <Input
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="نوشتن نظر جدید..."
                        className="text-sm"
                        autoComplete="off"
                    />
                    <Button type="submit" size="icon" disabled={!newComment.trim() || updateContractMutation.isPending}>
                        <Send className="h-4 w-4" />
                    </Button>
                </form>
            </PopoverContent>
        </Popover>
    );
}
