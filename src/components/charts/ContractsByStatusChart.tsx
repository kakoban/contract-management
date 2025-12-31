import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useAnalytics, StageData } from '@/hooks/useAnalytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const ContractsByStatusChart = () => {
    const { contractsByStage, isLoading } = useAnalytics();

    if (isLoading) {
        return (
            <Card className="h-[350px]">
                <CardHeader>
                    <Skeleton className="h-6 w-40" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-[250px] w-full rounded-full" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="h-[350px]">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold">وضعیت مراحل قراردادها</CardTitle>
            </CardHeader>
            <CardContent className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={contractsByStage}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={90}
                            fill="#8884d8"
                            dataKey="count"
                            nameKey="name"
                            animationDuration={800}
                        >
                            {contractsByStage.map((entry: StageData, index: number) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip
                            formatter={(value: number, name: string) => [`${value} قرارداد`, name]}
                            contentStyle={{
                                backgroundColor: 'hsl(var(--popover))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px',
                                direction: 'rtl',
                            }}
                        />
                        <Legend
                            layout="horizontal"
                            align="center"
                            verticalAlign="bottom"
                            formatter={(value: string) => <span style={{ color: 'hsl(var(--foreground))' }}>{value}</span>}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
};
