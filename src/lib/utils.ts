import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0, // Common in India to hide decimals for large numbers, but can keep 2
    }).format(amount);
}

export function generateId(): string {
    return Math.random().toString(36).substring(2, 9);
}
