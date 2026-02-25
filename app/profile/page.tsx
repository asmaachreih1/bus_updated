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
    const [copied, setCopied] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

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

        const handleStorageChange = () => {
            const updatedUser = localStorage.getItem('tracker_user');
            if (updatedUser) setUser(JSON.parse(updatedUser));
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
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
        <div className={`min-h-screen bg-slate-50 flex flex-col items-center p-4 sm:p-6 pb-64 pt-8 font-[family-name:var(--font-geist-sans)] relative overflow-y-auto overflow-x-hidden ${isRTL ? 'text-right' : 'text-left'}`}>
            <div className="fixed top-0 right-0 w-full md:w-1/2 h-full bg-gradient-to-bl from-indigo-50/50 via-transparent to-transparent pointer-events-none" />
            <div className="fixed bottom-0 left-0 w-full md:w-1/2 h-full bg-gradient-to-tr from-rose-50/50 via-transparent to-transparent pointer-events-none" />

            <div className="w-full max-w-md bg-white rounded-[2.5rem] sm:rounded-[2rem] p-6 sm:p-8 border border-slate-100 relative z-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] mb-4">
                <button
                    onClick={() => router.push('/')}
                    className={`flex items-center gap-1.5 text-slate-400 hover:text-slate-900 transition-colors font-semibold text-xs mb-8 group ${isRTL ? 'flex-row-reverse' : ''}`}
                >
                    <span className={`transition-transform group-hover:-translate-x-1 ${isRTL ? 'rotate-180 group-hover:translate-x-1' : ''}`}>←</span>
                    {t('profile.back_to_dashboard') || 'Back'}
                </button>

                <div className="flex flex-col items-center mb-8">
                    <div className="relative group mb-4">
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className={`w-28 h-28 rounded-full flex items-center justify-center text-3xl font-bold shadow-sm relative overflow-hidden cursor-pointer ring-4 ring-white border border-slate-100 bg-[#274162] text-white`}
                            style={photoDataUrl ? { backgroundImage: `url(${photoDataUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', color: 'transparent' } : undefined}
                        >
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white backdrop-blur-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-1"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" /><circle cx="12" cy="13" r="3" /></svg>
                                <span className="text-[10px] font-medium tracking-wide">{t('profile.edit_photo') || 'Update'}</span>
                            </div>
                            {!photoDataUrl && (
                                <span className="relative z-10 group-hover:opacity-0 transition-opacity">
                                    {getInitials(user.name)}
                                </span>
                            )}
                        </div>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoChange} />

                        <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-sm border border-slate-100 pointer-events-none">
                            <span className="w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white"></span>
                        </div>
                    </div>

                    <h1 className="text-2xl font-bold text-slate-900 mb-1.5">{user.name}</h1>
                    <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-[11px] font-medium ${user.role === 'driver' ? 'bg-[#274162]/10 text-[#274162] border border-[#274162]/20' : 'bg-[#274162]/10 text-[#274162] border border-[#274162]/20'}`}>
                            {user.role === 'driver' ? t('auth.role_driver') || 'Driver' : (user.clusterCode || user.clusterId ? `Cluster ${user.clusterCode || user.clusterId}` : 'Member')}
                        </span>
                    </div>
                </div>

                <div className="space-y-2 mb-6">
                    <div className="p-3 bg-slate-50/50 rounded-2xl border border-slate-100 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-slate-400 shadow-sm border border-slate-100 flex-shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-[11px] font-medium text-slate-400 mb-0.5">{t('profile.primary_email') || 'Email Address'}</p>
                            <p className="text-sm font-medium text-slate-700 truncate">{user.email || t('common.offline')}</p>
                        </div>
                    </div>

                    {user.role === 'driver' && (
                        <>
                            <div className="p-3 bg-slate-50/50 rounded-2xl border border-slate-100 flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-slate-400 shadow-sm border border-slate-100 flex-shrink-0">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" /><path d="M15 18H9" /><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" /><circle cx="17" cy="18" r="2" /><circle cx="7" cy="18" r="2" /></svg>
                                </div>
                                <div>
                                    <p className="text-[11px] font-medium text-slate-400 mb-0.5">{t('auth.label_capacity') || 'Vehicle Capacity'}</p>
                                    <p className="text-sm font-medium text-slate-700">{user.capacity} <span className="text-slate-400 font-normal">{t('profile.authorized_seats') || 'Seats'}</span></p>
                                </div>
                            </div>
                            {user.clusterCode && (
                                <div className="p-3 bg-[#274162]/5 rounded-2xl border border-[#274162]/10 flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-[#274162] shadow-sm border border-[#274162]/10 flex-shrink-0">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><polyline points="16 11 18 13 22 9" /></svg>
                                    </div>
                                    <div className="flex-grow">
                                        <p className="text-[11px] font-medium text-[#274162]/60 mb-0.5">Active Cluster Code</p>
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-black text-[#274162] tracking-wider uppercase">{user.clusterCode}</p>
                                            <button
                                                onClick={() => copyToClipboard(user.clusterCode || '')}
                                                className={`p-1.5 rounded-lg transition-all ${copied ? 'bg-[#f5b829] text-white shadow-[0_0_15px_rgba(245,184,41,0.3)]' : 'hover:bg-[#274162]/10 text-[#274162]/60'}`}
                                            >
                                                {copied ? (
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                                                ) : (
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                <div className="space-y-2">
                    <button
                        onClick={() => {
                            sessionStorage.setItem('open_support_modal', '1');
                            router.push('/');
                        }}
                        className="w-full py-2.5 bg-white hover:bg-slate-50 text-slate-600 text-sm font-medium rounded-xl transition-colors border border-slate-200 flex items-center justify-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><path d="M12 17h.01" /></svg>
                        {t('common.support') || 'Help & Support'}
                    </button>
                    <button
                        onClick={() => {
                            localStorage.removeItem('tracker_user');
                            localStorage.removeItem('token');
                            router.push('/login');
                        }}
                        className="w-full py-2.5 bg-white hover:bg-red-50 text-red-500 text-sm font-medium rounded-xl transition-colors border border-slate-200 hover:border-red-200 flex items-center justify-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                        {t('common.logout') || 'Sign Out'}
                    </button>
                </div>
            </div>

            {/* Extra spacer to ensure content clears the fixed bottom navbar */}
            <div className="h-20 w-full flex-shrink-0" />

            {/* Bottom Navigation Bar */}
            <div className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 px-4 sm:px-6 py-4 pb-8 flex justify-between items-center z-50 rounded-t-[2.5rem] shadow-[0_-20px_40px_rgba(0,0,0,0.05)] md:px-12 md:pb-6 md:rounded-t-[2.5rem] md:border-none md:shadow-[0_-10px_40px_rgba(0,0,0,0.08)]">
                {/* Member Info (Current Stats) */}
                <button onClick={() => {
                    sessionStorage.setItem('open_sidebar', '1');
                    router.push('/');
                }} className="p-2 text-slate-400 hover:text-[#f5b829] transition-colors flex flex-col items-center gap-1 group flex-shrink-0 w-16">
                    {user?.role === 'user' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-activity group-hover:scale-110 transition-transform"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-home group-hover:scale-110 transition-transform"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                    )}
                    <span className="text-[9px] font-black uppercase tracking-widest mt-1 text-center w-full truncate">{user?.role === 'user' ? 'Status' : 'Home'}</span>
                </button>

                {/* Profile */}
                <button className="p-2 text-[#f5b829] transition-colors flex flex-col items-center gap-1 group flex-shrink-0 w-16">
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user scale-110"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                    <span className="text-[9px] font-black uppercase tracking-widest mt-1 text-center w-full truncate">Profile</span>
                </button>

                {/* Center Map Button */}
                <div className="relative -top-6 flex-shrink-0 px-2">
                    <button
                        onClick={() => router.push('/?view=app')}
                        className="w-16 h-16 bg-[#f5b829] text-white rounded-full flex items-center justify-center shadow-xl shadow-[#f5b829]/40 border-4 border-slate-50 transition-transform active:scale-95 hover:bg-[#f5b829]/80"
                        title="Center Map"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-map-pin"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
                    </button>
                </div>

                {/* Cluster Joined / Management */}
                <div className="flex flex-col items-center flex-shrink-0 w-16">
                    <button
                        onClick={() => {
                            sessionStorage.setItem('open_cluster_manager', '1');
                            router.push('/');
                        }}
                        className="p-2 text-slate-400 hover:text-blue-500 transition-colors flex flex-col items-center gap-1 group"
                        title="Cluster Management"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-110 transition-transform"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                    </button>
                    <span className="text-[9px] font-black uppercase tracking-widest mt-1 text-center w-full truncate text-slate-400">{user?.role === 'user' ? 'Cluster' : 'Manage'}</span>
                </div>

                {/* Support - Hide for Driver */}
                <div className="flex flex-col items-center flex-shrink-0 w-16">
                    <button
                        onClick={() => {
                            sessionStorage.setItem('open_support_modal', '1');
                            router.push('/');
                        }}
                        className="p-2 text-slate-400 hover:text-rose-500 transition-colors flex flex-col items-center gap-1 group"
                        title="Support & Reports"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-110 transition-transform"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><path d="M12 17h.01" /></svg>
                    </button>
                    <span className="text-[9px] font-black uppercase tracking-widest mt-1 text-center w-full truncate text-slate-400">Support</span>
                </div>
            </div>
        </div>
    );
}
