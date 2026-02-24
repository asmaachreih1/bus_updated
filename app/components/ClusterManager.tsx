'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

interface Cluster {
    _id: string;
    id: string;
    code: string;
    name: string;
    driverId: string;
    members: string[];
}

interface ClusterManagerProps {
    user: any;
    isOpen: boolean;
    onClose: () => void;
}

export default function ClusterManager({ user, isOpen, onClose }: ClusterManagerProps) {
    const { t, isRTL } = useLanguage();
    const [myCluster, setMyCluster] = useState<Cluster | null>(null);
    const [clusterCode, setClusterCode] = useState(''); // For joining
    const [newClusterName, setNewClusterName] = useState('');
    const [loading, setLoading] = useState(false);
    const [attendance, setAttendance] = useState<'coming' | 'not_coming' | null>(null);
    const [members, setMembers] = useState<any[]>([]); // For drivers to see their members
    const [memberAttendance, setMemberAttendance] = useState<{ [key: string]: string }>({});
    const [copied, setCopied] = useState(false);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    useEffect(() => {
        if (isOpen) {
            fetchClusterInfo();
        }
    }, [user, isOpen]);

    const fetchClusterInfo = async () => {
        setLoading(true);
        try {
            if (user.role === 'driver') {
                const res = await fetch(`${apiUrl}/api/clusters/driver/${user.id}`);
                const data = await res.json();
                if (data.cluster) {
                    setMyCluster(data.cluster);
                    setMembers(data.members || []);
                    fetchClusterAttendance(data.cluster._id);
                }
            } else {
                const res = await fetch(`${apiUrl}/api/clusters/member/${user.id}`);
                const data = await res.json();
                if (data.cluster) {
                    setMyCluster(data.cluster);
                }
                fetchMyAttendance();
            }
        } catch (e) { } finally {
            setLoading(false);
        }
    };

    const fetchClusterAttendance = async (clusterId: string) => {
        try {
            const res = await fetch(`${apiUrl}/api/attendance/cluster/${clusterId}`);
            const data = await res.json();
            setMemberAttendance(data);
        } catch (e) { }
    };

    const fetchMyAttendance = async () => {
        try {
            const res = await fetch(`${apiUrl}/api/attendance/${user.id}`);
            const data = await res.json();
            setAttendance(data.status);
        } catch (e) { }
    };

    const joinCluster = async () => {
        if (!clusterCode) return;
        setLoading(true);
        try {
            const res = await fetch(`${apiUrl}/api/clusters/join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: clusterCode.toUpperCase(), userId: user.id })
            });
            const data = await res.json();
            if (data.success) {
                setMyCluster(data.cluster);
                setClusterCode('');
            } else {
                alert(data.error || 'Failed to join cluster');
            }
        } catch (e) { } finally {
            setLoading(false);
        }
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

    const copyToClipboard = () => {
        if (!myCluster) return;
        navigator.clipboard.writeText(myCluster.code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm">
            <div className={`w-full max-w-lg glass-card rounded-[3rem] p-10 border-white/5 relative overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.5)] ${isRTL ? 'text-right' : 'text-left'}`}>
                <div className={`absolute top-0 ${isRTL ? 'left-0' : 'right-0'} w-40 h-40 bg-[#f5b829]/10 blur-3xl`} />

                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h3 className="text-2xl font-black text-white tracking-tighter uppercase">{user.role === 'driver' ? t('cluster.ops') : t('cluster.boarding_status')}</h3>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{user.role === 'driver' ? 'Fleet Management' : 'Mark your arrival'}</p>
                    </div>
                    <button type="button" onClick={onClose} className="p-4 glass rounded-2xl text-slate-500 hover:text-white transition-all cursor-pointer relative z-50">✕</button>
                </div>

                <div className="space-y-6 relative z-10">
                    {user.role === 'driver' ? (
                        <div className="space-y-6">
                            {!myCluster ? (
                                <div className="space-y-4">
                                    <input
                                        type="text"
                                        placeholder={t('cluster.name_placeholder')}
                                        className={`w-full px-6 py-4 glass bg-white/5 border-white/10 rounded-2xl text-sm font-bold text-black focus:ring-2 focus:ring-[#f5b829]/50 outline-none transition-all placeholder:text-slate-600 ${isRTL ? 'text-right' : 'text-left'}`}
                                        value={newClusterName}
                                        onChange={(e) => setNewClusterName(e.target.value)}
                                    />
                                    <button
                                        onClick={createCluster}
                                        disabled={loading}
                                        className="w-full py-5 bg-[#f5b829] hover:bg-[#f5b829]/80 text-slate-800 text-[10px] font-black rounded-2xl uppercase tracking-[0.2em] shadow-2xl shadow-[#f5b829]/20 active:scale-95 transition-all disabled:opacity-50"
                                    >
                                        {loading ? t('cluster.processing') : t('cluster.establish')}
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="p-8 glass bg-[#f5b829]/10 border-[#f5b829]/20 rounded-[2.5rem] relative overflow-hidden text-center">
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-xl font-black text-white tracking-tight">{myCluster.name}</p>
                                            <span className="bg-[#f5b829]/20 px-4 py-1.5 rounded-full text-[10px] font-black text-[#f5b829] border border-[#f5b829]/30">MASTER</span>
                                        </div>
                                        <div className="flex flex-col items-center gap-1 mt-6">
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">JOIN CODE:</p>
                                            <div
                                                onClick={copyToClipboard}
                                                className="group relative cursor-pointer"
                                            >
                                                <div className="bg-white px-8 py-4 rounded-2xl flex items-center gap-4 shadow-xl active:scale-95 transition-all">
                                                    <p className="text-4xl font-black text-slate-900 tracking-[0.2em]">{myCluster.code}</p>
                                                    <div className={`p-2 rounded-lg ${copied ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'} transition-colors`}>
                                                        {copied ? (
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check"><path d="M20 6 9 17l-5-5" /></svg>
                                                        ) : (
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-copy-icon lucide-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>
                                                        )}
                                                    </div>
                                                </div>
                                                {copied && (
                                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[8px] font-black px-2 py-1 rounded-md animate-bounce">
                                                        COPIED!
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Members ({members.length})</p>
                                        <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                                            {members.map(m => (
                                                <div key={m.id} className="glass p-4 rounded-2xl flex items-center justify-between border-white/5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-lg">👤</div>
                                                        <p className="text-sm font-bold text-white">{m.name}</p>
                                                    </div>
                                                    <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${memberAttendance[m.id] === 'coming' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                                                        memberAttendance[m.id] === 'not_coming' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                                            'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                                                        }`}>
                                                        {memberAttendance[m.id] || 'WAITING'}
                                                    </span>
                                                </div>
                                            ))}
                                            {members.length === 0 && <p className="text-center py-8 text-slate-600 font-bold text-xs italic">No members joined yet. Share your code!</p>}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {!myCluster ? (
                                <div className="space-y-4">
                                    <p className="text-sm font-bold text-slate-400 text-center px-4 italic">Join your driver's cluster using their shared code to mark your attendance.</p>
                                    <input
                                        type="text"
                                        placeholder="ENTER CODE"
                                        maxLength={6}
                                        className={`w-full px-6 py-5 glass bg-white/5 border-white/10 rounded-2xl text-xl font-black text-center text-[#f5b829] focus:ring-2 focus:ring-[#f5b829]/50 outline-none transition-all placeholder:text-slate-700 tracking-[0.5em]`}
                                        value={clusterCode}
                                        onChange={(e) => setClusterCode(e.target.value.toUpperCase())}
                                    />
                                    <button
                                        onClick={joinCluster}
                                        disabled={loading || clusterCode.length < 6}
                                        className="w-full py-5 bg-[#f5b829] hover:bg-[#f5b829]/80 text-slate-800 text-[10px] font-black rounded-2xl uppercase tracking-[0.2em] shadow-2xl shadow-[#f5b829]/20 active:scale-95 transition-all disabled:opacity-50"
                                    >
                                        {loading ? t('cluster.processing') : 'JOIN CLUSTER'}
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="p-8 glass bg-[#f5b829]/10 border-[#f5b829]/20 rounded-[2.5rem] text-center">
                                        <p className="text-[10px] text-[#f5b829] font-bold uppercase tracking-widest mb-1">CONNECTED TO</p>
                                        <p className="text-2xl font-black text-white tracking-tight">{myCluster.name}</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            onClick={() => markAttendance('coming')}
                                            disabled={loading}
                                            className={`py-8 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 disabled:opacity-50 ${attendance === 'coming' ? 'bg-emerald-500 text-slate-900 shadow-[0_0_40px_rgba(16,185,129,0.3)]' : 'glass text-slate-400 border-white/5 hover:border-emerald-500/30'}`}
                                        >
                                            {loading && attendance !== 'coming' ? '...' : `✅ ${t('cluster.confirm')}`}
                                        </button>
                                        <button
                                            onClick={() => markAttendance('not_coming')}
                                            disabled={loading}
                                            className={`py-8 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 disabled:opacity-50 ${attendance === 'not_coming' ? 'bg-red-500 text-slate-900 shadow-[0_0_40px_rgba(239,68,68,0.3)]' : 'glass text-slate-400 border-white/5 hover:border-red-500/30'}`}
                                        >
                                            {loading && attendance !== 'not_coming' ? '...' : `❌ ${t('cluster.absent')}`}
                                        </button>
                                    </div>

                                    <button
                                        onClick={() => setMyCluster(null)}
                                        className="w-full text-[10px] font-black text-slate-600 hover:text-red-400 transition-colors uppercase tracking-widest"
                                    >
                                        Leave Cluster
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
