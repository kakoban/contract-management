import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { useAnalytics } from '@/hooks/useAnalytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const COLORS = ['#f59e0b', '#fb923c', '#fbbf24', '#fcd34d', '#fde68a'];

export const TopContractorsChart = () => {
    const { topContractors, isLoading } = useAnalytics();

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

    if (topContractors.length === 0) {
        return (
            <Card className="h-[350px]">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-semibold">پیمانکاران برتر</CardTitle>
                </CardHeader>
                <CardContent className="h-[280px] flex items-center justify-center">
                    <p className="text-muted-foreground">داده‌ای یافت نشد</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="h-[350px]">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold">پیمانکاران برتر (بر اساس تعداد قرارداد)</CardTitle>
            </CardHeader>
            <CardContent className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={topContractors}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                        <XAxis
                            type="number"
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                            allowDecimals={false}
                        />
                        <YAxis
                            type="category"
                            dataKey="name"
                            width={150}
                            tick={{ fill: 'hsl(var(--foreground))', fontSize: 11 }}
                            tickFormatter={(value) => value.length > 20 ? value.substring(0, 20) + '...' : value}
                        />
                        <Tooltip
                            formatter={(value: number) => [`${value} قرارداد`]}
                            labelFormatter={(label) => label}
                            contentStyle={{
                                backgroundColor: 'hsl(var(--popover))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px',
                                direction: 'rtl',
                            }}
                        />
                        <Bar dataKey="count" radius={[0, 4, 4, 0]} animationDuration={800}>
                            {topContractors.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
};
