'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '../context/LanguageContext';

export default function Login() {
    const router = useRouter();
    const { t, language, setLanguage, isRTL } = useLanguage();
    const [isLogin, setIsLogin] = useState(true);
    const [role, setRole] = useState<'user' | 'driver'>('user');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        capacity: '14'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const endpoint = isLogin ? '/api/login' : '/api/signup';

        const payload = {
            ...formData,
            role,
            id: isLogin ? undefined : Math.random().toString(36).substring(7)
        };

        try {
            const res = await fetch(`${apiUrl}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (data.success) {
                localStorage.setItem('tracker_user', JSON.stringify(data.user));
                router.push(data.user.role === 'admin' ? '/admin' : '/');
            } else {
                setError(data.error || 'Authentication failed');
            }
        } catch (err) {
            setError('Connection error. Is the server running?');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-screen flex items-center justify-center bg-white relative overflow-hidden font-[family-name:var(--font-geist-sans)]">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full bus-pattern opacity-5 pointer-events-none" />
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-amber-500/5 blur-[150px] rounded-full animate-mesh" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-500/5 blur-[150px] rounded-full animate-mesh" style={{ animationDelay: '4s' }} />

            {/* Language Switcher */}
            <div className={`absolute top-10 ${isRTL ? 'left-10' : 'right-10'} z-50`}>
                <button
                    onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
                    className="glass px-5 py-2.5 rounded-2xl border-slate-200 text-xs font-black text-slate-800 hover:bg-slate-50 transition-all uppercase tracking-widest"
                >
                    {language === 'en' ? 'العربية' : 'English'}
                </button>
            </div>

            <div className="w-full max-w-xl p-6 relative z-10">
                <div className="glass-card rounded-[3.5rem] p-10 md:p-16 border-slate-100 bg-white/80 shadow-2xl shadow-slate-200/50">
                    <div className="text-center mb-12">
                        <div className="relative inline-block mb-8">
                            <div className="absolute inset-0 bg-amber-500/10 blur-2xl rounded-full scale-150 animate-pulse" />
                            <img
                                src="/logooo.jpeg"
                                alt="Logo"
                                className="w-24 h-24 mx-auto object-contain relative z-10 drop-shadow-lg"
                            />
                        </div>
                        <h1 className="text-5xl font-black text-slate-900 tracking-tighter mb-3">
                            {isLogin ? t('auth.title_login') : t('auth.title_signup')}
                        </h1>
                        <p className="text-slate-500 font-bold text-lg">
                            {isLogin ? t('auth.subtitle_login') : t('auth.subtitle_signup')}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 p-1.5 glass bg-slate-50 rounded-[2rem] mb-10 h-16 relative overflow-hidden border-slate-100">
                        <button
                            onClick={() => setRole('user')}
                            className={`relative z-10 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest rounded-[1.5rem] transition-all duration-500 ${role === 'user' ? 'text-white' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <span>👤</span> {t('auth.role_user')}
                        </button>
                        <button
                            onClick={() => setRole('driver')}
                            className={`relative z-10 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest rounded-[1.5rem] transition-all duration-500 ${role === 'driver' ? 'text-white' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <span>🚌</span> {t('auth.role_driver')}
                        </button>
                        <div className={`absolute inset-y-1.5 w-[calc(50%-6px)] ${role === 'driver' ? 'bg-amber-600 shadow-lg shadow-amber-500/30' : 'bg-blue-600 shadow-lg shadow-blue-500/30'} rounded-[1.6rem] transition-all duration-500 ease-out ${role === 'driver' ? (isRTL ? 'translate-x-[-100%]' : 'translate-x-full') : 'translate-x-0'}`} />
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {!isLogin && (
                            <div className="group">
                                <label className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 ml-6 mb-2 block group-focus-within:text-blue-600 transition-colors">{t('auth.label_name')}</label>
                                <input
                                    type="text"
                                    placeholder="Enter your name"
                                    className="w-full h-16 px-8 bg-slate-50 border border-slate-100 hover:border-blue-500/30 focus:border-blue-500/50 rounded-2xl focus:ring-4 focus:ring-blue-500/5 transition-all font-bold outline-none text-slate-900 placeholder-slate-300"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                        )}

                        <div className="group">
                            <label className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 ml-6 mb-2 block group-focus-within:text-blue-600 transition-colors">{t('auth.label_email')}</label>
                            <input
                                type="email"
                                placeholder="name@example.com"
                                className="w-full h-16 px-8 bg-slate-50 border border-slate-100 hover:border-blue-500/30 focus:border-blue-500/50 rounded-2xl focus:ring-4 focus:ring-blue-500/5 transition-all font-bold outline-none text-slate-900 placeholder-slate-300"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                        </div>

                        <div className="group">
                            <label className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 ml-6 mb-2 block group-focus-within:text-blue-600 transition-colors">Security Key</label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                className="w-full h-16 px-8 bg-slate-50 border border-slate-100 hover:border-blue-500/30 focus:border-blue-500/50 rounded-2xl focus:ring-4 focus:ring-blue-500/5 transition-all font-bold outline-none text-slate-900 placeholder-slate-300"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                            />
                        </div>

                        {!isLogin && role === 'driver' && (
                            <div className="group">
                                <label className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 ml-6 mb-2 block group-focus-within:text-amber-600 transition-colors">{t('auth.label_capacity')}</label>
                                <input
                                    type="number"
                                    placeholder="14"
                                    className="w-full h-16 px-8 bg-slate-50 border border-slate-100 hover:border-amber-500/30 focus:border-amber-500/50 rounded-2xl focus:ring-4 focus:ring-amber-500/5 transition-all font-bold outline-none text-slate-900 placeholder-slate-300"
                                    value={formData.capacity}
                                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                                    required
                                />
                            </div>
                        )}

                        {error && (
                            <div className="bg-red-50 border border-red-100 py-4 rounded-2xl text-red-500 text-xs font-black text-center animate-shake uppercase tracking-widest">
                                {error}
                            </div>
                        )}

                        <button
                            disabled={loading}
                            type="submit"
                            className={`w-full h-18 relative group overflow-hidden ${role === 'driver' ? 'bg-amber-600 shadow-xl shadow-amber-600/20' : 'bg-blue-600 shadow-xl shadow-blue-600/20'} text-white font-black rounded-2xl transition-all active:scale-[0.98] uppercase tracking-[0.2em] text-xs`}
                        >
                            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                            {loading ? (
                                <span className="flex items-center justify-center gap-3 relative z-10">
                                    <span className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                                    SECURE AUTHENTICATING...
                                </span>
                            ) : (
                                <span className="relative z-10">{isLogin ? t('auth.btn_login') : t('auth.btn_signup')}</span>
                            )}
                        </button>
                    </form>

                    <div className="mt-12 text-center">
                        <p className="text-slate-400 font-bold text-sm tracking-wide">
                            {isLogin ? t('auth.toggle_signup') : t('auth.toggle_login')}
                            <button
                                onClick={() => setIsLogin(!isLogin)}
                                className={`ml-3 text-slate-900 border-b-2 border-slate-200 hover:border-slate-800 transition-all pb-0.5 ${isRTL ? 'mr-3 ml-0' : 'ml-3'}`}
                            >
                                {isLogin ? 'Workspace' : 'Sign In'}
                            </button>
                        </p>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-4px); }
                    75% { transform: translateX(4px); }
                }
                .animate-shake {
                    animation: shake 0.2s ease-in-out 2;
                }
                .h-18 { height: 4.5rem; }
            `}</style>
        </div>
    );
}
