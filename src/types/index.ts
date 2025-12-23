export interface Expense {
    id: string;
    date: string; // ISO string
    description: string;
    category: string;
    amount: number;
}

export type SortField = 'date' | 'amount';
export type SortOrder = 'asc' | 'desc';

export interface SortConfig {
    field: SortField;
    order: SortOrder;
}

export interface ExpenseSummary {
    totalBalance: number;
    monthlySpend: number;
    topCategory: string;
}
