import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import * as XLSX from 'xlsx';
import { parse, isValid, format } from 'date-fns';
import type { Expense } from '../types';
import { generateId } from '../lib/utils';
import { Button } from './ui/Button';
import { Upload, Download, Loader2, Trash2, AlertTriangle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';


// Helper to get value case-insensitively and ignoring whitespace
// Helper to get value case-insensitively and ignoring whitespace
const getValue = (item: Record<string, unknown>, target: string) => {
    const keys = Object.keys(item);
    const found = keys.find(k => k.trim().toLowerCase() === target.toLowerCase());
    return found ? item[found] : undefined;
};

interface FileOperationsProps {
    expenses: Expense[];
    onImport: (data: Expense[], onProgress?: (percent: number) => void) => Promise<void>;
    onClear: () => void;
}

export const FileOperations: React.FC<FileOperationsProps> = ({ expenses, onImport, onClear }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [importProgress, setImportProgress] = useState(0);
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [previewData, setPreviewData] = useState<Expense[] | null>(null);

    // ----------------------------------------------------------------------
    // Exports
    // ----------------------------------------------------------------------

    // ----------------------------------------------------------------------
    // Exports
    // ----------------------------------------------------------------------

    const handleExport = () => {
        const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' " +
            "xmlns:w='urn:schemas-microsoft-com:office:word' " +
            "xmlns='http://www.w3.org/TR/REC-html40'>" +
            "<head><meta charset='utf-8'><title>Expense Report</title>" +
            "<style>" +
            "body { font-family: 'Arial', sans-serif; }" +
            "table { border-collapse: collapse; width: 100%; }" +
            "th, td { border: 1px solid #000; padding: 8px; text-align: left; }" +
            "th { background-color: #00d4ff; color: #000; }" +
            "h1 { color: #333; }" +
            "</style></head><body>";

        const footer = "</body></html>";

        const title = `<h1>Expense Report</h1><p>Generated on: ${new Date().toLocaleDateString()}</p>`;

        let tableHtml = "<table><thead><tr><th>Date</th><th>Description</th><th>Category</th><th>Amount</th></tr></thead><tbody>";

        expenses.forEach(expense => {
            tableHtml += `<tr>
                <td>${new Date(expense.date).toLocaleDateString()}</td>
                <td>${expense.description}</td>
                <td>${expense.category}</td>
                <td>Rs. ${expense.amount.toFixed(2)}</td>
            </tr>`;
        });

        tableHtml += "</tbody></table>";

        const sourceHTML = header + title + tableHtml + footer;

        const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
        const fileDownload = document.createElement("a");
        document.body.appendChild(fileDownload);
        fileDownload.href = source;
        fileDownload.download = `expense_report_${new Date().toISOString().split('T')[0]}.doc`;
        fileDownload.click();
        document.body.removeChild(fileDownload);
    };

    // ----------------------------------------------------------------------
    // Parsers
    // ----------------------------------------------------------------------

    const processFile = async (file: File) => {
        setIsProcessing(true);
        try {
            const extension = file.name.split('.').pop()?.toLowerCase();
            let importedData: Expense[] = [];

            if (extension === 'xlsx' || extension === 'xls') {
                const arrayBuffer = await file.arrayBuffer();
                const workbook = XLSX.read(arrayBuffer, { cellDates: true });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet);
                console.log('Raw Excel Data (First 5):', jsonData.slice(0, 5));

                importedData = jsonData.map((item: unknown) => {
                    const record = item as Record<string, unknown>;
                    const dateVal = getValue(record, 'date');
                    let finalDate = new Date().toISOString();

                    if (dateVal instanceof Date) {
                        // Fix for future dates (prevent 2026 if current year is 2025)
                        if (dateVal.getFullYear() > new Date().getFullYear()) {
                            dateVal.setFullYear(new Date().getFullYear());
                        }
                        finalDate = dateVal.toISOString();
                    } else if (typeof dateVal === 'string') {
                        const cleanDate = dateVal.trim();
                        // Try specific formats relevant to the user (DD/MM/YYYY)
                        const formats = [
                            'dd/MM/yyyy', 'dd-MM-yyyy', 'dd.MM.yyyy',
                            'dd/MM/yy', 'dd-MM-yy', 'dd.MM.yy',
                            'yyyy-MM-dd',
                            'dd MMMM yyyy', 'd MMMM yyyy',
                            'dd MMM yyyy', 'd MMM yyyy',
                            'dd-MMM-yy', 'd-MMM-yy', 'dd/MMM/yy', 'd/MMM/yy',
                            'dd.MMM.yy', 'd.MMM.yy'
                        ];
                        let parsedDate: Date | null = null;

                        const currentYear = new Date().getFullYear();

                        for (const fmt of formats) {
                            // date-fns parsing is case-sensitive for some tokens, but usually okay for numbers
                            // For months like 'may', we might need to title case it if strict
                            const p = parse(cleanDate, fmt, new Date());
                            if (isValid(p)) {
                                parsedDate = p;
                                // Fix for 2-digit years being parsed as 00XX by certain patterns if not using 'yy' correctly
                                // 'dd.MM.yyyy' matching '11.05.25' results in year 0025. 
                                if (parsedDate.getFullYear() < 100) {
                                    parsedDate.setFullYear(parsedDate.getFullYear() + 2000);
                                }

                                // Fix for future dates (e.g. 2026 when it should be 2025)
                                // If the parsed date is in a future year, assume it implies the current year
                                if (parsedDate.getFullYear() > currentYear) {
                                    parsedDate.setFullYear(currentYear);
                                }
                                break;
                            }
                        }

                        if (parsedDate) {
                            finalDate = parsedDate.toISOString();
                        } else {
                            // Last resort fallback
                            const standard = new Date(cleanDate);
                            if (isValid(standard)) {
                                if (standard.getFullYear() > currentYear) {
                                    standard.setFullYear(currentYear);
                                }
                                finalDate = standard.toISOString();
                            }
                        }
                    }

                    const descVal = getValue(record, 'description');
                    const catVal = getValue(record, 'category');
                    const amountRaw = getValue(record, 'amount');

                    // Parse Amount: Remove currency symbols (₹, $, Rs, etc) and commas
                    let amountVal = 0;
                    if (typeof amountRaw === 'number') {
                        amountVal = amountRaw;
                    } else if (typeof amountRaw === 'string') {
                        const cleanAmount = amountRaw.replace(/[^0-9.-]+/g, ""); // Keep only digits, dots, minus
                        amountVal = parseFloat(cleanAmount);
                    }

                    const description = (typeof descVal === 'string' && descVal)
                        ? descVal
                        : (typeof catVal === 'string' && catVal ? catVal : 'Excel Import');

                    const category = (typeof catVal === 'string' && catVal) ? catVal : 'General';

                    return {
                        id: generateId(),
                        date: finalDate,
                        description,
                        category,
                        amount: isNaN(amountVal) ? 0 : amountVal
                    };
                }).filter((e: Expense) => e.amount > 0);

                // Sort by date (descending) to avoid random jumping in preview
                importedData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            } else {
                alert('Only Excel files (.xlsx, .xls) are supported.');
                return;
            }

            const validated = importedData.map(e => ({
                ...e,
                id: e.id || generateId(),
                date: e.date,
                amount: e.amount
            }));

            // Simulate complex extraction/processing time (decreased delay for better UX)
            await new Promise(resolve => setTimeout(resolve, 500));

            if (validated.length > 0) {
                setPreviewData(validated);
            } else {
                alert("No valid expense entries found in file.");
            }

        } catch (error) {
            console.error(error);
            alert('Error processing file. Please ensure it follows a standard Date | Description | Amount format.');
        } finally {
            setIsProcessing(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <>
            <div className="flex items-center gap-2">
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".xlsx, .xls"
                    onChange={(e) => {
                        if (e.target.files?.[0]) processFile(e.target.files[0]);
                    }}
                />

                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing}
                    className="border-primary/50 text-primary hover:bg-primary/20 hover:text-white transition-all shadow-[0_0_10px_rgba(0,212,255,0.2)]"
                >
                    {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="sm:mr-2 h-4 w-4" />}
                    <span className="hidden sm:inline">Import Data</span>
                </Button>

                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExport}
                    disabled={expenses.length === 0}
                    className="border-secondary/50 text-secondary hover:bg-secondary/20 hover:text-white transition-all shadow-[0_0_10px_rgba(255,0,85,0.2)]"
                >
                    <Download className="sm:mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Export Word</span>
                </Button>

                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowClearConfirm(true)}
                    disabled={expenses.length === 0}
                    className="border-red-500/50 text-red-500 hover:bg-red-500/20 hover:text-white transition-all shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                >
                    <Trash2 className="sm:mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Clear All</span>
                </Button>
            </div>

            {/* Review Import Modal */}
            {previewData && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 p-4">
                    <Card className="w-full max-w-2xl max-h-[85vh] overflow-y-auto border-primary/50 bg-black/95 shadow-[0_0_30px_rgba(0,212,255,0.3)] animate-in zoom-in-95 duration-200">
                        <CardHeader className="pb-2 border-b border-white/10">
                            <CardTitle className="text-primary flex items-center gap-2 text-xl">
                                <Upload className="h-6 w-6" />
                                IMPORT PREVIEW
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-4">

                            {/* Stats Grid */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="p-3 rounded bg-primary/10 border border-primary/20">
                                    <p className="text-xs text-muted-foreground uppercase">Total Entries</p>
                                    <p className="text-2xl font-bold text-white">{previewData.length}</p>
                                </div>
                                <div className="p-3 rounded bg-primary/10 border border-primary/20">
                                    <p className="text-xs text-muted-foreground uppercase">Date Range</p>
                                    <p className="text-sm font-bold text-white truncate">
                                        {format(new Date(Math.min(...previewData.map(e => new Date(e.date).getTime()))), 'dd MMM yyyy')} -
                                        {format(new Date(Math.max(...previewData.map(e => new Date(e.date).getTime()))), 'dd MMM yyyy')}
                                    </p>
                                </div>
                                <div className="p-3 rounded bg-primary/10 border border-primary/20">
                                    <p className="text-xs text-muted-foreground uppercase">Total Value</p>
                                    <p className="text-2xl font-bold text-emerald-400">
                                        ₹{previewData.reduce((sum, e) => sum + e.amount, 0).toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            {/* Preview Table */}
                            <div className="border border-white/10 rounded-md overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-white/5 text-muted-foreground font-mono text-xs uppercase">
                                        <tr>
                                            <th className="p-2">Date</th>
                                            <th className="p-2">Category</th>
                                            <th className="p-2">Description</th>
                                            <th className="p-2 text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {previewData.slice(0, 5).map(e => (
                                            <tr key={e.id} className="hover:bg-white/5 transition-colors">
                                                <td className="p-2 font-mono text-xs">{format(new Date(e.date), 'dd MMM yyyy')}</td>
                                                <td className="p-2">
                                                    <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] border border-primary/30">
                                                        {e.category}
                                                    </span>
                                                </td>
                                                <td className="p-2 text-gray-300">{e.description}</td>
                                                <td className="p-2 text-right font-mono text-emerald-400">₹{e.amount}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <div className="p-2 bg-white/5 text-center text-xs text-muted-foreground">
                                    ...and {previewData.length - 5} more entries
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <Button
                                    variant="ghost"
                                    onClick={() => setPreviewData(null)}
                                    className="hover:bg-white/10"
                                >
                                    CANCEL
                                </Button>
                                <Button
                                    onClick={async () => {
                                        setIsImporting(true);
                                        setImportProgress(0);
                                        try {
                                            await onImport(previewData, (p) => setImportProgress(p));
                                            setPreviewData(null);
                                            // alert(`Successfully imported ${previewData.length} records!`); // Removed to avoid blocking UI during/after animation
                                        } catch (e) {
                                            console.error(e);
                                            alert("Import failed partially or completely.");
                                        } finally {
                                            setIsImporting(false);
                                            setImportProgress(0);
                                        }
                                    }}
                                    disabled={isImporting}
                                    className="bg-primary hover:bg-primary/80 text-black shadow-[0_0_15px_rgba(0,212,255,0.4)] font-bold min-w-[150px]"
                                >
                                    {isImporting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            IMPORTING... {importProgress}%
                                        </>
                                    ) : (
                                        "CONFIRM IMPORT"
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>,
                document.body
            )}

            {/* Custom Cyberpunk Confirmation Modal */}
            {showClearConfirm && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <Card className="w-full max-w-sm border-red-500/50 bg-black/95 shadow-[0_0_30px_rgba(239,68,68,0.3)] animate-in zoom-in-95 duration-200">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-red-500 flex items-center gap-2 text-xl">
                                <AlertTriangle className="h-6 w-6" />
                                CONFIRM DELETE
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-gray-300">
                                Are you sure you want to delete <span className="text-red-400 font-bold">ALL</span> expenses?
                                <br />
                                <span className="text-xs text-muted-foreground mt-2 block">This action cannot be undone and local data will be wiped.</span>
                            </p>
                            <div className="flex justify-end gap-3 pt-4">
                                <Button
                                    variant="ghost"
                                    onClick={() => setShowClearConfirm(false)}
                                    className="hover:bg-white/10"
                                >
                                    CANCEL
                                </Button>
                                <Button
                                    onClick={() => {
                                        onClear();
                                        setShowClearConfirm(false);
                                    }}
                                    className="bg-red-600 hover:bg-red-700 text-white shadow-[0_0_15px_rgba(220,38,38,0.5)] border border-red-500"
                                >
                                    YES, DELETE EVERYTHING
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>,
                document.body
            )}
        </>
    );
};
