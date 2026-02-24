'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '../context/LanguageContext';

export default function AdminDashboard() {
    const router = useRouter();
    const { t, language, setLanguage, isRTL } = useLanguage();
    const [user, setUser] = useState<any>(null);
    const [stats, setStats] = useState({
        totalVans: 0,
        activeVans: 0,
        totalMembers: 0,
        activeMembers: 0,
        clusterHealth: '92%'
    });
    const [vans, setVans] = useState<any[]>([]);
    const [members, setMembers] = useState<any[]>([]);
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    useEffect(() => {
        const savedUser = localStorage.getItem('tracker_user');
        let userData;
        if (!savedUser) {
            userData = { role: 'admin', name: 'System Admin', id: 'mock_admin' };
            localStorage.setItem('tracker_user', JSON.stringify(userData));
        } else {
            userData = JSON.parse(savedUser);
            if (userData.role !== 'admin') {
                router.push('/');
                return;
            }
        }
        setUser(userData);
        fetchAdminData();
    }, []);

    const fetchAdminData = async () => {
        setLoading(true);
        try {
            const [vansRes, reportsRes] = await Promise.all([
                fetch(`${apiUrl}/api/vans`),
                fetch(`${apiUrl}/api/reports`)
            ]);

            const vansDataAll = await vansRes.json();
            const reportsData = await reportsRes.json();

            const vansData = vansDataAll.vans || [];
            const membersData = vansDataAll.members || [];

            setVans(vansData);
            setMembers(membersData);
            setReports(reportsData);
            setStats({
                totalVans: vansData.length,
                activeVans: vansData.filter((v: any) => v.isDriving).length,
                totalMembers: membersData.length,
                activeMembers: membersData.filter((m: any) => !m.arrived).length,
                clusterHealth: '94%'
            });
        } catch (e) {
            console.error("Admin fetch error", e);
        } finally {
            setLoading(false);
        }
    };

    const resolveReport = async (reportId: string) => {
        try {
            await fetch(`${apiUrl}/api/reports/resolve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reportId })
            });
            fetchAdminData();
        } catch (e) { }
    };

    if (!user) return null;

    return (
        <div className={`min-h-screen bg-white text-slate-700 font-[family-name:var(--font-geist-sans)] overflow-hidden flex ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
            {/* Sidebar */}
            <aside className={`w-80 glass-card bg-slate-50/50 border-r border-slate-100 p-8 flex flex-col gap-10 ${isRTL ? 'border-l border-slate-100' : 'border-r border-slate-100'}`}>
                {/* ... existing sidebar ... */}
                <div className="flex items-center gap-4">
                    <img src="/logooo.png" alt="Logo" className="w-12 h-12 object-contain" />
                    <div>
                        <h1 className="text-2xl font-black tracking-tighter text-slate-900">ADMIN</h1>
                        <p className="text-[10px] font-black uppercase text-[#f5b829] uppercase tracking-widest">{t('admin.control_center')}</p>
                    </div>
                </div>

                {/* Language Switcher in Sidebar */}
                <div>
                    <div className="grid grid-cols-2 glass bg-white/50 p-1 rounded-2xl border-slate-100">
                        <button
                            onClick={() => setLanguage('en')}
                            className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${language === 'en' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            English
                        </button>
                        <button
                            onClick={() => setLanguage('ar')}
                            className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${language === 'ar' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            العربية
                        </button>
                    </div>
                </div>

                <nav className="flex-1 space-y-2">
                    <button className="w-full flex items-center gap-4 px-6 py-4 glass bg-[#f5b829]/5 text-[#f5b829] border-[#f5b829]/20 rounded-2xl font-bold text-sm transition-all">
                        <span>📊</span> {t('admin.overview')}
                    </button>
                    <button className="w-full flex items-center gap-4 px-6 py-4 glass hover:bg-white text-slate-400 hover:text-slate-600 rounded-2xl font-bold text-sm transition-all border-slate-100">
                        <span>🚌</span> {t('admin.fleet_management')}
                    </button>
                    <button className="w-full flex items-center gap-4 px-6 py-4 glass hover:bg-white text-slate-400 hover:text-slate-600 rounded-2xl font-bold text-sm transition-all border-slate-100">
                        <span>👥</span> {t('admin.user_directory')}
                    </button>
                    <button className="w-full flex items-center gap-4 px-6 py-4 glass hover:bg-white text-slate-400 hover:text-slate-600 rounded-2xl font-bold text-sm transition-all border-slate-100">
                        <span>⚙️</span> {t('common.settings')}
                    </button>
                </nav>

                <button
                    onClick={() => router.push('/')}
                    className="w-full py-4 glass border-slate-100 hover:bg-white text-slate-400 hover:text-slate-600 rounded-2xl font-bold text-sm transition-all"
                >
                    {t('admin.back_to_map')}
                </button>
            </aside>

            {/* Main Content */}
            <main className={`flex-1 p-12 overflow-y-auto custom-scrollbar bg-white ${isRTL ? 'text-right' : 'text-left'}`}>
                <header className={`flex justify-between items-end mb-12 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div>
                        <h2 className="text-4xl font-black text-slate-900 tracking-tighter mb-2">{t('admin.systems_overview')}</h2>
                        <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">{t('admin.health_desc')}</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="glass bg-slate-50 px-6 py-3 rounded-2xl border-slate-100 flex items-center gap-3">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('admin.mainnet_live')}</span>
                        </div>
                    </div>
                </header>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
                    {[
                        { label: t('admin.active_fleet'), value: stats.activeVans, total: stats.totalVans, color: 'amber', icon: '🚌' },
                        { label: t('admin.live_members'), value: stats.activeMembers, total: stats.totalMembers, color: 'amber', icon: '👤' },
                        { label: t('admin.cluster_health'), value: stats.clusterHealth, color: 'emerald', icon: '🛡️' },
                        { label: t('admin.connectivity'), value: '100%', color: 'amber', icon: '🌐' }
                    ].map((stat, i) => (
                        <div key={i} className="glass-card bg-white p-8 rounded-[2.5rem] border-slate-100 shadow-xl shadow-slate-200/50 relative overflow-hidden group">
                            <div className={`absolute top-0 right-0 w-24 h-24 bg-[#f5b829]/5 blur-3xl`} />
                            <p className={`text-[10px] uppercase font-black text-slate-400 tracking-widest mb-4 flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                <span>{stat.icon}</span> {stat.label}
                            </p>
                            <div className={`flex items-baseline gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                <span className="text-4xl font-black text-slate-900 tabular-nums">{stat.value}</span>
                                {stat.total !== undefined && <span className="text-xs font-bold text-slate-300">/ {stat.total}</span>}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
                    {/* Fleet Table */}
                    <section className="glass bg-slate-50/50 p-10 rounded-[3rem] border-slate-100 shadow-xl shadow-slate-200/50">
                        <div className={`flex items-center justify-between mb-8 ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest">{t('admin.fleet_status')}</h3>
                            <button className="text-[10px] font-black text-[#f5b829] hover:text-[#f5b829]/80 transition-colors uppercase tracking-widest">{t('admin.view_all')}</button>
                        </div>
                        <div className="space-y-4">
                            {vans.map(v => (
                                <div key={v.id} className={`glass bg-white p-5 rounded-2xl flex items-center justify-between border-slate-100 group hover:border-[#f5b829]/30 transition-all shadow-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
                                    <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                        <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-xl">
                                            {(v.capacity || 0) >= 5 ? (
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bus-icon lucide-bus"><path d="M8 6v6" /><path d="M15 6v6" /><path d="M2 12h19.6" /><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3" /><circle cx="7" cy="18" r="2" /><path d="M9 18h5" /><circle cx="16" cy="18" r="2" /></svg>
                                            ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-car-icon lucide-car"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" /><circle cx="7" cy="17" r="2" /><path d="M9 17h6" /><circle cx="17" cy="17" r="2" /></svg>
                                            )}
                                        </div>
                                        <div className={isRTL ? 'text-right' : 'text-left'}>
                                            <p className="text-sm font-black text-slate-900">VAN-{v.id.slice(0, 4).toUpperCase()}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('auth.label_capacity')}: {v.capacity || 0}</p>
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${v.isDriving ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-slate-100 text-slate-400 border border-slate-200'}`}>
                                        {v.isDriving ? t('admin.moving') : t('admin.parked')}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Reports List */}
                    <section className="glass bg-slate-50/50 p-10 rounded-[3rem] border-slate-100 shadow-xl shadow-slate-200/50">
                        <div className={`flex items-center justify-between mb-8 ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest">{t('reports.title')}</h3>
                        </div>
                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {reports.map((r: any) => (
                                <div key={r.id} className={`glass bg-white p-6 rounded-3xl border-slate-100 flex flex-col gap-3 relative group transition-all shadow-sm ${r.status === 'resolved' ? 'opacity-50' : 'hover:border-[#f5b829]/30'}`}>
                                    <div className={`flex justify-between items-start ${isRTL ? 'flex-row-reverse' : ''}`}>
                                        <div>
                                            <p className="text-xs font-black text-slate-900">{r.userName}</p>
                                            <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">
                                                {t(`reports.cat_${r.type}`)} • {new Date(r.timestamp).toLocaleTimeString()}
                                            </p>
                                        </div>
                                        {r.status !== 'resolved' && (
                                            <button
                                                onClick={() => resolveReport(r.id)}
                                                className="text-[8px] font-black uppercase tracking-widest text-[#f5b829] hover:text-slate-900 transition-all bg-[#f5b829]/10 hover:bg-[#f5b829] px-3 py-1 rounded-full"
                                            >
                                                Resolve
                                            </button>
                                        )}
                                    </div>
                                    <p className={`text-xs text-slate-500 font-bold leading-relaxed ${isRTL ? 'text-right' : 'text-left'}`}>{r.message}</p>
                                </div>
                            ))}
                            {reports.length === 0 && <p className="text-center py-10 text-slate-300 font-bold text-xs italic">{t('main.scanning')}</p>}
                        </div>
                    </section>
                </div>
            </main>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { 
                    background: rgba(0, 0, 0, 0.05); 
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0, 0, 0, 0.1); }
            `}</style>
        </div>
    );
}
