import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import type { Expense, SortConfig } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Trash2, ArrowUpDown, ArrowUp, ArrowDown, Search, ChevronLeft, ChevronRight } from 'lucide-react';

interface TransactionListProps {
    expenses: Expense[];
    sortConfig: SortConfig;
    onToggleSort: (field: 'date' | 'amount') => void;
    onDelete: (id: string) => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({
    expenses,
    sortConfig,
    onToggleSort,
    onDelete,
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 6;

    const filteredExpenses = expenses.filter(expense => {
        const term = searchTerm.toLowerCase();
        return (
            expense.description.toLowerCase().includes(term) ||
            expense.category.toLowerCase().includes(term) ||
            expense.amount.toString().includes(term)
        );
    });

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, expenses.length]);

    const totalPages = Math.ceil(filteredExpenses.length / ITEMS_PER_PAGE);
    const paginatedExpenses = filteredExpenses.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const getSortIcon = (field: 'date' | 'amount') => {
        if (sortConfig.field !== field) return <ArrowUpDown className="ml-2 h-4 w-4" />;
        return sortConfig.order === 'asc' ? (
            <ArrowUp className="ml-2 h-4 w-4" />
        ) : (
            <ArrowDown className="ml-2 h-4 w-4" />
        );
    };

    return (
        <Card className="glass-card flex-1">
            <CardHeader className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between px-6 py-5">
                <CardTitle className="text-xl">Recent Transactions</CardTitle>
                <div className="relative w-full sm:max-w-xs">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search transactions..."
                        className="pl-9 bg-black/20 border-white/10 focus:bg-black/40 transition-colors"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </CardHeader>
            <CardContent>
                {filteredExpenses.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground bg-white/5 rounded-lg border border-dashed border-white/10 mx-2">
                        {searchTerm ? (
                            <p>No results found for "{searchTerm}"</p>
                        ) : (
                            <p>No transactions found. Add one to get started!</p>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Header - Hidden on Mobile */}
                        <div className="hidden md:grid grid-cols-[1.5fr_1.5fr_2fr_1fr_0.5fr] gap-4 text-sm font-medium text-muted-foreground px-4 py-2 border-b border-white/5">
                            <div
                                className="flex items-center cursor-pointer hover:text-primary transition-colors select-none"
                                onClick={() => onToggleSort('date')}
                            >
                                DATE {getSortIcon('date')}
                            </div>
                            <div className="select-none">CATEGORY</div>
                            <div className="select-none">DESCRIPTION</div>
                            <div
                                className="flex items-center justify-end cursor-pointer hover:text-primary transition-colors select-none"
                                onClick={() => onToggleSort('amount')}
                            >
                                AMOUNT {getSortIcon('amount')}
                            </div>
                            <div className="text-right select-none">ACTIONS</div>
                        </div>

                        {/* List */}
                        <div className="space-y-2 min-h-[460px]">
                            {paginatedExpenses.map((expense) => (
                                <div
                                    key={expense.id}
                                    className="group flex flex-col gap-2 md:grid md:grid-cols-[1.5fr_1.5fr_2fr_1fr_0.5fr] md:items-center rounded-lg border border-transparent p-4 transition-all hover:bg-muted/50 hover:border-border"
                                >
                                    {/* Mobile: Top Row with Date and Amount */}
                                    <div className="flex justify-between items-center md:hidden">
                                        <div className="text-sm font-medium text-muted-foreground">
                                            {format(new Date(expense.date), 'MMM dd, yyyy')}
                                        </div>
                                        <div className={cn(
                                            "text-lg font-bold",
                                            "text-foreground"
                                        )}>
                                            {formatCurrency(expense.amount)}
                                        </div>
                                    </div>

                                    {/* Desktop: Date */}
                                    <div className="hidden md:block text-sm font-medium">
                                        {format(new Date(expense.date), 'MMM dd, yyyy')}
                                    </div>

                                    {/* Category */}
                                    <div className="flex justify-between md:block items-center">
                                        <span className="md:hidden text-xs text-muted-foreground">Category</span>
                                        <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                                            {expense.category}
                                        </span>
                                    </div>

                                    {/* Description */}
                                    <div className="text-sm text-muted-foreground md:text-foreground md:truncate" title={expense.description}>
                                        {expense.description || '-'}
                                    </div>

                                    {/* Desktop: Amount */}
                                    <div className={cn(
                                        "hidden md:block text-sm font-bold text-right",
                                        "text-foreground"
                                    )}>
                                        {formatCurrency(expense.amount)}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex justify-end md:block mt-2 md:mt-0 text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onDelete(expense.id)}
                                            className="text-destructive hover:bg-destructive/10 md:text-muted-foreground md:hover:text-destructive md:opacity-0 md:group-hover:opacity-100 h-8 px-2 md:h-10 md:px-4"
                                        >
                                            <span className="md:hidden mr-2">Delete</span>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-4">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="text-muted-foreground hover:text-primary disabled:opacity-50"
                                >
                                    <ChevronLeft className="h-4 w-4 mr-2" />
                                    Previous
                                </Button>
                                <span className="text-sm text-muted-foreground font-mono">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="text-muted-foreground hover:text-primary disabled:opacity-50"
                                >
                                    Next
                                    <ChevronRight className="h-4 w-4 ml-2" />
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
