/**
 * AdminPanel.tsx
 * Secure Administration Console for ExpenseTrack
 * Handles User Management, System Monitoring, and Audit Logs
 * Enforced Cyberpunk Dark Theme
 */
import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { ShieldAlert, Users, Activity, Clock, Loader2, Trash2, DollarSign, Eye, X, CreditCard, Hash, Lock } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '../lib/utils';
import { Button } from './ui/Button';

interface UserData {
    username: string;
    email: string;
    password: string;
    totalVolume: number;
    totalEntries: number;
}

interface LogEntry {
    timestamp: string;
    username: string;
    ip: string;
    status: 'SUCCESS' | 'FAILED' | 'PENDING';
}

export const AdminPanel: React.FC = () => {
    const [users, setUsers] = useState<UserData[]>([]);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null);

    const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? `http://${window.location.hostname}:3001/api`
        : '/api';

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [usersRes, logsRes] = await Promise.all([
                    fetch(`${API_URL}/admin/users`),
                    fetch(`${API_URL}/admin/logs`)
                ]);

                if (usersRes.ok) setUsers(await usersRes.json());
                if (logsRes.ok) setLogs(await logsRes.json());
            } catch (error) {
                console.error("Failed to fetch admin data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);
    }, [API_URL]);

    const handleDeleteUser = async (username: string) => {
        if (!window.confirm(`Are you sure you want to delete user "${username}"? This cannot be undone.`)) return;

        try {
            const res = await fetch(`${API_URL}/admin/users/${username}`, { method: 'DELETE' });
            if (res.ok) {
                setUsers(prev => prev.filter(u => u.username !== username));
                if (selectedUser?.username === username) setSelectedUser(null);
            } else {
                alert("Failed to delete user");
            }
        } catch (e) {
            console.error(e);
            alert("Error deleting user");
        }
    };

    const systemTotalVolume = users.reduce((acc, u) => acc + (u.totalVolume || 0), 0);
    const systemTotalEntries = users.reduce((acc, u) => acc + (u.totalEntries || 0), 0);

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight text-red-500 text-glow-pink flex items-center gap-2">
                    <ShieldAlert className="h-6 w-6" />
                    ADMIN_CONSOLE
                </h2>
                <div className="text-xs font-mono text-muted-foreground animate-pulse">
                    SYSTEM_MONITORING_ACTIVE
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="glass-card border-primary/20 bg-primary/5">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{users.length}</div>
                    </CardContent>
                </Card>
                <Card className="glass-card border-indigo-500/20 bg-indigo-500/5">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase">System Volume</CardTitle>
                        <DollarSign className="h-4 w-4 text-indigo-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white whitespace-nowrap">{formatCurrency(systemTotalVolume)}</div>
                        <p className="text-xs text-muted-foreground">{systemTotalEntries} records tracked</p>
                    </CardContent>
                </Card>
                <Card className="glass-card border-secondary/20 bg-secondary/5">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Login Attempts</CardTitle>
                        <Activity className="h-4 w-4 text-secondary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{logs.length}</div>
                    </CardContent>
                </Card>
                <Card className="glass-card border-emerald-500/20 bg-emerald-500/5">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Last Activity</CardTitle>
                        <Clock className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm font-bold text-white truncate">
                            {logs.length > 0 ? format(new Date(logs[0].timestamp), 'HH:mm:ss dd/MM') : 'N/A'}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-[2fr_1fr]">
                {/* User List */}
                <Card className="glass-card">
                    <CardHeader>
                        <CardTitle className="text-lg text-primary">REGISTERED USERS</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="max-h-[400px] overflow-auto pr-2 custom-scrollbar">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-muted-foreground uppercase bg-white/5 sticky top-0">
                                    <tr>
                                        <th className="p-2">User</th>
                                        <th className="p-2">Email</th>
                                        <th className="p-2 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 text-gray-300 font-mono">
                                    {users.map((u) => (
                                        <tr key={u.username} className="hover:bg-white/5 transition-colors">
                                            <td className="p-2 font-bold text-white">
                                                {u.username}
                                                <div className="text-[10px] text-muted-foreground font-sans tracking-tight md:hidden">{u.email}</div>
                                            </td>
                                            <td className="p-2 opacity-80 hidden md:table-cell">{u.email}</td>
                                            <td className="p-2 text-right flex justify-end gap-2">
                                                <button
                                                    onClick={() => setSelectedUser(u)}
                                                    className="p-1.5 hover:bg-primary/20 text-primary rounded transition-colors"
                                                    title="View Analysis"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                                {u.username !== 'Admin' && (
                                                    <button
                                                        onClick={() => handleDeleteUser(u.username)}
                                                        className="p-1.5 hover:bg-red-500/20 text-red-500 rounded transition-colors"
                                                        title="Delete User"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Login Logs */}
                <Card className="glass-card">
                    <CardHeader>
                        <CardTitle className="text-lg text-secondary">LOGIN AUDIT LOG</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="max-h-[400px] overflow-auto pr-2 custom-scrollbar">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-muted-foreground uppercase bg-white/5 sticky top-0">
                                    <tr>
                                        <th className="p-2">Time</th>
                                        <th className="p-2">User</th>
                                        <th className="p-2">Status</th>

                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 text-gray-300 font-mono text-xs">
                                    {logs.map((log, idx) => (
                                        <tr key={idx} className="hover:bg-white/5 transition-colors">
                                            <td className="p-2 whitespace-nowrap">
                                                {format(new Date(log.timestamp), 'dd/MM HH:mm')}
                                            </td>
                                            <td className="p-2 font-bold text-primary">{log.username}</td>
                                            <td className="p-2">
                                                <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase border ${log.status === 'SUCCESS'
                                                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                                                    : 'bg-red-500/10 text-red-500 border-red-500/30'
                                                    }`}>
                                                    {log.status}
                                                </span>
                                            </td>

                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* User Analysis Modal */}
            {selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="w-full max-w-md p-4 animate-in zoom-in-95 duration-300">
                        <Card className="relative border-primary/30 bg-black/90 shadow-[0_0_50px_rgba(0,212,255,0.15)]">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute right-4 top-4 hover:bg-primary/20 hover:text-primary transition-colors text-muted-foreground"
                                onClick={() => setSelectedUser(null)}
                            >
                                <X className="h-5 w-5" />
                            </Button>

                            <CardHeader className="border-b border-white/10 pb-4">
                                <CardTitle className="text-xl font-bold text-glow flex items-center gap-2">
                                    <Users className="h-5 w-5 text-primary" />
                                    <span className="text-white">OPERATIVE_</span>
                                    <span className="text-primary">{selectedUser.username.toUpperCase()}</span>
                                </CardTitle>
                                <p className="text-xs text-muted-foreground font-mono">FINANCIAL USAGE ANALYSIS</p>
                            </CardHeader>

                            <CardContent className="pt-6 space-y-6">
                                {/* Details Grid */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                            <CreditCard className="h-3.5 w-3.5" /> Total Volume
                                        </div>
                                        <div className="text-xl font-bold text-emerald-400">
                                            {formatCurrency(selectedUser.totalVolume)}
                                        </div>
                                    </div>
                                    <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                            <Hash className="h-3.5 w-3.5" /> Total Entries
                                        </div>
                                        <div className="text-xl font-bold text-white">
                                            {selectedUser.totalEntries}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs text-muted-foreground uppercase font-semibold">Contact & Security</label>
                                        <div className="mt-2 p-3 rounded-md bg-black border border-white/10 space-y-2 font-mono text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-zinc-500">EMAIL:</span>
                                                <span className="text-zinc-300">{selectedUser.email}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-zinc-500">PASSWORD:</span>
                                                <span className="text-red-400 flex items-center gap-1"><Lock className="h-3 w-3" /> {selectedUser.password}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs text-muted-foreground uppercase font-semibold">Activity Score</label>
                                        <div className="mt-2 h-2 w-full bg-white/10 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary shadow-[0_0_10px_rgba(0,212,255,0.8)]"
                                                style={{ width: `${Math.min(100, (selectedUser.totalEntries / 50) * 100)}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-between mt-1">
                                            <span className="text-[10px] text-muted-foreground">LOW</span>
                                            <span className="text-[10px] text-primary font-bold">
                                                {selectedUser.totalEntries > 50 ? 'POWER USER' : 'STANDARD'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
};


