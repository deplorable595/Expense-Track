import { useState, useEffect, useMemo } from 'react';
import { useExpenses } from './hooks/useExpenses';
import { SummaryCards } from './components/SummaryCards';
import { ExpenseCharts } from './components/ExpenseCharts';
import { TransactionList } from './components/TransactionList';
import { FileOperations } from './components/FileOperations';
import { AddExpenseModal } from './components/AddExpenseModal';
import { Button } from './components/ui/Button';
import { CyberpunkLoader } from './components/CyberpunkLoader';
import { Login } from './components/Login';
import { Plus, WalletCards, LogOut, User, Wifi, ChevronDown, Monitor, ShieldAlert } from 'lucide-react';
import { CyberpunkBackground } from './components/CyberpunkBackground';
import { startOfMonth, endOfMonth, subMonths, addMonths, isWithinInterval } from 'date-fns';
import { AdminPanel } from './components/AdminPanel';

interface DashboardProps {
  user: string;
  onLogout: () => void;
}

function Dashboard({ user, onLogout }: DashboardProps) {
  const {
    expenses,
    addExpense,
    deleteExpense,
    importExpenses,
    clearExpenses,
    sortConfig,
    toggleSort
  } = useExpenses(user);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Admin Check
  const isAdmin = user === 'Admin';
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  // Lifted state for date navigation
  const [viewDate, setViewDate] = useState(new Date());

  const handlePrevMonth = () => setViewDate(prev => subMonths(prev, 1));
  const handleNextMonth = () => setViewDate(prev => addMonths(prev, 1));
  const handleReset = () => setViewDate(new Date());

  /* Simulate loading for demo purposes, or use real data usage */
  const [isLoading, setIsLoading] = useState(true);

  // Filter expenses for the current view month for the Transaction List
  const viewMonthExpenses = useMemo(() => {
    const start = startOfMonth(viewDate);
    const end = endOfMonth(viewDate);
    return expenses.filter(e => {
      const d = new Date(e.date);
      return isWithinInterval(d, { start, end });
    });
  }, [expenses, viewDate]);

  useEffect(() => {
    // Simulating initial load
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <CyberpunkLoader onComplete={() => setIsLoading(false)} />;
  }


  return (
    <>
      <CyberpunkBackground />
      <div className="min-h-screen font-sans text-foreground transition-colors duration-500 bg-transparent">

        {/* Header */}
        <header className="sticky top-0 z-40 w-full border-b backdrop-blur-md transition-colors duration-500 border-white/10 bg-black/80">
          <div className="container mx-auto flex h-16 items-center justify-between px-4">

            {/* Left Side: Logo */}
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded bg-primary text-black shadow-[0_0_15px_rgba(0,212,255,0.6)] animate-pulse-slow">
                <WalletCards className="h-5 w-5" />
              </div>
              <h1 className="hidden md:block text-2xl font-bold tracking-tight text-glow font-heading">
                EXPENSE<span className="text-secondary text-glow-pink">TRACK</span>_V1.0
              </h1>
            </div>

            {/* Right Side: Actions */}
            <div className="flex items-center gap-2 sm:gap-4 relative">

              {/* Only show file ops if NOT in admin panel */}
              {!showAdminPanel && (
                <FileOperations
                  expenses={expenses}
                  onImport={importExpenses}
                  onClear={clearExpenses}
                />
              )}

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 ${isAdmin ? 'border-red-500/50 bg-red-950/30 hover:bg-red-900/40' : 'border-primary/30 bg-black/40 hover:bg-primary/10'}`}
                >
                  <div className={`flex h-6 w-6 items-center justify-center rounded-full ${isAdmin ? 'bg-red-500/20 text-red-500' : 'bg-primary/20 text-primary'}`}>
                    <User className="h-3.5 w-3.5" />
                  </div>
                  <span className={`hidden sm:block font-mono uppercase text-xs tracking-wider ${isAdmin ? 'text-red-400' : 'text-primary'}`}>{user}</span>
                  <ChevronDown className={`h-3 w-3 text-muted-foreground transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {isMenuOpen && (
                  <>
                    {/* Overlay to close on click outside */}
                    <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)} />

                    <div className="absolute right-0 top-full mt-2 w-64 rounded-md border backdrop-blur-xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200 border-white/10 bg-black/95 shadow-[0_0_30px_rgba(0,0,0,0.8)]">

                      {/* Header / Info */}
                      <div className="p-4 border-b border-white/5 bg-white/5">
                        <p className="text-xs text-muted-foreground font-mono mb-1">LOGGED IN AS</p>
                        <p className={`text-sm font-bold uppercase tracking-wider ${isAdmin ? 'text-red-500' : 'text-white'}`}>{user}</p>
                      </div>

                      {isAdmin && (
                        <div className="p-2 border-b border-white/5">
                          <button
                            onClick={() => {
                              setShowAdminPanel(!showAdminPanel);
                              setIsMenuOpen(false);
                            }}
                            className="w-full flex items-center gap-2 px-2 py-2 text-xs font-bold text-red-400 hover:text-white hover:bg-red-500/20 rounded transition-colors"
                          >
                            <ShieldAlert className="h-3.5 w-3.5" />
                            {showAdminPanel ? 'EXIT ADMIN CONSOLE' : 'ACCESS ADMIN CONSOLE'}
                          </button>
                        </div>
                      )}

                      {/* Status Section */}
                      <div className="p-3 border-b border-white/5">
                        <p className="text-[10px] text-muted-foreground mb-2 font-mono uppercase tracking-widest">Network Status</p>
                        <div className="flex items-center gap-3 p-2 rounded-md transition-colors bg-emerald-500/10 border border-emerald-500/20">
                          <div className="p-1.5 rounded-full bg-emerald-500 text-black shadow-[0_0_10px_rgba(16,185,129,0.4)]">
                            <Wifi className="h-3.5 w-3.5" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold tracking-wide text-emerald-500">
                              SERVER ONLINE
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              Syncing data to core
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="p-2">
                        <div className="px-2 py-1.5 text-xs text-muted-foreground font-mono hover:text-foreground cursor-pointer rounded transition-colors mb-1 flex items-center gap-2 hover:bg-white/5">
                          <Monitor className="h-3 w-3" /> System Settings
                        </div>
                        <button
                          onClick={onLogout}
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-md transition-colors border border-transparent hover:border-red-500/20"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>Disconnect Session</span>
                        </button>
                      </div>

                      <div className="p-2 text-[10px] text-center text-muted-foreground/50 font-mono border-t bg-black/50 border-white/5">
                        V1.0.3-SYNCED #392
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto flex flex-col gap-8 px-4 py-8 md:px-6">

          {showAdminPanel ? (
            <AdminPanel />
          ) : (
            <>
              {/* Top Controls & Summary */}
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-white/10 pb-6">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight text-primary text-glow">Dashboard_Overview</h2>
                  <p className="text-muted-foreground font-mono text-sm">&gt;&gt; Financial Activity Log Initialized...</p>
                </div>

                <Button onClick={() => setIsModalOpen(true)} className="shadow-[0_0_15px_rgba(0,212,255,0.4)] border border-primary/50 hover:bg-primary/20">
                  <Plus className="sm:mr-2 h-4 w-4" /> <span className="hidden sm:inline">NEW_ENTRY</span>
                </Button>
              </div>

              <SummaryCards expenses={expenses} />

              <ExpenseCharts
                expenses={expenses}
                viewDate={viewDate}
                onPrevMonth={handlePrevMonth}
                onNextMonth={handleNextMonth}
                onReset={handleReset}
              />

              <TransactionList
                expenses={viewMonthExpenses}
                sortConfig={sortConfig}
                onToggleSort={toggleSort}
                onDelete={deleteExpense}
              />
            </>
          )}

        </main>

        <AddExpenseModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onAdd={addExpense}
        />

      </div>
    </>
  );
}

function App() {
  const [user, setUser] = useState<string | null>(() => localStorage.getItem('current_user'));

  const handleLogin = (username: string) => {
    localStorage.setItem('current_user', username);
    setUser(username);
  };

  const handleLogout = () => {
    localStorage.removeItem('current_user');
    setUser(null);
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return <Dashboard key={user} user={user} onLogout={handleLogout} />;
}

export default App;
