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
        <div className="min-h-screen w-screen flex items-center justify-center bg-white relative overflow-y-auto py-12 font-[family-name:var(--font-geist-sans)]">
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

            <div className="w-full max-w-md p-6 relative z-10">
                <div className="glass-card rounded-[2.5rem] p-8 md:p-10 border-slate-100 bg-white/90 shadow-2xl shadow-slate-200/40">
                    <div className="text-center mb-10">
                        <div className="relative inline-block mb-6">
                            <div className="absolute inset-0 bg-blue-500/5 blur-2xl rounded-full scale-150 animate-pulse" />
                            <img
                                src="/logooo.jpeg"
                                alt="Logo"
                                className="w-20 h-20 mx-auto object-contain relative z-10 drop-shadow-md"
                            />
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-2">
                            {isLogin ? t('auth.title_login') : t('auth.title_signup')}
                        </h1>
                        <p className="text-slate-400 font-bold text-sm">
                            {isLogin ? t('auth.subtitle_login') : t('auth.subtitle_signup')}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 p-1 glass bg-slate-50/50 rounded-2xl mb-8 h-12 relative overflow-hidden border-slate-100">
                        <button
                            onClick={() => setRole('user')}
                            className={`relative z-10 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-500 ${role === 'user' ? 'text-white' : 'text-slate-400 hover:text-slate-500'}`}
                        >
                            <span>👤</span> {t('auth.role_user')}
                        </button>
                        <button
                            onClick={() => setRole('driver')}
                            className={`relative z-10 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-500 ${role === 'driver' ? 'text-white' : 'text-slate-400 hover:text-slate-500'}`}
                        >
                            <span>🚌</span> {t('auth.role_driver')}
                        </button>
                        <div className={`absolute inset-y-1 w-[calc(50%-4px)] ${role === 'driver' ? 'bg-amber-600 shadow-md shadow-amber-600/20' : 'bg-blue-600 shadow-md shadow-blue-600/20'} rounded-xl transition-all duration-500 ease-out ${role === 'driver' ? (isRTL ? 'translate-x-[calc(-100%-2px)]' : 'translate-x-[calc(100%+2px)]') : (isRTL ? 'translate-x-[-2px]' : 'translate-x-[2px]')}`} />
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!isLogin && (
                            <div className="group">
                                <label className="text-[9px] uppercase tracking-[0.2em] font-black text-slate-400 ml-4 mb-2 block group-focus-within:text-blue-600 transition-colors">{t('auth.label_name')}</label>
                                <input
                                    type="text"
                                    placeholder="Enter your name"
                                    className="w-full h-14 px-6 bg-slate-50/50 border border-slate-100 hover:border-blue-500/20 focus:border-blue-500/40 rounded-xl focus:ring-4 focus:ring-blue-500/5 transition-all font-bold outline-none text-slate-800 placeholder-slate-300 text-sm"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                        )}

                        <div className="group">
                            <label className="text-[9px] uppercase tracking-[0.2em] font-black text-slate-400 ml-4 mb-2 block group-focus-within:text-blue-600 transition-colors">{t('auth.label_email')}</label>
                            <input
                                type="email"
                                placeholder="name@example.com"
                                className="w-full h-14 px-6 bg-slate-50/50 border border-slate-100 hover:border-blue-500/20 focus:border-blue-500/40 rounded-xl focus:ring-4 focus:ring-blue-500/5 transition-all font-bold outline-none text-slate-800 placeholder-slate-300 text-sm"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                        </div>

                        <div className="group">
                            <label className="text-[9px] uppercase tracking-[0.2em] font-black text-slate-400 ml-4 mb-2 block group-focus-within:text-blue-600 transition-colors">Security Key</label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                className="w-full h-14 px-6 bg-slate-50/50 border border-slate-100 hover:border-blue-500/20 focus:border-blue-500/40 rounded-xl focus:ring-4 focus:ring-blue-500/5 transition-all font-bold outline-none text-slate-800 placeholder-slate-300 text-sm"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                            />
                        </div>

                        {!isLogin && role === 'driver' && (
                            <div className="group">
                                <label className="text-[9px] uppercase tracking-[0.2em] font-black text-slate-400 ml-4 mb-2 block group-focus-within:text-amber-600 transition-colors">{t('auth.label_capacity')}</label>
                                <input
                                    type="number"
                                    placeholder="14"
                                    className="w-full h-14 px-6 bg-slate-50/50 border border-slate-100 hover:border-amber-500/20 focus:border-amber-500/40 rounded-xl focus:ring-4 focus:ring-amber-500/5 transition-all font-bold outline-none text-slate-800 placeholder-slate-300 text-sm"
                                    value={formData.capacity}
                                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                                    required
                                />
                            </div>
                        )}

                        {error && (
                            <div className="bg-red-50 border border-red-100 py-3 rounded-xl text-red-500 text-[10px] font-black text-center animate-shake uppercase tracking-widest">
                                {error}
                            </div>
                        )}

                        <button
                            disabled={loading}
                            type="submit"
                            className={`w-full h-14 mt-4 relative group overflow-hidden ${role === 'driver' ? 'bg-amber-600 shadow-lg shadow-amber-600/10' : 'bg-blue-600 shadow-lg shadow-blue-600/10'} text-white font-black rounded-xl transition-all active:scale-[0.98] uppercase tracking-[0.2em] text-[10px]`}
                        >
                            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                            {loading ? (
                                <span className="flex items-center justify-center gap-2 relative z-10">
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    SECURE AUTHENTICATING...
                                </span>
                            ) : (
                                <span className="relative z-10">{isLogin ? t('auth.btn_login') : t('auth.btn_signup')}</span>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-slate-400 font-bold text-xs tracking-wide">
                            {isLogin ? t('auth.toggle_signup') : t('auth.toggle_login')}
                            <button
                                onClick={() => setIsLogin(!isLogin)}
                                className={`ml-2 text-slate-900 border-b border-slate-200 hover:border-slate-800 transition-all font-black ${isRTL ? 'mr-2 ml-0' : 'ml-2'}`}
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
