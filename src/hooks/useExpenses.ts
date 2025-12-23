import { useState, useEffect, useCallback, useRef } from 'react';
import type { Expense, SortConfig } from '../types';

// API Configuration
// API Configuration
const getApiUrl = () => {
    // Dynamic URL based on where the frontend is loaded
    const hostname = window.location.hostname;
    // If running locally, point to the Express server on port 3001
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return `http://${hostname}:3001/api`;
    }
    // In production (Vercel), use relative path to utilize Serverless Functions
    return '/api';
};

export const useExpenses = (userId: string) => {
    // State
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'date', order: 'desc' });

    // Use a Ref to hold the BroadcastChannel so it persists across renders
    const channelRef = useRef<BroadcastChannel | null>(null);

    // 1. FETCH Data (Pull)
    const fetchExpenses = useCallback(async () => {
        if (!userId) return;
        try {
            const API_URL = getApiUrl();
            const response = await fetch(`${API_URL}/expenses/${userId}`);
            if (response.ok) {
                const data = await response.json();
                console.log(`[Server Sync] Fetched ${data.length} expenses for ${userId}`);
                setExpenses(data);
            }
        } catch (error) {
            console.error("Failed to fetch expenses:", error);
        }
    }, [userId]);

    // Initial Load, Channel Setup, Polling & Window Focus
    useEffect(() => {
        // Initialize BroadcastChannel
        channelRef.current = new BroadcastChannel('expense_updates');

        // Listen for updates from other tabs
        channelRef.current.onmessage = (event) => {
            console.log("[Cross-Tab] Received update signal:", event.data);
            fetchExpenses();
        };

        // Fetch immediately
        // eslint-disable-next-line
        fetchExpenses();

        // Sync on Window Focus (when user switches back to this tab)
        const onFocus = () => {
            console.log("[Focus] Syncing...");
            fetchExpenses();
        };
        window.addEventListener('focus', onFocus);

        // Polling Removed for Local Stability
        // const pollInterval = setInterval(() => { ... });

        return () => {
            channelRef.current?.close();
            window.removeEventListener('focus', onFocus);
            // clearInterval(pollInterval);
        };
    }, [fetchExpenses]);

    // 2. ADD (Push)
    const addExpense = useCallback(async (expense: Expense) => {
        // Optimistic Update
        setExpenses(prev => [...prev, expense]);

        try {
            const API_URL = getApiUrl();
            await fetch(`${API_URL}/expenses`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, expense })
            });

            // Notify other tabs
            channelRef.current?.postMessage('update');
        } catch (error) {
            console.error("Failed to save expense to server:", error);
            alert("Warning: Could not save to server. Check connection.");
        }
    }, [userId]);

    // 3. DELETE (Push)
    const deleteExpense = useCallback(async (id: string) => {
        // Optimistic Update
        setExpenses(prev => prev.filter(e => e.id !== id));

        try {
            const API_URL = getApiUrl();
            await fetch(`${API_URL}/expenses/${userId}/${id}`, {
                method: 'DELETE',
            });
            channelRef.current?.postMessage('update');
        } catch (error) {
            console.error("Failed to delete from server:", error);
        }
    }, [userId]);

    // 4. IMPORT (Batch Push)
    const importExpenses = useCallback(async (newExpenses: Expense[], onProgress?: (progress: number) => void) => {
        // Immediate Local Update (Fast)
        setExpenses(prev => [...prev, ...newExpenses]);

        try {
            if (onProgress) onProgress(50);

            // Single Batch Request
            const API_URL = getApiUrl();
            const res = await fetch(`${API_URL}/expenses/batch`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, expenses: newExpenses })
            });

            if (onProgress) onProgress(100);

            if (!res.ok) {
                const txt = await res.text();
                console.error("Server batch import failed:", txt);
                alert("Saved locally, but server sync failed: " + txt);
            } else {
                channelRef.current?.postMessage('update');
            }

        } catch (error) {
            console.error("Import error:", error);
            alert("Saved locally. Server unreachable.");
        }
    }, [userId]);

    const clearExpenses = useCallback(async () => {
        setExpenses([]);

        try {
            const API_URL = getApiUrl();
            await fetch(`${API_URL}/expenses/${userId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify([])
            });
            channelRef.current?.postMessage('update');
        } catch (e) {
            console.error("Failed to clear expenses on server:", e);
        }
    }, [userId]);

    const toggleSort = useCallback((field: 'date' | 'amount') => {
        setSortConfig(current => ({
            field,
            order: current.field === field && current.order === 'desc' ? 'asc' : 'desc'
        }));
    }, []);

    // Sort logic
    const sortedExpenses = [...expenses].sort((a, b) => {
        if (sortConfig.field === 'date') {
            return sortConfig.order === 'desc'
                ? new Date(b.date).getTime() - new Date(a.date).getTime()
                : new Date(a.date).getTime() - new Date(b.date).getTime();
        } else {
            return sortConfig.order === 'desc'
                ? b.amount - a.amount
                : a.amount - b.amount;
        }
    });

    return {
        expenses: sortedExpenses,
        addExpense,
        deleteExpense,
        importExpenses,
        clearExpenses,
        sortConfig,
        toggleSort
    };
};
