'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '../context/LanguageContext';

type ProfileUser = {
    id?: string;
    name?: string;
    email?: string;
    role?: 'user' | 'driver' | 'admin';
    capacity?: number;
};

export default function Profile() {
    const router = useRouter();
    const { t, isRTL } = useLanguage();
    const [user, setUser] = useState<ProfileUser | null>(null);

    useEffect(() => {
        const checkAuth = async () => {
            const savedUser = localStorage.getItem('tracker_user');
            const token = localStorage.getItem('token');

            if (!savedUser || !token) {
                router.push('/login');
                return;
            }

            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
                const res = await fetch(`${apiUrl}/api/me`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (!res.ok) {
                    localStorage.removeItem('tracker_user');
                    localStorage.removeItem('token');
                    router.push('/login');
                    return;
                }

                setUser(JSON.parse(savedUser));
            } catch {
                router.push('/login');
            }
        };

        checkAuth();
    }, [router]);

    if (!user) return null;

    return (
        <div className={`min-h-screen mesh-gradient flex items-center justify-center p-6 font-[family-name:var(--font-geist-sans)] relative overflow-hidden ${isRTL ? 'text-right' : 'text-left'}`}>
            <div className="absolute top-0 left-0 w-full h-full bus-pattern opacity-10 pointer-events-none" />

            <div className="w-full max-w-3xl glass-card rounded-[4rem] p-12 md:p-16 border-white/5 relative z-10 shadow-[0_0_100px_rgba(0,0,0,0.5)]">
                <div className={`absolute top-0 ${isRTL ? 'left-0' : 'right-0'} w-64 h-64 bg-[#f5b829]/10 blur-[120px] rounded-full -translate-y-1/2 ${isRTL ? '-translate-x-1/2' : 'translate-x-1/2'}`} />

                <div className="relative z-10">
                    <button
                        onClick={() => router.push('/')}
                        className={`mb-12 flex items-center gap-3 text-slate-500 hover:text-white transition-all font-black text-xs uppercase tracking-[0.2em] glass px-6 py-3 rounded-2xl border-white/5 ${isRTL ? 'flex-row-reverse self-end' : ''}`}
                    >
                        <span className={isRTL ? 'rotate-180' : ''}>⬅</span> {t('profile.back_to_dashboard')}
                    </button>

                    <div className={`flex flex-col md:flex-row items-center gap-10 mb-16 ${isRTL ? 'md:flex-row-reverse' : ''}`}>
                        <div className={`w-40 h-40 rounded-[3rem] flex items-center justify-center text-6xl shadow-2xl relative group ${user.role === 'driver' ? 'bg-[#213f5d]/10' : 'bg-[#f5b829]/10'}`}>
                            <div className={`absolute inset-0 blur-2xl opacity-40 group-hover:opacity-60 transition-opacity rounded-full ${user.role === 'driver' ? 'bg-[#213f5d]' : 'bg-[#f5b829]'}`} />
                            <span className="relative z-10 flex items-center justify-center">
                                {user.role === 'driver' ? (
                                    (user.capacity || 0) >= 5 ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bus-icon lucide-bus"><path d="M8 6v6" /><path d="M15 6v6" /><path d="M2 12h19.6" /><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3" /><circle cx="7" cy="18" r="2" /><path d="M9 18h5" /><circle cx="16" cy="18" r="2" /></svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-car-icon lucide-car"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" /><circle cx="7" cy="17" r="2" /><path d="M9 17h6" /><circle cx="17" cy="17" r="2" /></svg>
                                    )
                                ) : '👤'}
                            </span>
                        </div>
                        <div className={isRTL ? 'text-center md:text-right' : 'text-center md:text-left'}>
                            <h1 className="text-5xl font-black text-white tracking-tighter mb-3">{user.name}</h1>
                            <div className={`flex items-center justify-center gap-3 ${isRTL ? 'md:justify-end' : 'md:justify-start'}`}>
                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] ${user.role === 'driver' ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' : 'bg-amber-500/20 text-amber-500 border border-amber-500/30'}`}>
                                    {t(`auth.role_${user.role}`)}
                                </span>
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('profile.active_member')}</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="p-8 glass rounded-[2.5rem] border-white/5 group hover:border-white/10 transition-all">
                            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-black mb-2">{t('profile.primary_email')}</p>
                            <p className="text-xl font-bold text-white group-hover:text-[#f5b829]/80 transition-colors tracking-tight">{user.email || t('common.offline')}</p>
                        </div>
                        <div className="p-8 glass rounded-[2.5rem] border-white/5 group hover:border-white/10 transition-all">
                            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-black mb-2">{t('profile.network_id')}</p>
                            <p className="text-xl font-bold text-white group-hover:text-[#f5b829]/80 transition-colors tracking-tight">TRK-{user.id?.toUpperCase() || 'NEW'}</p>
                        </div>
                        {user.role === 'driver' && (
                            <div className="p-10 glass-card bg-[#213f5d]/5 rounded-[3rem] border-[#213f5d]/10 md:col-span-2 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-[#213f5d]/10 blur-3xl" />
                                <p className="text-[10px] uppercase tracking-[0.2em] text-[#213f5d]/60 font-black mb-3">{t('auth.label_capacity')}</p>
                                <div className={`flex items-baseline gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                    <p className="text-5xl font-black text-[#213f5d] tracking-tighter">{user.capacity}</p>
                                    <p className="text-lg font-black text-[#213f5d]/50 uppercase tracking-widest">{t('profile.authorized_seats')}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className={`mt-16 flex flex-col md:flex-row gap-6 ${isRTL ? 'md:flex-row-reverse' : ''}`}>
                        <button
                            onClick={() => {
                                localStorage.removeItem('tracker_user');
                                localStorage.removeItem('token');
                                router.push('/login');
                            }}
                            className="flex-1 py-6 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-black rounded-[2rem] transition-all border border-red-500/20 uppercase tracking-[0.2em] text-xs active:scale-95"
                        >
                            {t('profile.deauthorize')}
                        </button>
                        <button className="flex-1 py-6 glass hover:bg-white/5 text-slate-400 hover:text-white font-black rounded-[2rem] transition-all border-white/5 uppercase tracking-[0.2em] text-xs active:scale-95">
                            {t('profile.security_settings')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
