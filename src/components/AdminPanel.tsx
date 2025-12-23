import { useEffect, useState } from 'react';
import { Users, Loader2, Trash2, DollarSign, Eye, X, Lock, Terminal, Cpu, Database } from 'lucide-react';
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
        const interval = setInterval(fetchData, 5000); // Faster polling for monitoring feel
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
            <div className="flex h-64 items-center justify-center font-mono text-emerald-500">
                <Loader2 className="h-8 w-8 animate-spin mr-2" />
                INITIALIZING_SYSTEM_CORE...
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500 font-mono text-xs md:text-sm">

            {/* Header / Status Bar */}
            <div className="border-b border-white/20 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-widest text-red-500 flex items-center gap-3 uppercase">
                        <Terminal className="h-6 w-6" />
                        System_Overseer_V9
                    </h2>
                    <p className="text-zinc-500 mt-1">ROOT_ACCESS_GRANTED // MONITORING_ACTIVE</p>
                </div>
                <div className="flex items-center gap-4 text-[10px] md:text-xs">
                    <div className="flex items-center gap-2 px-3 py-1 rounded bg-black border border-emerald-500/30 text-emerald-500">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        SYSTEM_ONLINE
                    </div>
                </div>
            </div>

            {/* Metrics Grid - Raw Data Look */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Panel 1 */}
                <div className="bg-black/80 border border-white/10 p-4 relative group hover:border-red-500/50 transition-colors">
                    <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/30 group-hover:border-red-500"></div>
                    <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/30 group-hover:border-red-500"></div>

                    <div className="flex items-center justify-between mb-2 text-zinc-500">
                        <span className="uppercase tracking-wider">Total_Users</span>
                        <Users className="h-4 w-4" />
                    </div>
                    <div className="text-2xl font-bold text-white group-hover:text-red-400 transition-colors">{users.length}</div>
                </div>

                {/* Panel 2 */}
                <div className="bg-black/80 border border-white/10 p-4 relative group hover:border-emerald-500/50 transition-colors">
                    <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/30 group-hover:border-emerald-500"></div>
                    <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/30 group-hover:border-emerald-500"></div>

                    <div className="flex items-center justify-between mb-2 text-zinc-500">
                        <span className="uppercase tracking-wider">Sys_Volume</span>
                        <DollarSign className="h-4 w-4" />
                    </div>
                    <div className="text-2xl font-bold text-white group-hover:text-emerald-400 transition-colors">
                        {formatCurrency(systemTotalVolume)}
                    </div>
                </div>

                {/* Panel 3 */}
                <div className="bg-black/80 border border-white/10 p-4 relative group hover:border-indigo-500/50 transition-colors">
                    <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/30 group-hover:border-indigo-500"></div>
                    <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/30 group-hover:border-indigo-500"></div>

                    <div className="flex items-center justify-between mb-2 text-zinc-500">
                        <span className="uppercase tracking-wider">Entries</span>
                        <Database className="h-4 w-4" />
                    </div>
                    <div className="text-2xl font-bold text-white group-hover:text-indigo-400 transition-colors">{systemTotalEntries}</div>
                </div>

                {/* Panel 4 */}
                <div className="bg-black/80 border border-white/10 p-4 relative group hover:border-amber-500/50 transition-colors">
                    <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/30 group-hover:border-amber-500"></div>
                    <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/30 group-hover:border-amber-500"></div>

                    <div className="flex items-center justify-between mb-2 text-zinc-500">
                        <span className="uppercase tracking-wider">Sys_Load</span>
                        <Cpu className="h-4 w-4" />
                    </div>
                    <div className="text-2xl font-bold text-white group-hover:text-amber-400 transition-colors">
                        {Math.floor(Math.random() * 20) + 10}%
                    </div>
                </div>
            </div>

            {/* Main Data Grid */}
            <div className="grid lg:grid-cols-[2fr_1fr] gap-6">

                {/* Users Table */}
                <div className="bg-black/90 border border-white/10 flex flex-col h-[500px]">
                    <div className="p-3 border-b border-white/10 bg-white/5 flex items-center justify-between">
                        <h3 className="font-bold text-zinc-300 flex items-center gap-2">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                            ACTIVE_USER_REGISTRY
                        </h3>
                        <span className="text-[10px] text-zinc-600">ID: REG-001</span>
                    </div>
                    <div className="flex-1 overflow-auto custom-scrollbar p-0">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-black sticky top-0 z-10">
                                <tr className="text-[10px] uppercase text-zinc-500 border-b border-white/10">
                                    <th className="p-3 font-normal">Identity</th>
                                    <th className="p-3 font-normal hidden sm:table-cell">Contact_Link</th>
                                    <th className="p-3 font-normal text-right">Volume</th>
                                    <th className="p-3 font-normal text-right">Controls</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-zinc-300 text-xs">
                                {users.map(u => (
                                    <tr key={u.username} className="hover:bg-white/5 transition-colors group">
                                        <td className="p-3 font-bold text-white group-hover:text-emerald-400">
                                            {u.username}
                                            {u.username === 'Admin' && <span className="ml-2 text-[8px] bg-red-900/50 text-red-500 px-1 rounded border border-red-500/20">ROOT</span>}
                                        </td>
                                        <td className="p-3 text-zinc-500 hidden sm:table-cell font-mono">{u.email}</td>
                                        <td className="p-3 text-right font-mono">{formatCurrency(u.totalVolume)}</td>
                                        <td className="p-3 text-right">
                                            <div className="flex justify-end gap-1">
                                                <button onClick={() => setSelectedUser(u)} className="p-1 hover:text-cyan-400 transition-colors border border-transparent hover:border-cyan-400/30 rounded">
                                                    <Eye className="h-3 w-3" />
                                                </button>
                                                {u.username !== 'Admin' && (
                                                    <button onClick={() => handleDeleteUser(u.username)} className="p-1 hover:text-red-500 transition-colors border border-transparent hover:border-red-500/30 rounded">
                                                        <Trash2 className="h-3 w-3" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Audit Log - Terminal Style */}
                <div className="bg-black/90 border border-white/10 flex flex-col h-[500px]">
                    <div className="p-3 border-b border-white/10 bg-white/5 flex items-center justify-between">
                        <h3 className="font-bold text-zinc-300 flex items-center gap-2">
                            <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                            LIVE_SECURITY_FEED
                        </h3>
                        <span className="text-[10px] text-zinc-600">PORT: 8080</span>
                    </div>
                    <div className="flex-1 overflow-auto custom-scrollbar p-2 font-mono text-xs space-y-1">
                        {logs.map((log, idx) => (
                            <div key={idx} className="flex gap-2 p-1 hover:bg-white/5">
                                <span className="text-zinc-600 shrink-0">[{format(new Date(log.timestamp), 'HH:mm:ss')}]</span>
                                <span className="text-zinc-400 shrink-0">{log.ip === '::1' ? 'LOCALHOST' : 'REMOTE_IP'}</span>
                                <span className="text-zinc-500">::</span>
                                <span className={log.status === 'SUCCESS' ? 'text-emerald-500' : 'text-red-500'}>
                                    AUTH_{log.status}
                                </span>
                                <span className="text-zinc-300">@{log.username}</span>
                            </div>
                        ))}
                    </div>
                </div>

            </div>

            {/* Raw Data Modal */}
            {selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="w-full max-w-lg bg-black border border-white/20 shadow-[0_0_100px_rgba(0,0,0,1)]">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Terminal className="h-5 w-5 text-emerald-500" />
                                TARGET_ANALYSIS: {selectedUser.username.toUpperCase()}
                            </h3>
                            <button onClick={() => setSelectedUser(null)} className="text-zinc-500 hover:text-white">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 grid grid-cols-2 gap-6">
                            <div className="space-y-4 col-span-2 sm:col-span-1">
                                <div>
                                    <label className="text-[10px] text-zinc-500 uppercase">System ID</label>
                                    <div className="font-mono text-emerald-500">USR-{Math.floor(Math.random() * 9000) + 1000}</div>
                                </div>
                                <div>
                                    <label className="text-[10px] text-zinc-500 uppercase">Contact Node</label>
                                    <div className="font-mono text-white">{selectedUser.email}</div>
                                </div>
                                <div>
                                    <label className="text-[10px] text-zinc-500 uppercase">Security Key</label>
                                    <div className="font-mono text-white flex items-center gap-2">
                                        <Lock className="h-3 w-3 text-red-500" />
                                        {selectedUser.password}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 col-span-2 sm:col-span-1 border-l border-white/10 pl-6">
                                <div>
                                    <label className="text-[10px] text-zinc-500 uppercase">Total Throughput</label>
                                    <div className="font-mono text-xl text-white">{formatCurrency(selectedUser.totalVolume)}</div>
                                </div>
                                <div>
                                    <label className="text-[10px] text-zinc-500 uppercase">Data Points</label>
                                    <div className="font-mono text-white">{selectedUser.totalEntries} records</div>
                                </div>
                                <div>
                                    <label className="text-[10px] text-zinc-500 uppercase">Status</label>
                                    <div className="inline-block px-2 py-0.5 mt-1 bg-emerald-900/30 text-emerald-500 text-[10px] border border-emerald-500/20">
                                        ACTIVE
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Footer */}
                        <div className="p-4 border-t border-white/10 flex justify-end gap-2 bg-black">
                            <Button
                                variant="outline"
                                onClick={() => setSelectedUser(null)}
                                className="border-white/20 text-white hover:bg-white/10 text-xs h-8"
                            >
                                CLOSE_PANEL
                            </Button>
                            {selectedUser.username !== 'Admin' && (
                                <Button
                                    variant="ghost"
                                    onClick={() => handleDeleteUser(selectedUser.username)}
                                    className="bg-red-900/20 text-red-500 border border-red-900/50 hover:bg-red-900/40 text-xs h-8"
                                >
                                    TERMINATE_USER
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


