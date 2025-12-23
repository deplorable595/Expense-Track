import { useState } from 'react';
import type { Expense } from '../types';
import { generateId, cn } from '../lib/utils';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { X, Calendar, IndianRupee, Tag, FileText, Check, Loader2 } from 'lucide-react';

interface AddExpenseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (expense: Expense) => void;
}

const QUICK_AMOUNTS = ["50", "100", "200", "500", "1000", "2000"];

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
    isOpen,
    onClose,
    onAdd,
}) => {
    // Restore default date to "Today" for better UX ("working properly")
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        description: '',
        category: 'Food',
        amount: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation Check
        if (!formData.amount || !formData.date || !formData.category) {
            alert("Please fill in all fields (Date, Category, Amount)");
            return;
        }

        setIsSubmitting(true);

        // Keep a small delay for visual feedback, but functionally it's instant locally
        await new Promise(resolve => setTimeout(resolve, 400));

        const newExpense: Expense = {
            id: generateId(),
            date: formData.date,
            description: formData.description || formData.category, // Use entered description
            category: formData.category,
            amount: parseFloat(formData.amount),
        };

        onAdd(newExpense);
        setIsSuccess(true);

        // Brief success state before closing
        await new Promise(resolve => setTimeout(resolve, 500));

        setFormData({
            date: new Date().toISOString().split('T')[0],
            description: '',
            category: 'Food',
            amount: '',
        });
        setIsSubmitting(false);
        setIsSuccess(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="w-full max-w-lg p-4 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
                <Card className="relative border-primary/30 bg-black/90 shadow-[0_0_50px_rgba(0,212,255,0.15)] overflow-hidden glass">
                    {/* Decorative Elements */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"></div>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-4 top-4 hover:bg-primary/20 hover:text-primary transition-colors text-muted-foreground z-10"
                        onClick={onClose}
                        disabled={isSubmitting}
                    >
                        <X className="h-5 w-5" />
                    </Button>

                    <CardHeader className="pb-2">
                        <CardTitle className="text-2xl font-bold tracking-tight text-glow flex items-center gap-2">
                            <IndianRupee className="text-primary h-6 w-6" />
                            NEW <span className="text-primary">ENTRY</span>
                        </CardTitle>
                        <p className="text-xs text-muted-foreground font-mono tracking-wider">LOG NEW FINANCIAL ACTIVITY</p>
                    </CardHeader>

                    <CardContent className="pt-4">
                        <form onSubmit={handleSubmit} className="space-y-5">

                            {/* Row 1: Date & Category */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                                        <Calendar className="h-3 w-3 text-primary" /> DATE
                                    </label>
                                    <Input
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        required
                                        style={{ colorScheme: 'dark' }}
                                        className="bg-black/40 border-primary/20 focus:border-primary/60 focus:ring-primary/20 transition-all font-mono"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                                        <Tag className="h-3 w-3 text-secondary" /> CATEGORY
                                    </label>
                                    <select
                                        className={cn(
                                            'flex h-10 w-full rounded-md border border-primary/20 bg-black/40 px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/60 transition-all cursor-pointer',
                                            'appearance-none bg-no-repeat bg-[url("data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20fill%3D%27none%27%20viewBox%3D%270%200%2020%2020%27%3E%3Cpath%20stroke%3D%27%2300D4FF%27%20stroke-linecap%3D%27round%27%20stroke-linejoin%3D%27round%27%20stroke-width%3D%271.5%27%20d%3D%27M6%208l4%204%204-4%27%2F%3E%3C%2Fsvg%3E")] bg-[right_0.5rem_center] bg-[length:1.5em_1.5em]'
                                        )}
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        required
                                    >
                                        <option value="Food">Food</option>
                                        <option value="Transport">Transport</option>
                                        <option value="Utilities">Utilities</option>
                                        <option value="Entertainment">Entertainment</option>
                                        <option value="Housing">Housing</option>
                                        <option value="Healthcare">Healthcare</option>
                                        <option value="Health">Health</option>
                                        <option value="Education">Education</option>
                                        <option value="Shopping">Shopping</option>
                                        <option value="Personal">Personal</option>
                                        <option value="Electronics">Electronics</option>
                                        <option value="Clothing">Clothing</option>
                                        <option value="Stationery">Stationery</option>
                                        <option value="Services">Services</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>

                            {/* Row 2: Description (RESTORED) */}
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                                    <FileText className="h-3 w-3" /> DESCRIPTION
                                </label>
                                <Input
                                    placeholder="Brief description..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="bg-black/40 border-primary/20 focus:border-primary/60 focus:ring-primary/20 transition-all font-mono text-sm"
                                />
                            </div>

                            {/* Row 3: Amount + Quick Chips */}
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                                    <IndianRupee className="h-3 w-3 text-green-400" /> AMOUNT
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-green-400 font-bold">₹</span>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                        required
                                        className="pl-7 text-lg font-bold bg-black/40 border-primary/20 focus:border-primary/60 focus:ring-primary/20 transition-all text-green-400 placeholder:text-green-400/30 font-mono tracking-wider"
                                    />
                                </div>

                                {/* Quick Chips */}
                                <div className="flex flex-wrap gap-2 pt-1">
                                    {QUICK_AMOUNTS.map(amt => (
                                        <button
                                            key={amt}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, amount: amt })}
                                            className="px-3 py-1 text-xs font-mono rounded bg-primary/10 border border-primary/20 text-primary hover:bg-primary/30 hover:border-primary/50 transition-all hover:scale-105 active:scale-95"
                                        >
                                            ₹{amt}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end gap-3 border-t border-white/5 mt-6">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={onClose}
                                    disabled={isSubmitting}
                                    className="hover:bg-red-500/10 hover:text-red-400 transition-colors"
                                >
                                    CANCEL
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSubmitting || isSuccess}
                                    className={cn(
                                        "min-w-[140px] font-bold shadow-[0_0_20px_rgba(0,212,255,0.4)] transition-all",
                                        isSuccess ? "bg-emerald-500 hover:bg-emerald-600 text-white" : "bg-primary hover:bg-primary/80 text-black hover:scale-105 active:scale-95"
                                    )}
                                >
                                    {isSubmitting ? (
                                        <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> PROCESSING</span>
                                    ) : isSuccess ? (
                                        <span className="flex items-center gap-2"><Check className="h-4 w-4" /> SUBMITTED</span>
                                    ) : (
                                        "CONFIRM ENTRY"
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
