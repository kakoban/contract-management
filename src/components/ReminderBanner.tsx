import { useState } from "react";
import { Bell, AlertTriangle, Clock, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useReminders, Reminder } from "@/hooks/useReminders";
import { cn } from "@/lib/utils";

function ReminderItem({ reminder }: { reminder: Reminder }) {
    const iconClass = cn(
        "h-4 w-4",
        reminder.type === 'urgent' && "text-destructive",
        reminder.type === 'warning' && "text-warning",
        reminder.type === 'pending' && "text-muted-foreground"
    );

    return (
        <div className={cn(
            "flex items-start gap-3 p-3 rounded-lg border",
            reminder.type === 'urgent' && "border-destructive/30 bg-destructive/5",
            reminder.type === 'warning' && "border-warning/30 bg-warning/5",
            reminder.type === 'pending' && "border-border bg-muted/30"
        )}>
            {reminder.type === 'urgent' ? (
                <AlertTriangle className={iconClass} />
            ) : (
                <Clock className={iconClass} />
            )}
            <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">
                    {reminder.message}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                    پیمانکار: {reminder.contract.contractor || "نامشخص"}
                </p>
            </div>
        </div>
    );
}

export function ReminderBanner() {
    const [isOpen, setIsOpen] = useState(false);
    const { reminders, urgentCount, warningCount, totalCount, hasReminders } = useReminders();

    if (!hasReminders) {
        return null;
    }

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mb-4">
            <div className={cn(
                "flex items-center justify-between p-4 rounded-lg border",
                urgentCount > 0
                    ? "bg-destructive/10 border-destructive/30"
                    : "bg-warning/10 border-warning/30"
            )}>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Bell className={cn(
                            "h-5 w-5",
                            urgentCount > 0 ? "text-destructive" : "text-warning"
                        )} />
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-white">
                            {totalCount}
                        </span>
                    </div>
                    <div>
                        <p className="font-medium text-foreground">
                            {urgentCount > 0 ? (
                                <>
                                    <span className="text-destructive">{urgentCount}</span> مورد اضطراری
                                </>
                            ) : (
                                <>
                                    <span className="text-warning">{warningCount}</span> مورد نیاز به بررسی
                                </>
                            )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {totalCount} قرارداد نیاز به توجه دارد
                        </p>
                    </div>
                </div>
                <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-1">
                        {isOpen ? "بستن" : "مشاهده"}
                        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                </CollapsibleTrigger>
            </div>

            <CollapsibleContent>
                <ScrollArea className="max-h-[300px] mt-2">
                    <div className="space-y-2 pr-4">
                        {reminders.map((reminder) => (
                            <ReminderItem key={reminder.contract.id} reminder={reminder} />
                        ))}
                    </div>
                </ScrollArea>
            </CollapsibleContent>
        </Collapsible>
    );
}
