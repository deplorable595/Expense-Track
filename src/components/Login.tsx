import { useState } from 'react';
import { Button } from './ui/Button';
import { WalletCards, Lock, User, Mail, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { CyberpunkBackground } from './CyberpunkBackground';

interface LoginProps {
    onLogin: (userId: string) => void;
}





export const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Base API URL (Dynamically detects IP for Mobile support)
    const API_URL = `http://${window.location.hostname}:3001/api`;

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        if (!username || !password || (!isLogin && !email)) {
            setError('Please fill in all fields');
            return;
        }

        try {
            if (isLogin) {
                // LOGIN
                const res = await fetch(`${API_URL}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });

                const data = await res.json();
                if (res.ok) {
                    onLogin(username);
                } else {
                    setError(data.error || 'Login failed');
                }
            } else {
                // SIGNUP
                const res = await fetch(`${API_URL}/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, email, password })
                });

                const data = await res.json();
                if (res.ok) {
                    setSuccessMessage('Account created successfully! Switching to login...');
                    setTimeout(() => {
                        setIsLogin(true);
                        setSuccessMessage('');
                        setPassword('');
                    }, 1500);
                } else {
                    setError(data.error || 'Registration failed');
                }
            }
        } catch (err) {
            console.error(err);
            setError('Network Error: Ensure server is running');
        }
    };

    const toggleMode = () => {
        setIsLogin(!isLogin);
        setError('');
        setSuccessMessage('');
        setUsername('');
        setPassword('');
        setEmail('');
    };

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-transparent">
            <CyberpunkBackground />

            <div className="z-10 w-full max-w-md space-y-8 rounded-lg border border-white/10 bg-black/40 p-8 shadow-[0_0_50px_rgba(0,212,255,0.1)] backdrop-blur-md animate-in fade-in zoom-in duration-500">

                <div className="flex flex-col items-center justify-center text-center">
                    <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary shadow-[0_0_30px_rgba(0,212,255,0.4)] ring-1 ring-primary/50 animate-pulse-slow">
                        <WalletCards className="h-10 w-10" />
                    </div>
                    <h2 className="text-4xl font-bold tracking-tight text-glow animate-flicker">
                        EXPENSE<span className="text-secondary text-glow-pink">TRACK</span>
                    </h2>
                    <p className="mt-2 text-sm text-cyan-400/80 font-mono tracking-wider">
                        {isLogin ? 'SECURE_TERMINAL_ACCESS_V1.0' : 'NEW_USER_REGISTRATION'}
                    </p>
                </div>

                <form onSubmit={handleAuth} className="mt-8 space-y-6">
                    <div className="space-y-4">
                        <div className="relative group">
                            <User className="absolute left-3 top-3 h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary group-focus-within:text-primary" />
                            <input
                                type="text"
                                placeholder="USERNAME"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full rounded bg-black/50 border border-white/10 px-10 py-3 text-foreground placeholder-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all duration-300 font-mono"
                            />
                        </div>

                        {!isLogin && (
                            <div className="relative group animate-in slide-in-from-top-4 fade-in duration-300">
                                <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary group-focus-within:text-primary" />
                                <input
                                    type="email"
                                    placeholder="EMAIL_ADDRESS"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full rounded bg-black/50 border border-white/10 px-10 py-3 text-foreground placeholder-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all duration-300 font-mono"
                                />
                            </div>
                        )}

                        <div className="relative group">
                            <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary group-focus-within:text-primary" />
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="PASSWORD"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full rounded bg-black/50 border border-white/10 px-10 py-3 text-foreground placeholder-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all duration-300 font-mono pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-3 text-muted-foreground hover:text-primary focus:outline-none transition-colors"
                            >
                                {showPassword ? (
                                    <EyeOff className="h-5 w-5" />
                                ) : (
                                    <Eye className="h-5 w-5" />
                                )}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="text-center text-sm text-red-500 text-glow-pink bg-red-950/30 py-2 border border-red-500/20 rounded animate-in fade-in zoom-in">
                            {error}
                        </div>
                    )}

                    {successMessage && (
                        <div className="text-center text-sm text-green-500 text-glow-green bg-green-950/30 py-2 border border-green-500/20 rounded animate-in fade-in zoom-in">
                            {successMessage}
                        </div>
                    )}

                    <Button type="submit" className="w-full py-6 text-lg tracking-widest font-bold shadow-[0_0_20px_rgba(0,212,255,0.3)] hover:shadow-[0_0_40px_rgba(0,212,255,0.6)] transition-all duration-300 bg-primary/20 border border-primary hover:bg-primary hover:text-black">
                        {isLogin ? 'AUTHENTICATE >>' : 'REGISTER_USER >>'}
                    </Button>

                    <div className="mt-4 text-center border-t border-white/5 pt-4">
                        <button
                            type="button"
                            onClick={toggleMode}
                            className="text-sm text-muted-foreground hover:text-secondary hover:text-glow-pink transition-all duration-300 font-mono flex items-center justify-center gap-2 mx-auto group"
                        >
                            {isLogin ? (
                                <>
                                    NO_ACCESS_ID? <span className="text-primary group-hover:underline">INIT_REGISTRATION</span>
                                </>
                            ) : (
                                <>
                                    HAS_ACCESS_ID? <span className="text-primary group-hover:underline">RETURN_TO_LOGIN</span>
                                </>
                            )}
                            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
