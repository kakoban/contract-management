import { ContractsByTypeChart } from './charts/ContractsByTypeChart';
import { ContractsByStatusChart } from './charts/ContractsByStatusChart';
import { BudgetByTypeChart } from './charts/BudgetByTypeChart';
import { TopContractorsChart } from './charts/TopContractorsChart';
import { useAnalytics } from '@/hooks/useAnalytics';
import { TrendingUp, Wallet } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export const AnalyticsDashboard = () => {
    const { totalBudget, contractsByType, isLoading } = useAnalytics();

    const totalContracts = contractsByType.reduce((sum, item) => sum + item.value, 0);
    const totalBudgetFormatted = (totalBudget / 1000000000).toLocaleString('fa-IR', { maximumFractionDigits: 0 });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-primary/10">
                    <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-foreground">داشبورد تحلیلی</h2>
                    <p className="text-sm text-muted-foreground">نمای کلی از وضعیت قراردادها و بودجه</p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <Card className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 border-violet-500/20">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">مجموع قراردادها</p>
                                <p className="text-3xl font-bold text-foreground">
                                    {isLoading ? '...' : totalContracts.toLocaleString('fa-IR')}
                                </p>
                            </div>
                            <div className="p-3 rounded-full bg-violet-500/20">
                                <TrendingUp className="w-6 h-6 text-violet-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 border-emerald-500/20">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">مجموع بودجه (میلیارد ریال)</p>
                                <p className="text-3xl font-bold text-foreground">
                                    {isLoading ? '...' : totalBudgetFormatted}
                                </p>
                            </div>
                            <div className="p-3 rounded-full bg-emerald-500/20">
                                <Wallet className="w-6 h-6 text-emerald-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ContractsByTypeChart />
                <ContractsByStatusChart />
                <BudgetByTypeChart />
                <TopContractorsChart />
            </div>
        </div>
    );
};
