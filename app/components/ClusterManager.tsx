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
    capacity?: number;
}

interface ClusterManagerProps {
    user: any;
    isOpen: boolean;
    onClose: () => void;
    etaSeconds?: number | null;
    memberEtas?: { [key: string]: string };
    onClusterJoin?: (driverId: string) => void;
}

export default function ClusterManager({ user, isOpen, onClose, etaSeconds, memberEtas, onClusterJoin }: ClusterManagerProps) {
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
                    setMembers(data.members || []);
                    fetchClusterAttendance(data.cluster._id);
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
                if (onClusterJoin) onClusterJoin(data.cluster.driverId);
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
                // Persist cluster code to tracker_user in localStorage
                const savedUser = localStorage.getItem('tracker_user');
                if (savedUser) {
                    const userData = JSON.parse(savedUser);
                    userData.clusterCode = data.cluster.code;
                    localStorage.setItem('tracker_user', JSON.stringify(userData));
                    // Update user state if needed, but since this is a separate component, 
                    // the page will need to reload or listen for storage events to update Profile tab.
                    window.dispatchEvent(new Event('storage'));
                }
                alert('Cluster Created!');
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
            if (myCluster) fetchClusterAttendance(myCluster._id);
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
                                <div className="space-y-8">
                                    {/* Header Info */}
                                    <div className="text-center space-y-2">
                                        <p className="text-[10px] font-black text-[#f5b829] uppercase tracking-[0.3em]">ACTIVE CLUSTER</p>
                                        <h2 className="text-3xl font-black text-white tracking-tight">{myCluster.name}</h2>
                                    </div>

                                    {/* Members List */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between px-2">
                                            <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">Joined Members</p>
                                            <div className="bg-[#f5b829]/10 px-3 py-1 rounded-full border border-[#f5b829]/20">
                                                <p className="text-[10px] font-black text-[#f5b829]">{members.length} Active</p>
                                            </div>
                                        </div>

                                        <div className="max-h-60 overflow-y-auto space-y-3 pr-2 scrollbar-hide text-left">
                                            {members.map(m => (
                                                <div key={m.id} className="bg-white/5 backdrop-blur-md p-4 rounded-[1.5rem] flex items-center justify-between border border-white/5 hover:bg-white/10 transition-colors">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-xl shadow-inner">
                                                            {m.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-white">{m.name}</p>
                                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em] mt-0.5">
                                                                {memberEtas?.[m.id] ? `ETA: ${memberEtas[m.id]}` : 'Calculating location...'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest ${memberAttendance[m.id] === 'coming' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]' :
                                                        memberAttendance[m.id] === 'not_coming' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                                            'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                                                        }`}>
                                                        {memberAttendance[m.id] || 'WAITING'}
                                                    </div>
                                                </div>
                                            ))}
                                            {members.length === 0 && (
                                                <div className="text-center py-12 px-6 bg-white/5 rounded-[2rem] border border-dashed border-white/10">
                                                    <p className="text-slate-500 font-bold text-xs italic">No members have joined your cluster yet.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (<div className="space-y-6">
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
                                <div className="p-8 glass bg-[#f5b829]/10 border-[#f5b829]/20 rounded-[2.5rem] relative text-center">
                                    <div className="absolute top-4 right-4 bg-emerald-500/20 px-3 py-1.5 rounded-full text-[10px] font-black text-emerald-400 border border-emerald-500/30 shadow-lg">
                                        {Object.values(memberAttendance).filter(v => v === 'coming').length} / {myCluster.capacity || 12}
                                    </div>
                                    <p className="text-[10px] text-[#f5b829] font-bold uppercase tracking-widest mb-1 mt-4">CONNECTED TO</p>
                                    <p className="text-2xl font-black text-white tracking-tight">{myCluster.name}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => markAttendance('coming')}
                                        disabled={loading}
                                        className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 ${attendance === 'coming' ? 'bg-emerald-500 text-slate-900 shadow-[0_0_40px_rgba(16,185,129,0.3)]' : 'glass text-slate-400 border-white/5 hover:border-emerald-500/30'}`}
                                    >
                                        {loading && attendance !== 'coming' ? '...' : (
                                            <>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check-icon lucide-check"><path d="M20 6 9 17l-5-5" /></svg>
                                                <span>{t('cluster.confirm')}</span>
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => markAttendance('not_coming')}
                                        disabled={loading}
                                        className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 ${attendance === 'not_coming' ? 'bg-red-500 text-slate-900 shadow-[0_0_40px_rgba(239,68,68,0.3)]' : 'glass text-slate-400 border-white/5 hover:border-red-500/30'}`}
                                    >
                                        {loading && attendance !== 'not_coming' ? '...' : (
                                            <>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x-icon lucide-x"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                                                <span>{t('cluster.absent')}</span>
                                            </>
                                        )}
                                    </button>
                                </div>

                                {etaSeconds !== null && etaSeconds !== undefined && (
                                    <div className="glass p-6 rounded-[2rem] border-emerald-500/30 flex items-center justify-between shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center text-xl">🚐</div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Bus arriving in</p>
                                                <p className="text-xl font-black text-emerald-400"><span className="text-3xl">{Math.ceil(etaSeconds / 60)}</span> min</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-3">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Other Members ({members.filter(m => m.id !== user.id).length})</p>
                                    <div className="max-h-40 overflow-y-auto space-y-2 pr-2">
                                        {members.filter(m => m.id !== user.id).map(m => (
                                            <div key={m.id} className="glass p-3 rounded-2xl flex items-center justify-between border-white/5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-white/5 rounded-xl flex items-center justify-center text-sm">👤</div>
                                                    <div>
                                                        <p className="text-xs font-bold text-white">{m.name}</p>
                                                        <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">{memberEtas?.[m.id] ? `ETA: ${memberEtas[m.id]}` : 'Tracking...'}</p>
                                                    </div>
                                                </div>
                                                <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${memberAttendance[m.id] === 'coming' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                                                    memberAttendance[m.id] === 'not_coming' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                                        'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                                                    }`}>
                                                    {memberAttendance[m.id] || 'WAITING'}
                                                </span>
                                            </div>
                                        ))}
                                        {members.length <= 1 && <p className="text-center py-4 text-slate-500 font-bold text-[10px] italic">You are the only member right now.</p>}
                                    </div>
                                </div>

                                <button
                                    onClick={() => setMyCluster(null)}
                                    className="w-full pt-4 text-[10px] font-black text-slate-600 hover:text-red-400 transition-colors uppercase tracking-widest"
                                >
                                    Leave Cluster
                                </button>
                            </>
                        )}
                    </div>
                    )}
                </div>
            </div >
        </div >
    );
}
