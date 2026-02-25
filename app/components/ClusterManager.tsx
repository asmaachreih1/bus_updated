'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
    const router = useRouter();
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

    const handleSubscribe = async (packageType: string) => {
        setLoading(true);
        try {
            const res = await fetch(`${apiUrl}/api/stripe/create-checkout-session`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ packageType, userId: user.id })
            });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                alert(data.error || 'Payment failed to initialize');
            }
        } catch (e) {
            alert('Payment connection error');
        } finally {
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-100/40 backdrop-blur-xl">
            <div className={`w-full max-w-lg bg-white/95 rounded-[2.5rem] sm:rounded-[3rem] p-6 sm:p-10 border border-slate-200/50 relative overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.1)] ${isRTL ? 'text-right' : 'text-left'}`}>
                <div className={`absolute top-0 ${isRTL ? 'left-0' : 'right-0'} w-40 h-40 bg-[#f5b829]/5 blur-3xl`} />

                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h3 className="text-2xl font-black text-[#274162] tracking-tighter uppercase">{user.role === 'driver' ? t('cluster.ops') : t('cluster.boarding_status')}</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{user.role === 'driver' ? 'Fleet Management' : 'Mark your arrival'}</p>
                    </div>
                    <button type="button" onClick={onClose} className="p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl text-slate-400 hover:text-[#274162] transition-all cursor-pointer relative z-50">✕</button>
                </div>

                <div className="space-y-6 relative z-10">
                    {user.role === 'driver' ? (
                        <div className="space-y-6">
                            {!myCluster ? (
                                <div className="space-y-4">
                                    <input
                                        type="text"
                                        placeholder={t('cluster.name_placeholder')}
                                        className={`w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-[#f5b829]/30 focus:bg-white outline-none transition-all placeholder:text-slate-400 ${isRTL ? 'text-right' : 'text-left'}`}
                                        value={newClusterName}
                                        onChange={(e) => setNewClusterName(e.target.value)}
                                    />
                                    <button
                                        onClick={createCluster}
                                        disabled={loading}
                                        className="w-full py-5 bg-[#f5b829] hover:bg-[#f5b829]/90 text-slate-800 text-[10px] font-black rounded-2xl uppercase tracking-[0.2em] shadow-xl shadow-[#f5b829]/20 active:scale-95 transition-all disabled:opacity-50"
                                    >
                                        {loading ? t('cluster.processing') : t('cluster.establish')}
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    {/* Header Info */}
                                    <div className="text-center space-y-2">
                                        <p className="text-[10px] font-black text-[#f5b829] uppercase tracking-[0.3em]">ACTIVE CLUSTER</p>
                                        <h2 className="text-3xl font-black text-[#274162] tracking-tight">{myCluster.name}</h2>
                                    </div>

                                    {/* Members List */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between px-2">
                                            <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">Joined Members</p>
                                            <div className="bg-[#f5b829]/10 px-3 py-1 rounded-full border border-[#f5b829]/20">
                                                <p className="text-[10px] font-black text-[#f5b829]">{members.length} Active</p>
                                            </div>
                                        </div>

                                        <div className="max-h-60 overflow-y-auto space-y-3 pr-2 scrollbar-style text-left">
                                            {members.map(m => (
                                                <div key={m.id} className="bg-slate-50 p-4 rounded-[1.5rem] flex items-center justify-between border border-slate-100 hover:border-[#f5b829]/20 transition-all group">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-xl font-black text-[#274162] shadow-sm border border-slate-100">
                                                            {m.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-800">{m.name}</p>
                                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em] mt-0.5">
                                                                {memberEtas?.[m.id] ? `ETA: ${memberEtas[m.id]}` : 'Calculating location...'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest ${memberAttendance[m.id] === 'coming' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                                        memberAttendance[m.id] === 'not_coming' ? 'bg-red-50 text-red-600 border border-red-100' :
                                                            'bg-slate-100 text-slate-500 border border-slate-200'
                                                        }`}>
                                                        {memberAttendance[m.id] || 'WAITING'}
                                                    </div>
                                                </div>
                                            ))}
                                            {members.length === 0 && (
                                                <div className="text-center py-12 px-6 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
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
                                    className={`w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-2xl text-xl font-black text-center text-[#274162] focus:ring-2 focus:ring-[#f5b829]/30 outline-none transition-all placeholder:text-slate-300 tracking-[0.5em]`}
                                    value={clusterCode}
                                    onChange={(e) => setClusterCode(e.target.value.toUpperCase())}
                                />
                                <button
                                    onClick={joinCluster}
                                    disabled={loading || clusterCode.length < 6}
                                    className="w-full py-5 bg-[#f5b829] hover:bg-[#f5b829]/90 text-slate-800 text-[10px] font-black rounded-2xl uppercase tracking-[0.2em] shadow-xl shadow-[#f5b829]/20 active:scale-95 transition-all disabled:opacity-50"
                                >
                                    {loading ? t('cluster.processing') : 'JOIN CLUSTER'}
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="p-6 sm:p-8 bg-[#f5b829]/5 border border-[#f5b829]/20 rounded-[2.5rem] relative text-center">
                                    <div className="absolute top-4 right-4 bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-full text-[10px] font-black border border-emerald-100 shadow-sm">
                                        {Object.values(memberAttendance).filter(v => v === 'coming').length} / {myCluster.capacity || 12}
                                    </div>
                                    <p className="text-[10px] text-[#274162]/60 font-bold uppercase tracking-widest mb-1 mt-4">CONNECTED TO</p>
                                    <p className="text-xl sm:text-2xl font-black text-[#274162] tracking-tight">{myCluster.name}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => markAttendance('coming')}
                                        disabled={loading}
                                        className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 ${attendance === 'coming' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-50 text-slate-400 border border-slate-200 hover:border-emerald-500/30 hover:text-emerald-500'}`}
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
                                        className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 ${attendance === 'not_coming' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-slate-50 text-slate-400 border border-slate-200 hover:border-red-500/30 hover:text-red-500'}`}
                                    >
                                        {loading && attendance !== 'not_coming' ? '...' : (
                                            <>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x-icon lucide-x"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                                                <span>{t('cluster.absent')}</span>
                                            </>
                                        )}
                                    </button>
                                </div>

                                {/* Subscription Section */}
                                <div className="space-y-4 pt-4 border-t border-slate-100">
                                    <div className="flex items-center justify-between px-2">
                                        <p className="text-[10px] font-black text-[#274162]/60 uppercase tracking-[0.2em]">Premium Access</p>
                                        {!user.isSubscribed && (
                                            <span className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full text-[8px] font-black uppercase tracking-widest border border-amber-100">LOCKED</span>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                                        {[
                                            { type: 'daily', price: '$5', label: 'Day' },
                                            { type: 'weekly', price: '$25', label: 'Week' },
                                            { type: 'monthly', price: '$80', label: 'Month' }
                                        ].map((pkg) => (
                                            <button
                                                key={pkg.type}
                                                onClick={() => handleSubscribe(pkg.type)}
                                                disabled={loading}
                                                className="bg-slate-50 p-3 sm:p-4 rounded-xl sm:rounded-2xl hover:bg-[#f5b829]/10 border border-slate-100 hover:border-[#f5b829]/30 transition-all group flex flex-col items-center gap-1"
                                            >
                                                <p className="text-[8px] sm:text-[9px] font-black text-slate-400 group-hover:text-[#f5b829] uppercase tracking-widest transition-colors">{pkg.label}</p>
                                                <p className="text-base sm:text-lg font-black text-[#274162] group-hover:text-slate-900">{pkg.price}</p>
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-[9px] text-center text-slate-400 font-bold uppercase tracking-widest">Upgrade to keep your seat reserved and support the fleet.</p>
                                </div>

                                {etaSeconds !== null && etaSeconds !== undefined && (
                                    <div className="bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100 flex items-center justify-between shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-xl shadow-sm border border-emerald-100">🚐</div>
                                            <div>
                                                <p className="text-[10px] font-black text-emerald-600/60 uppercase tracking-widest leading-none mb-1">Bus arriving in</p>
                                                <p className="text-xl font-black text-emerald-600"><span className="text-3xl">{Math.ceil(etaSeconds / 60)}</span> min</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-3">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Other Members ({members.filter(m => m.id !== user.id).length})</p>
                                    <div className="max-h-40 overflow-y-auto space-y-2 pr-2 scrollbar-style">
                                        {members.filter(m => m.id !== user.id).map(m => (
                                            <div key={m.id} className="bg-slate-50 p-3 rounded-2xl flex items-center justify-between border border-slate-100 hover:border-[#f5b829]/20 transition-all">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-sm shadow-sm border border-slate-100 font-black text-[#274162]">{m.name.charAt(0).toUpperCase()}</div>
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-800">{m.name}</p>
                                                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{memberEtas?.[m.id] ? `ETA: ${memberEtas[m.id]}` : 'Tracking...'}</p>
                                                    </div>
                                                </div>
                                                <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${memberAttendance[m.id] === 'coming' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                                    memberAttendance[m.id] === 'not_coming' ? 'bg-red-50 text-red-600 border border-red-100' :
                                                        'bg-slate-100 text-slate-500 border border-slate-200'
                                                    }`}>
                                                    {memberAttendance[m.id] || 'WAITING'}
                                                </span>
                                            </div>
                                        ))}
                                        {members.length <= 1 && <p className="text-center py-4 text-slate-400 font-bold text-[10px] italic">You are the only member right now.</p>}
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

            <style jsx>{`
                .scrollbar-style::-webkit-scrollbar { width: 4px; }
                .scrollbar-style::-webkit-scrollbar-track { background: transparent; }
                .scrollbar-style::-webkit-scrollbar-thumb { 
                    background: rgba(0, 0, 0, 0.05); 
                    border-radius: 10px;
                }
                .scrollbar-style::-webkit-scrollbar-thumb:hover { background: rgba(0, 0, 0, 0.1); }
            `}</style>
        </div>
    );
}
