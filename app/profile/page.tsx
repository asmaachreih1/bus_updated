'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '../context/LanguageContext';

type ProfileUser = {
    id?: string;
    name?: string;
    email?: string;
    role?: 'user' | 'driver' | 'admin';
    capacity?: number;
    clusterId?: string;
    clusterCode?: string;
};

export default function Profile() {
    const router = useRouter();
    const { t, isRTL } = useLanguage();
    const [user, setUser] = useState<ProfileUser | null>(null);
    const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const getInitials = (name?: string) => {
        if (!name) return '??';
        const parts = name.trim().split(/\s+/);
        if (parts.length === 1) return parts[0].substring(0, 1).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };

    useEffect(() => {
        const savedUser = localStorage.getItem('tracker_user');
        if (!savedUser) {
            router.push('/login');
            return;
        }
        try {
            const parsedUser = JSON.parse(savedUser);
            setUser(parsedUser);
            setPhotoDataUrl(localStorage.getItem('profile_photo_' + parsedUser.id));
        } catch {
            router.push('/login');
        }
    }, [router]);

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && user) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const dataUrl = e.target?.result as string;
                setPhotoDataUrl(dataUrl);
                localStorage.setItem('profile_photo_' + user.id, dataUrl);
            };
            reader.readAsDataURL(file);
        }
    };

    if (!user) return null;

    return (
        <div className={`min-h-screen bg-white flex items-center justify-center p-6 font-[family-name:var(--font-geist-sans)] relative overflow-hidden ${isRTL ? 'text-right' : 'text-left'}`}>
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-[#f5b829]/5 via-transparent to-transparent pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-slate-50 via-transparent to-transparent pointer-events-none" />

            <div className="w-full max-w-2xl bg-white rounded-[3rem] p-10 md:p-14 border border-slate-100 relative z-10 shadow-2xl shadow-slate-200/50">
                <div className="relative z-10">
                    <div className={`flex items-center justify-between mb-12 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <button
                            onClick={() => router.push('/')}
                            className={`flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-all font-black text-[10px] uppercase tracking-[0.2em] bg-slate-50 px-5 py-3 rounded-2xl border border-slate-100 ${isRTL ? 'flex-row-reverse' : ''}`}
                        >
                            <span className={isRTL ? 'rotate-180' : ''}>⬅</span> {t('profile.back_to_dashboard')}
                        </button>
                    </div>

                    <div className={`flex flex-col items-center gap-6 mb-12 text-center`}>
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className={`w-32 h-32 rounded-[2.5rem] flex items-center justify-center text-4xl font-black shadow-xl relative group overflow-hidden cursor-pointer ${user.role === 'driver' ? 'bg-slate-900 text-white' : 'bg-[#f5b829] text-slate-900'}`}
                            style={photoDataUrl ? { backgroundImage: `url(${photoDataUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', color: 'transparent' } : undefined}
                        >
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                                <span className="text-2xl mb-1">📸</span>
                                <span className="text-[8px] font-black uppercase tracking-widest">{t('profile.edit_photo') || 'Edit Photo'}</span>
                            </div>
                            {!photoDataUrl && (
                                <span className="relative z-10 group-hover:opacity-0 transition-opacity">
                                    {getInitials(user.name)}
                                </span>
                            )}
                        </div>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoChange} />
                        <div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-2">{user.name}</h1>
                            <div className="flex items-center justify-center gap-2">
                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.15em] ${user.role === 'driver' ? 'bg-slate-900 text-white' : 'bg-[#f5b829]/10 text-[#f5b829] border border-[#f5b829]/20'}`}>
                                    {user.role === 'driver' ? t('auth.role_driver') : (user.clusterCode || user.clusterId ? `Cluster ${user.clusterCode || user.clusterId}` : 'Cluster Name')}
                                </span>
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('profile.active_member')}</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 mb-10">
                        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between group transition-all hover:bg-white hover:shadow-lg hover:border-slate-200">
                            <div>
                                <p className="text-[9px] uppercase tracking-[0.2em] text-slate-400 font-black mb-1">{t('profile.primary_email')}</p>
                                <p className="text-sm font-bold text-slate-700">{user.email || t('common.offline')}</p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-mail-icon lucide-mail"><path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7" /><rect x="2" y="4" width="20" height="16" rx="2" /></svg>
                            </div>
                        </div>

                        {user.role === 'driver' && (
                            <div className="p-6 bg-slate-900 rounded-3xl border border-slate-800 flex items-center justify-between group transition-all">
                                <div className="text-white">
                                    <p className="text-[9px] uppercase tracking-[0.2em] text-slate-500 font-black mb-1">{t('auth.label_capacity')}</p>
                                    <p className="text-xl font-black">{user.capacity} <span className="text-[10px] text-slate-400 uppercase tracking-widest ml-1">{t('profile.authorized_seats')}</span></p>
                                </div>
                                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-lg text-white">🚐</div>
                            </div>
                        )}
                    </div>

                    <div className={`flex flex-col gap-4 ${isRTL ? 'text-right' : 'text-left'}`}>
                        <button
                            onClick={() => {
                                sessionStorage.setItem('open_support_modal', '1');
                                router.push('/');
                            }}
                            className="w-full py-5 bg-slate-50 hover:bg-[#f5b829]/5 text-slate-700 font-black rounded-2xl transition-all border border-slate-100 hover:border-[#f5b829]/20 uppercase tracking-[0.2em] text-[10px] active:scale-95 flex items-center justify-center gap-3"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><path d="M12 17h.01" /></svg>
                            {t('common.support') || 'Support & Feedback'}
                        </button>
                        <button
                            onClick={() => {
                                localStorage.removeItem('tracker_user');
                                localStorage.removeItem('token');
                                router.push('/login');
                            }}
                            className="w-full py-5 bg-white hover:bg-red-50 text-red-500 font-black rounded-2xl transition-all border border-slate-200 hover:border-red-100 uppercase tracking-[0.2em] text-[10px] active:scale-95 flex items-center justify-center gap-3"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-log-out-icon lucide-log-out"><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /></svg> {t('common.logout') || 'Log Out'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
