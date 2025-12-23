import { useMemo } from 'react';
import type { Expense } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { formatCurrency } from '../lib/utils';
import { TrendingUp, DollarSign, PieChart, Calculator } from 'lucide-react';

interface SummaryCardsProps {
    expenses: Expense[];
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ expenses }) => {
    const stats = useMemo(() => {
        const totalBalance = expenses.reduce((acc, curr) => acc + curr.amount, 0);

        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        // Monthly Spend (Current Month Only)
        const monthlySpend = expenses
            .filter((e) => {
                const d = new Date(e.date);
                return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
            })
            .reduce((acc, curr) => acc + curr.amount, 0);

        // Average Monthly Spend
        // 1. Identify unique months
        const uniqueMonths = new Set(expenses.map(e => e.date.substring(0, 7))); // 'YYYY-MM'
        const monthCount = uniqueMonths.size || 1; // Avoid divide by zero, default to 1 if empty
        const averageSpend = totalBalance / monthCount;

        const categoryTotals: Record<string, number> = {};
        expenses.forEach((e) => {
            categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
        });

        // Find top category
        let topCategory = 'None';
        let max = 0;
        Object.entries(categoryTotals).forEach(([cat, amount]) => {
            if (amount > max) {
                max = amount;
                topCategory = cat;
            }
        });

        return { totalBalance, monthlySpend, averageSpend, topCategory };
    }, [expenses]);

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Total Spend */}
            <Card className="glass-card hover:scale-[1.02] transition-transform">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        TOTAL SPEND
                    </CardTitle>
                    <DollarSign className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(stats.totalBalance)}</div>
                    <p className="text-xs text-muted-foreground">
                        All-time tracked expenses
                    </p>
                </CardContent>
            </Card>

            {/* Monthly Spend */}
            <Card className="glass-card hover:scale-[1.02] transition-transform">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        CURRENT MONTH
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(stats.monthlySpend)}</div>
                    <p className="text-xs text-muted-foreground">
                        Spending for {new Date().toLocaleString('default', { month: 'long' })}
                    </p>
                </CardContent>
            </Card>

            {/* Average Spend */}
            <Card className="glass-card hover:scale-[1.02] transition-transform">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        AVG. MONTHLY
                    </CardTitle>
                    <Calculator className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(stats.averageSpend)}</div>
                    <p className="text-xs text-muted-foreground">
                        Per month average
                    </p>
                </CardContent>
            </Card>

            {/* Top Category */}
            <Card className="glass-card hover:scale-[1.02] transition-transform">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        TOP CATEGORY
                    </CardTitle>
                    <PieChart className="h-4 w-4 text-indigo-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold capitalize truncate" title={stats.topCategory}>{stats.topCategory}</div>
                    <p className="text-xs text-muted-foreground">
                        Most frequent area
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};
