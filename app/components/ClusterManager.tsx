'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

interface Cluster {
    id: string;
    name: string;
    driverId: string;
    members: string[];
}

export default function ClusterManager({ user }: { user: any }) {
    const { t, isRTL } = useLanguage();
    const [clusters, setClusters] = useState<Cluster[]>([]);
    const [myCluster, setMyCluster] = useState<Cluster | null>(null);
    const [newClusterName, setNewClusterName] = useState('');
    const [loading, setLoading] = useState(false);
    const [attendance, setAttendance] = useState<'coming' | 'not_coming' | null>(null);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    useEffect(() => {
        fetchClusters();
        fetchAttendance();
    }, [user]);

    const fetchClusters = async () => {
        try {
            await fetch(`${apiUrl}/api/vans`);
        } catch (e) { }
    };

    const fetchAttendance = async () => {
        try {
            const res = await fetch(`${apiUrl}/api/attendance`);
            const data = await res.json();
            setAttendance(data[user.id] || null);
        } catch (e) { }
    };

    const createCluster = async () => {
        if (!newClusterName) return;
        setLoading(true);
        try {
            const res = await fetch(`${apiUrl}/api/clusters/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newClusterName, driverId: user.id })
            });
            const data = await res.json();
            if (data.success) {
                setMyCluster(data.cluster);
                setNewClusterName('');
            }
        } catch (e) { } finally {
            setLoading(false);
        }
    };

    const markAttendance = async (status: 'coming' | 'not_coming') => {
        setLoading(true);
        try {
            await fetch(`${apiUrl}/api/attendance`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, status })
            });
            setAttendance(status);
        } catch (e) { } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`mt-8 space-y-6 ${isRTL ? 'text-right' : 'text-left'}`}>
            <div className="glass p-6 rounded-[2.5rem] border-white/5 shadow-2xl relative overflow-hidden group">
                <div className={`absolute top-0 ${isRTL ? 'left-0' : 'right-0'} w-24 h-24 bg-amber-500/5 blur-2xl -translate-y-1/2 ${isRTL ? '-translate-x-1/2' : 'translate-x-1/2'}`} />
                <p className={`text-[10px] uppercase tracking-[0.2em] text-slate-500 font-black mb-5 flex items-center gap-2 relative z-10 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <span className="text-amber-500">🛡️</span> {user.role === 'driver' ? t('cluster.ops') : t('cluster.boarding_status')}
                </p>

                {user.role === 'driver' ? (
                    <div className="space-y-4 relative z-10">
                        {!myCluster ? (
                            <div className="space-y-4">
                                <input
                                    type="text"
                                    placeholder={t('cluster.name_placeholder')}
                                    className={`w-full px-6 py-4 glass bg-white/5 border-white/10 rounded-2xl text-sm font-bold text-white focus:ring-2 focus:ring-amber-500/50 outline-none transition-all placeholder:text-slate-600 ${isRTL ? 'text-right' : 'text-left'}`}
                                    value={newClusterName}
                                    onChange={(e) => setNewClusterName(e.target.value)}
                                />
                                <button
                                    onClick={createCluster}
                                    disabled={loading}
                                    className="w-full py-5 bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-black rounded-2xl uppercase tracking-[0.2em] shadow-2xl shadow-amber-500/20 active:scale-95 transition-all disabled:opacity-50"
                                >
                                    {loading ? t('cluster.processing') : t('cluster.establish')}
                                </button>
                            </div>
                        ) : (
                            <div className={`p-6 glass bg-amber-500/10 border-amber-500/20 rounded-[2rem] flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                                <div className={isRTL ? 'text-right' : 'text-left'}>
                                    <p className="text-sm font-black text-white tracking-tight">{myCluster.name}</p>
                                    <p className="text-[10px] text-amber-500 font-bold uppercase tracking-widest mt-1">{t('cluster.operational')}</p>
                                </div>
                                <span className="bg-amber-500/20 px-3 py-1 rounded-full text-[8px] font-black text-amber-500 border border-amber-500/30">{t('cluster.master')}</span>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4 relative z-10">
                        <button
                            onClick={() => markAttendance('coming')}
                            disabled={loading}
                            className={`py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 disabled:opacity-50 ${attendance === 'coming' ? 'bg-emerald-500 text-white shadow-[0_0_30px_rgba(16,185,129,0.3)]' : 'glass text-slate-400 border-white/5 hover:border-emerald-500/30'}`}
                        >
                            {loading && attendance !== 'coming' ? '...' : `✅ ${t('cluster.confirm')}`}
                        </button>
                        <button
                            onClick={() => markAttendance('not_coming')}
                            disabled={loading}
                            className={`py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 disabled:opacity-50 ${attendance === 'not_coming' ? 'bg-red-500 text-white shadow-[0_0_30px_rgba(239,68,68,0.3)]' : 'glass text-slate-400 border-white/5 hover:border-red-500/30'}`}
                        >
                            {loading && attendance !== 'not_coming' ? '...' : `❌ ${t('cluster.absent')}`}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
