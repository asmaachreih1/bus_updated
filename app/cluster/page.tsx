'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';

function getInitials(name: string) {
    const parts = name?.trim().split(/\s+/) || [];
    if (parts.length === 1) return parts[0][0]?.toUpperCase() || '?';
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function ClusterPageInner() {
    const router = useRouter();
    const params = useSearchParams();
    const code = params.get('code');

    const [cluster, setCluster] = useState<any>(null);
    const [members, setMembers] = useState<any[]>([]);
    const [driver, setDriver] = useState<any>(null);
    const [etas, setEtas] = useState<{ [id: string]: string }>({});
    const [loading, setLoading] = useState(true);
    const intervalRef = useRef<any>(null);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    const computeEtas = (driverLoc: any, memberLocs: any[]) => {
        if (!window.google?.maps || !driverLoc || memberLocs.length === 0) return;
        const dms = new window.google.maps.DistanceMatrixService();
        dms.getDistanceMatrix({
            origins: [{ lat: driverLoc.lat, lng: driverLoc.lng }],
            destinations: memberLocs.map((m: any) => ({ lat: m.lat, lng: m.lng })),
            travelMode: 'DRIVING',
        }, (response: any, status: string) => {
            if (status !== 'OK') return;
            const newEtas: { [id: string]: string } = {};
            response.rows[0].elements.forEach((el: any, i: number) => {
                if (el.status === 'OK') {
                    newEtas[memberLocs[i].id] = el.duration.text;
                }
            });
            setEtas(newEtas);
        });
    };

    const fetchData = async () => {
        if (!code) return;
        try {
            // Get all vans (drivers) and members
            const vansRes = await fetch(`${apiUrl}/api/vans`);
            const vansData = await vansRes.json();

            // Find cluster by code
            const clusterRes = await fetch(`${apiUrl}/api/clusters/driver/driver_1`); // fallback
            // We'll use /api/vans data for locations and construct from known cluster code

            // Get cluster info from member endpoint using a known user, or use public cluster search
            // Fetch cluster info for the code — we'll call the driver endpoint and match
            // Instead, let's call a public route to get cluster by code
            const allRes = await fetch(`${apiUrl}/api/clusters/code/${code}`);
            if (allRes.ok) {
                const allData = await allRes.json();
                if (allData.cluster) {
                    setCluster(allData.cluster);

                    // Get driver location
                    const driverLoc = vansData.vans?.find((v: any) => v.id === allData.cluster.driverId);
                    setDriver(driverLoc);

                    // Get member locations
                    const memberLocs = vansData.members?.filter((m: any) =>
                        allData.cluster.members?.includes(m.id)
                    ) || [];
                    setMembers(memberLocs);

                    if (driverLoc) computeEtas(driverLoc, memberLocs);
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        intervalRef.current = setInterval(fetchData, 8000);
        return () => clearInterval(intervalRef.current);
    }, [code]);

    if (loading) return (
        <div className="min-h-screen mesh-gradient flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-[#f5b829]/30 border-t-[#f5b829] rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen mesh-gradient p-6 font-[family-name:var(--font-geist-sans)]">
            <div className="max-w-lg mx-auto space-y-4 pt-4">

                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-xs font-black uppercase tracking-widest mb-2"
                >
                    ← Back
                </button>

                {/* Header */}
                <div className="glass-card rounded-[2.5rem] p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-[#f5b829]/10 blur-[80px]" />
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Cluster</p>
                    <h1 className="text-3xl font-black text-white tracking-tight">{cluster?.name || code}</h1>
                    <div className="flex items-center gap-3 mt-3">
                        <span className="text-[10px] font-black bg-[#f5b829]/20 text-[#f5b829] px-3 py-1 rounded-full border border-[#f5b829]/30 uppercase tracking-widest">
                            {cluster?.code}
                        </span>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            {members.length} member{members.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                    {driver && (
                        <div className="mt-4 flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${driver.isDriving ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
                            <span className="text-xs font-bold text-slate-400">Driver is {driver.isDriving ? 'on the way' : 'parked'}</span>
                        </div>
                    )}
                </div>

                {/* Members list */}
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Members</p>

                {members.length === 0 ? (
                    <div className="glass rounded-[2rem] p-10 text-center">
                        <p className="text-slate-500 font-bold text-sm">No members have shared their location yet</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {members.map((m, i) => {
                            const eta = etas[m.id];
                            const photo = typeof window !== 'undefined'
                                ? localStorage.getItem(`profile_photo_${m.id}`)
                                : null;
                            return (
                                <div key={m.id || i} className="glass rounded-[2rem] px-6 py-5 flex items-center gap-4">
                                    {/* Avatar */}
                                    <div className="w-12 h-12 rounded-[1rem] bg-[#f5b829]/15 flex items-center justify-center shrink-0 overflow-hidden">
                                        {photo ? (
                                            <img src={photo} className="w-full h-full object-cover" alt={m.name} />
                                        ) : (
                                            <span className="text-sm font-black text-[#f5b829]">{getInitials(m.name || '?')}</span>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-black text-white">{m.name || 'Unknown'}</p>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                            {m.arrived ? '✅ Arrived' : 'En route'}
                                        </p>
                                    </div>

                                    {/* ETA */}
                                    <div className="text-right shrink-0">
                                        {eta ? (
                                            <>
                                                <p className="text-lg font-black text-[#f5b829] leading-none">{eta}</p>
                                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">away</p>
                                            </>
                                        ) : (
                                            <p className="text-xs font-bold text-slate-600">—</p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Live update indicator */}
                <div className="flex items-center justify-center gap-2 pt-2 pb-6">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Live — updates every 8s</span>
                </div>
            </div>
        </div>
    );
}

export default function ClusterPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen mesh-gradient flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-[#f5b829]/30 border-t-[#f5b829] rounded-full animate-spin" />
            </div>
        }>
            <ClusterPageInner />
        </Suspense>
    );
}
