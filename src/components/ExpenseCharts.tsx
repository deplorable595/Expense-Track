import { useMemo } from 'react';
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts';
import {
    format,
    endOfWeek,
    isSameDay,
    subMonths,
    startOfMonth,
    endOfMonth,
    isSameMonth,
    eachDayOfInterval,
    eachWeekOfInterval,
    isWithinInterval
} from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar, RotateCcw } from 'lucide-react';
import type { Expense } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';

interface ExpenseChartsProps {
    expenses: Expense[];
    viewDate: Date;
    onPrevMonth: () => void;
    onNextMonth: () => void;
    onReset: () => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#d0ed57'];

export const ExpenseCharts: React.FC<ExpenseChartsProps> = ({
    expenses,
    viewDate,
    onPrevMonth,
    onNextMonth,
    onReset
}) => {
    // Local state removed in favor of props from parent for synchronization
    // const [viewDate, setViewDate] = useState(new Date());

    // Handlers are now props
    const handlePrevMonth = onPrevMonth;
    const handleNextMonth = onNextMonth;
    const handleReset = onReset;

    // Daily Expenses (Strictly for the VIEW DATE MONTH)
    const dailyData = useMemo(() => {
        const start = startOfMonth(viewDate);
        const end = endOfMonth(viewDate);

        // Generate all days for the month
        const days = eachDayOfInterval({ start, end });

        return days.map(day => {
            const dayExpenses = expenses.filter((e) => isSameDay(new Date(e.date), day));
            const total = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
            return {
                date: format(day, 'dd'), // Just the day number makes it cleaner
                fullDate: format(day, 'MMM dd'), // For tooltip
                amount: total,
            };
        });
    }, [expenses, viewDate]);

    // Weekly Expenses (Weeks within the VIEW DATE MONTH)
    const weeklyData = useMemo(() => {
        const monthStart = startOfMonth(viewDate);
        const monthEnd = endOfMonth(viewDate);

        // Get weeks overlapping this month
        const weeks = eachWeekOfInterval({
            start: monthStart,
            end: monthEnd
        }, { weekStartsOn: 1 }); // Start weeks on Monday

        return weeks.map((weekStart, index) => {
            const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });

            // Filter expenses strictly for this week interval
            const weekExpenses = expenses.filter((e) => {
                const d = new Date(e.date);
                return isWithinInterval(d, { start: weekStart, end: weekEnd });
            });

            const total = weekExpenses.reduce((sum, e) => sum + e.amount, 0);

            // Label handling
            let label = `Week ${index + 1}`;
            if (index === 0) label = "Week 1"; // Simplification

            return {
                name: label,
                fullLabel: `${format(weekStart, 'MMM dd')} - ${format(weekEnd, 'MMM dd')}`,
                amount: total,
            };
        });
    }, [expenses, viewDate]);

    // Monthly Trends (Half Year view centered or ending on viewDate? Let's keep ending on viewDate for context)
    const monthlyData = useMemo(() => {
        const data = [];
        for (let i = 5; i >= 0; i--) {
            const date = subMonths(viewDate, i);
            const monthStart = startOfMonth(date);
            const monthEnd = endOfMonth(date);

            const monthExpenses = expenses.filter((e) => {
                const d = new Date(e.date);
                return d >= monthStart && d <= monthEnd;
            });

            const total = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
            data.push({
                name: format(date, 'MMM'),
                fullName: format(date, 'MMMM yyyy'),
                amount: total,
                // Highlight the selected month
                fill: isSameMonth(date, viewDate) ? '#d0ed57' : '#8884d8'
            });
        }
        return data;
    }, [expenses, viewDate]);

    // Category Breakdown (View Date Month)
    const categoryData = useMemo(() => {
        const currentMonthExpenses = expenses.filter((e) => isSameMonth(new Date(e.date), viewDate));

        const categoryMap = new Map<string, number>();
        currentMonthExpenses.forEach((e) => {
            const current = categoryMap.get(e.category) || 0;
            categoryMap.set(e.category, current + e.amount);
        });

        return Array.from(categoryMap.entries()).map(([name, value]) => ({
            name,
            value
        })).sort((a, b) => b.value - a.value); // Sort by highest spend
    }, [expenses, viewDate]);

    return (
        <div className="flex flex-col gap-4">
            {/* Navigation Controls */}
            <div className="flex items-center justify-between bg-black/40 p-3 rounded-lg border border-white/10 backdrop-blur-md">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-primary/10 rounded-full">
                        <Calendar className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-widest font-mono">Current View</p>
                        <h3 className="text-lg font-bold text-white">{format(viewDate, 'MMMM yyyy')}</h3>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={handlePrevMonth} className="hover:bg-primary/20 hover:text-primary transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                    </Button>

                    <Button variant="outline" size="sm" onClick={handleReset} className="hidden sm:flex items-center gap-2 border-primary/30 hover:bg-primary/10 text-xs">
                        <RotateCcw className="w-3 h-3" /> Today
                    </Button>

                    <Button variant="ghost" size="sm" onClick={handleNextMonth} className="hover:bg-primary/20 hover:text-primary transition-colors">
                        <ChevronRight className="w-5 h-5" />
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                {/* 1. Daily Expenses */}
                <Card className="glass-card">
                    <CardHeader>
                        <CardTitle>Daily Expenses (Ending {format(viewDate, 'MMM dd')})</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={dailyData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                    <XAxis
                                        dataKey="date"
                                        stroke="hsl(var(--muted-foreground))"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        minTickGap={10}
                                    />
                                    <YAxis
                                        stroke="hsl(var(--muted-foreground))"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value: number) => `₹${value}`}
                                        domain={[0, 'auto']}
                                    />
                                    <Tooltip
                                        formatter={(value: number | undefined) => [value != null ? `₹${value}` : '', 'Amount']}
                                        contentStyle={{ backgroundColor: '#09090b', borderColor: 'rgba(0, 212, 255, 0.3)', borderRadius: '8px', boxShadow: '0 0 15px rgba(0, 212, 255, 0.2)', color: '#fff' }}
                                        itemStyle={{ color: '#00d4ff', fontWeight: 'bold' }}
                                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    />
                                    <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* 2. Weekly Expenses */}
                <Card className="glass-card">
                    <CardHeader>
                        <CardTitle>Weekly Expenses</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={weeklyData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                    <XAxis
                                        dataKey="name"
                                        stroke="hsl(var(--muted-foreground))"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="hsl(var(--muted-foreground))"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value: number) => `₹${value}`}
                                        domain={[0, 'auto']}
                                    />
                                    <Tooltip
                                        formatter={(value: number | undefined) => [value != null ? `₹${value}` : '', 'Amount']}
                                        contentStyle={{ backgroundColor: '#09090b', borderColor: 'rgba(0, 212, 255, 0.3)', borderRadius: '8px', boxShadow: '0 0 15px rgba(0, 212, 255, 0.2)', color: '#fff' }}
                                        itemStyle={{ color: '#00d4ff', fontWeight: 'bold' }}
                                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    />
                                    <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* 3. Monthly Expenses */}
                <Card className="glass-card">
                    <CardHeader>
                        <CardTitle>Monthly Expenses (Last 6 Months)</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={monthlyData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                    <XAxis
                                        dataKey="name"
                                        stroke="hsl(var(--muted-foreground))"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="hsl(var(--muted-foreground))"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value: number) => `₹${value}`}
                                        domain={[0, 'auto']}
                                    />
                                    <Tooltip
                                        formatter={(value: number | undefined) => [value != null ? `₹${value}` : '', 'Amount']}
                                        contentStyle={{ backgroundColor: '#09090b', borderColor: 'rgba(0, 212, 255, 0.3)', borderRadius: '8px', boxShadow: '0 0 15px rgba(0, 212, 255, 0.2)', color: '#fff' }}
                                        itemStyle={{ color: '#00d4ff', fontWeight: 'bold' }}
                                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    />
                                    <Bar dataKey="amount" fill="#8884d8" radius={[4, 4, 0, 0]} >
                                        {monthlyData.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* 4. Category Breakdown */}
                <Card className="glass-card">
                    <CardHeader>
                        <CardTitle>Category Breakdown ({format(viewDate, 'MMMM yyyy')})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            {categoryData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={categoryData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                                            outerRadius={100}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {categoryData.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value: number | undefined) => value != null ? `₹${value.toFixed(2)}` : ''}
                                            contentStyle={{ backgroundColor: '#09090b', borderColor: 'rgba(0, 212, 255, 0.3)', borderRadius: '8px', boxShadow: '0 0 15px rgba(0, 212, 255, 0.2)', color: '#fff' }}
                                            itemStyle={{ color: '#00d4ff', fontWeight: 'bold' }}
                                        />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex bg-muted/20 h-full items-center justify-center rounded-lg border border-dashed text-muted-foreground">
                                    No spending data for this month
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
