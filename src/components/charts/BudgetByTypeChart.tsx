import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { useAnalytics } from '@/hooks/useAnalytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899'];

export const BudgetByTypeChart = () => {
    const { budgetByType, isLoading } = useAnalytics();

    if (isLoading) {
        return (
            <Card className="h-[350px]">
                <CardHeader>
                    <Skeleton className="h-6 w-40" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-[250px] w-full" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="h-[350px]">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold">توزیع بودجه بر اساس نوع (میلیارد ریال)</CardTitle>
            </CardHeader>
            <CardContent className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={budgetByType}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                        <XAxis
                            type="number"
                            tickFormatter={(value) => (value / 1000000000).toLocaleString('fa-IR')}
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                        />
                        <YAxis
                            type="category"
                            dataKey="name"
                            width={100}
                            tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
                        />
                        <Tooltip
                            formatter={(value: number) => [`${(value / 1000000000).toLocaleString('fa-IR')} میلیارد ریال`]}
                            labelFormatter={(label) => label}
                            contentStyle={{
                                backgroundColor: 'hsl(var(--popover))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px',
                                direction: 'rtl',
                            }}
                        />
                        <Bar dataKey="budget" radius={[0, 4, 4, 0]} animationDuration={800}>
                            {budgetByType.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
};
