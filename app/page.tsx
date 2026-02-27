'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ClusterManager from './components/ClusterManager';
import ReportModal from './components/ReportModal';
import { useLanguage } from './context/LanguageContext';

const LIGHT_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#f8fafc" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#f8fafc" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#64748b" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#e2e8f0" }] },
];

declare global {
  interface Window {
    google: any;
  }
}

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const openMapFromQuery = searchParams.get('view') === 'app';
  const { t, language, setLanguage, isRTL } = useLanguage();
  const mapRef = useRef<any>(null);
  const vanMarkerRef = useRef<any>(null);
  const studentMarkerRef = useRef<any>(null);
  const directionsRendererRef = useRef<any>(null);
  const intervalRef = useRef<any>(null);
  const memberMarkersRef = useRef<{ [key: string]: any }>({});
  const myIdRef = useRef<string>('');

  // Refs for tracking
  const studentPosRef = useRef<{ lat: number; lng: number } | null>(null);
  const userRef = useRef<any>(null);
  const isBroadcastingRef = useRef(false);

  // UI State
  const [view, setView] = useState<'splash' | 'dashboard' | 'app'>('splash');
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [studentPos, setStudentPos] = useState<{ lat: number; lng: number } | null>(null);
  const [vans, setVans] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [memberEtas, setMemberEtas] = useState<{ [key: string]: string }>({});
  const [etaSeconds, setEtaSeconds] = useState<number | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [status, setStatus] = useState('Initializing Systems...');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [hasNotifiedArrival, setHasNotifiedArrival] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('tracker_user');

    if (!savedUser) {
      router.replace('/login');
      return;
    }

    let userData: any = null;
    try {
      userData = JSON.parse(savedUser);
    } catch {
      localStorage.removeItem('tracker_user');
      router.replace('/login');
      return;
    }

    setUser(userData);
    userRef.current = userData;
    myIdRef.current = userData.id;
    setAuthChecked(true);

    const shouldOpenMap =
      openMapFromQuery || sessionStorage.getItem('open_map_after_login') === '1';

    if (!shouldOpenMap) {
      router.replace('/profile');
      return;
    }

    if (shouldOpenMap) {
      sessionStorage.removeItem('open_map_after_login');
      setView('app');
      if (openMapFromQuery) {
        sessionStorage.setItem('open_map_after_login', '1');
        router.replace('/');
      }
    }

    // Geolocation Startup
    let watchId: number | null = null;
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setStudentPos(newPos);
          studentPosRef.current = newPos;
          setStatus('Live Tracking Ready');
        },
        () => setStatus('GPS Offline'),
        { enableHighAccuracy: true }
      );
    }

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [router, openMapFromQuery]);

  // Map Initialization
  useEffect(() => {
    if (view !== 'app' || !studentPos || mapRef.current || !window.google?.maps) return;

    mapRef.current = new window.google.maps.Map(document.getElementById('map'), {
      center: studentPos,
      zoom: 15,
      disableDefaultUI: true,
      styles: LIGHT_MAP_STYLE,
    });

    directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
      map: mapRef.current,
      suppressMarkers: true,
      polylineOptions: { strokeColor: '#2563EB', strokeWeight: 6, strokeOpacity: 0.8 }
    });

    startPolling();
  }, [studentPos, view]);

  const startPolling = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    const dms = new window.google.maps.DistanceMatrixService();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    intervalRef.current = setInterval(async () => {
      const pos = studentPosRef.current;
      if (!pos) return;

      try {
        // 1. Update own status if not guest
        if (userRef.current?.role === 'driver') {
          await fetch(`${apiUrl}/api/update-location`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ van_id: myIdRef.current, ...pos, isDriving: isBroadcastingRef.current })
          });
        } else if (userRef.current?.role === 'user') {
          await fetch(`${apiUrl}/api/update-member`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: myIdRef.current, ...pos, name: userRef.current.name })
          });
        }

        // 2. Fetch World State
        const res = await fetch(`${apiUrl}/api/vans`);
        const data = await res.json();
        const activeVansList = data.vans || [];
        const activeMembersList = (data.members || []).filter((m: any) => !m.arrived);

        setVans(activeVansList);
        setMembers(activeMembersList);

        if (view === 'app') {
          // Geofencing Check for Passenger
          if (userRef.current?.role === 'user' && activeVansList.length > 0) {
            const van = activeVansList[0];
            dms.getDistanceMatrix({
              origins: [{ lat: van.lat, lng: van.lng }],
              destinations: [pos],
              travelMode: 'DRIVING',
            }, async (response: any, status: string) => {
              if (status === 'OK') {
                const el = response.rows[0].elements[0];
                if (el.status === 'OK') {
                  const seconds = el.duration.value;
                  setEtaSeconds(seconds);

                  // AUTO-ARRIVAL (1 min)
                  if (seconds < 60 && !hasNotifiedArrival) {
                    await fetch(`${apiUrl}/api/update-member`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ id: myIdRef.current, ...pos, arrived: true })
                    });
                    setHasNotifiedArrival(true);
                    setStatus('Arrived - Welcome Aboard');
                  }
                }
              }
            });
          }

          // 3. Update Markers
          updateMapMarkers(activeVansList, activeMembersList);

          // 4. Calculate ETAs (for drivers to see all members)
          if (activeVansList.length > 0 && activeMembersList.length > 0 && userRef.current?.role === 'driver') {
            calculateETAs(dms, activeVansList[0], activeMembersList);
          }
        }

      } catch (err) {
        console.error("Poll error", err);
      }
    }, 4000);
  };

  const updateMapMarkers = (vansData: any[], membersData: any[]) => {
    if (!mapRef.current) return;
    // Van Marker
    if (vansData.length > 0) {
      const van = vansData[0];
      if (!vanMarkerRef.current) {
        vanMarkerRef.current = new window.google.maps.Marker({
          map: mapRef.current,
          icon: {
            path: 'M20,12H4V4H20V12M22,2H2V16H4V22H6V16H18V22H20V16H22V2M18,11H16V6H18V11M14,11H6V6H14V11Z',
            fillColor: van.isDriving ? '#10B981' : '#F59E0B',
            fillOpacity: 1,
            strokeWeight: 0,
            scale: 1.8,
            anchor: new window.google.maps.Point(12, 12)
          }
        });
      }
      vanMarkerRef.current.setPosition({ lat: van.lat, lng: van.lng });
    }

    // "You" Marker (if logged in)
    if (userRef.current?.role === 'user' && studentPosRef.current) {
      if (!studentMarkerRef.current) {
        studentMarkerRef.current = new window.google.maps.Marker({
          map: mapRef.current,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            fillColor: '#2563EB',
            fillOpacity: 1,
            strokeColor: '#FFF',
            strokeWeight: 4,
            scale: 10
          }
        });
      }
      studentMarkerRef.current.setPosition(studentPosRef.current);
    }
  };

  const calculateETAs = (dms: any, van: any, membersList: any[]) => {
    dms.getDistanceMatrix({
      origins: [{ lat: van.lat, lng: van.lng }],
      destinations: membersList.map(m => ({ lat: m.lat, lng: m.lng })),
      travelMode: 'DRIVING',
    }, (response: any, status: string) => {
      if (status === 'OK') {
        const etas: { [key: string]: string } = {};
        response.rows[0].elements.forEach((el: any, i: number) => {
          if (el.status === 'OK') {
            const member = membersList[i];
            etas[member.id] = el.duration.text;
            if (member.id === myIdRef.current) setEtaSeconds(el.duration.value);
          }
        });
        setMemberEtas(etas);
      }
    });
  };

  const logout = () => {
    localStorage.removeItem('tracker_user');
    localStorage.removeItem('token');
    sessionStorage.removeItem('open_map_after_login');
    router.replace('/login');
  };

  if (!authChecked) {
    return null;
  }

  if (view === 'splash') {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-white overflow-hidden">
        <div className="relative flex flex-col items-center">
          <div className="w-32 h-32 md:w-48 md:h-48 glass p-2 rounded-full border-slate-200 animate-pulse shadow-[0_0_80px_rgba(37,99,235,0.1)]">
            <img src="/logooo.jpeg" alt="Logo" className="w-full h-full object-contain rounded-full" />
          </div>
          <h1 className="mt-8 text-4xl md:text-6xl font-black tracking-tighter text-slate-900 animate-in slide-in-from-bottom-8 fade-in duration-1000">TRACKER</h1>
          <div className="mt-4 flex gap-1">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: `${i * 0.2}s` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (view === 'dashboard') {
    return (
      <div className="flex flex-col h-screen w-screen bg-white text-slate-800 overflow-y-auto p-6 md:p-12 font-[family-name:var(--font-geist-sans)]">
        <header className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <img src="/logooo.jpeg" alt="Logo" className="w-12 h-12 object-contain" />
            <h1 className="text-2xl font-black tracking-tighter text-slate-900">TRACKER</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
              className="glass px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-slate-200 text-slate-800"
            >
              {language === 'en' ? 'AR' : 'EN'}
            </button>
          </div>
        </header>

        <main className="max-w-6xl mx-auto w-full flex-1 flex flex-col justify-center">
          <div className="mb-12">
            <h2 className="text-4xl md:text-6xl font-black text-slate-900 mb-4 tracking-tighter">
              {t('common.welcome')}
            </h2>
            <p className="text-slate-500 font-bold max-w-xl text-lg">
              {t('main.discovery_desc')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Passenger Card */}
            <button
              onClick={() => setView('app')}
              className="group relative glass p-10 rounded-[3rem] border-slate-100 hover:border-blue-500/30 shadow-xl shadow-slate-200/50 transition-all duration-500 text-left overflow-hidden h-[400px] flex flex-col"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/5 blur-3xl rounded-full" />
              <div className="text-5xl mb-8 bg-blue-500/5 w-20 h-20 flex items-center justify-center rounded-3xl group-hover:scale-110 transition-transform">👤</div>
              <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">{t('auth.role_user')}</h3>
              <p className="text-slate-500 font-bold mb-auto">{t('main.discovery_desc')}</p>
              <div className="flex items-center gap-2 text-blue-600 font-black uppercase tracking-widest text-xs mt-8">
                {t('common.dashboard')} <span className="group-hover:translate-x-2 transition-transform">➔</span>
              </div>
            </button>

            {/* Driver Card */}
            <button
              onClick={() => window.location.href = '/login'}
              className="group relative glass p-10 rounded-[3rem] border-slate-100 hover:border-amber-500/30 shadow-xl shadow-slate-200/50 transition-all duration-500 text-left overflow-hidden h-[400px] flex flex-col"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/5 blur-3xl rounded-full" />
              <div className="text-5xl mb-8 bg-amber-500/5 w-20 h-20 flex items-center justify-center rounded-3xl group-hover:scale-110 transition-transform">🚐</div>
              <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">{t('auth.role_driver')}</h3>
              <p className="text-slate-500 font-bold mb-auto">{t('auth.subtitle_login')}</p>
              <div className="flex items-center gap-2 text-amber-600 font-black uppercase tracking-widest text-xs mt-8">
                {t('auth.btn_login')} <span className="group-hover:translate-x-2 transition-transform">➔</span>
              </div>
            </button>

            {/* Admin Card */}
            <button
              onClick={() => window.location.href = '/admin'}
              className="group relative glass p-10 rounded-[3rem] border-slate-100 hover:border-emerald-500/30 shadow-xl shadow-slate-200/50 transition-all duration-500 text-left overflow-hidden h-[400px] flex flex-col"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/5 blur-3xl rounded-full" />
              <div className="text-5xl mb-8 bg-emerald-500/5 w-20 h-20 flex items-center justify-center rounded-3xl group-hover:scale-110 transition-transform">🛡️</div>
              <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">{t('admin.control_center')}</h3>
              <p className="text-slate-500 font-bold mb-auto">{t('admin.systems_overview')}</p>
              <div className="flex items-center gap-2 text-emerald-600 font-black uppercase tracking-widest text-xs mt-8">
                {t('admin.manage_users')} <span className="group-hover:translate-x-2 transition-transform">➔</span>
              </div>
            </button>
          </div>
        </main>

        <footer className="mt-12 text-center text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
          Powered by Tracker Infrastructure • 2026
        </footer>
      </div>
    );
  }

  return (
    <div className={`flex h-screen w-screen bg-white text-slate-800 font-[family-name:var(--font-geist-sans)] overflow-hidden ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>

      {/* Proximity Alert Overlay */}
      {user?.role === 'user' && etaSeconds !== null && etaSeconds < 120 && etaSeconds >= 60 && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-md animate-in fade-in slide-in-from-top-4 duration-500">
          <div className={`glass p-6 rounded-[2rem] border-emerald-500/30 bg-emerald-500/10 backdrop-blur-xl shadow-[0_0_50px_rgba(16,185,129,0.2)] flex items-center gap-6 ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}>
            <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center text-3xl animate-pulse shadow-lg shadow-emerald-500/40">🚐</div>
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase text-emerald-500 tracking-[0.2em] mb-1">{t('reports.get_ready')}</p>
              <p className="text-lg font-black text-white leading-tight">{t('reports.nearly_here')}</p>
            </div>
            <button onClick={() => setEtaSeconds(null)} className="text-slate-500 hover:text-white transition-all">✕</button>
          </div>
        </div>
      )}
      {/* Sidebar Overlay (Mobile) */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className={`lg:hidden fixed top-6 ${isRTL ? 'right-6' : 'left-6'} z-50 glass p-5 rounded-3xl shadow-2xl active:scale-90 transition-all border-white/5`}
      >
        <span className="text-2xl">{isSidebarOpen ? '✕' : '📊'}</span>
      </button>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 ${isRTL ? 'right-0' : 'left-0'} z-40 w-[24rem] glass-card border-r-0 flex flex-col px-8 py-12 transition-transform duration-500 ease-in-out lg:relative lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : (isRTL ? 'translate-x-[100%]' : '-translate-x-full')}
      `}>
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-5">
            <div className="p-1 glass rounded-2xl shadow-xl border-white/10">
              <img src="/logooo.jpeg" alt="Logo" className="w-14 h-14 object-contain drop-shadow-lg rounded-xl" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tighter text-white">TRACKER</h1>
              <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${user?.role === 'driver' ? 'text-amber-500' : 'text-blue-500'}`}>
                {t(`auth.role_${user?.role || 'user'}`)} {t('main.session_type')}
              </span>
            </div>
          </div>
          <button onClick={() => setView('dashboard')} className="p-3 text-slate-500 hover:text-white transition-colors bg-white/5 rounded-2xl">
            <span className={`text-2xl ${isRTL ? 'rotate-180' : ''}`}>🏠</span>
          </button>
        </div>

        {/* Language Switcher in Sidebar */}
        <div className="mb-8">
          <div className="grid grid-cols-2 glass p-1 rounded-2xl border-white/5">
            <button
              onClick={() => setLanguage('en')}
              className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${language === 'en' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-white'}`}
            >
              English
            </button>
            <button
              onClick={() => setLanguage('ar')}
              className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${language === 'ar' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-white'}`}
            >
              العربية
            </button>
          </div>
        </div>

        {/* Dynamic Role Content */}
        <div className="flex-1 overflow-y-auto space-y-8 pr-1 custom-scrollbar">
          {user?.role === 'guest' ? (
            <div className="space-y-6">
              <div className="glass p-8 rounded-[2.5rem] border-white/5">
                <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-4">Discovery</p>
                <h2 className="text-xl font-black text-white mb-2">{t('main.available_vehicles')}</h2>
                <p className="text-xs text-slate-500 font-bold leading-relaxed mb-6">{t('main.discovery_desc')}</p>

                <div className="space-y-3">
                  {vans.map(v => (
                    <div key={v.id} className="glass p-5 rounded-2xl flex items-center justify-between group border-white/5 hover:border-amber-500/30 transition-all">
                      <div className="flex items-center gap-4">
                        <span className="text-2xl bg-amber-500/10 p-3 rounded-xl">🚌</span>
                        <div>
                          <p className="text-sm font-black text-white">Fleet {v.id.slice(0, 3)}</p>
                          <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">
                            • {v.isDriving ? t('main.operational') : t('main.resting')}
                          </p>
                        </div>
                      </div>
                      <span className={`text-slate-600 group-hover:text-amber-500 transition-colors ${isRTL ? 'rotate-180' : ''}`}>➔</span>
                    </div>
                  ))}
                  {vans.length === 0 && <p className="text-[10px] font-black text-slate-600 text-center uppercase tracking-widest p-10">{t('common.offline')}</p>}
                </div>
              </div>
              <button
                onClick={() => window.location.href = '/login'}
                className="w-full py-6 glass bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 font-black rounded-3xl transition-all border-blue-500/20 uppercase tracking-widest text-xs"
              >
                {t('main.full_access_cta')}
              </button>
            </div>
          ) : (
            <>
              {/* Active Tracking Card */}
              <div className={`glass-card p-8 rounded-[3rem] border-white/5 relative overflow-hidden group transition-all duration-500 ${etaSeconds !== null && etaSeconds < 120 ? 'border-emerald-500/30 shadow-[0_0_40px_rgba(16,185,129,0.1)]' : ''}`}>
                <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl -translate-y-1/2 translate-x-1/2 ${etaSeconds !== null && etaSeconds < 120 ? 'bg-emerald-500/20' : 'bg-blue-500/10'}`} />
                <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-4">{t('main.arrival_status')}</p>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className={`text-6xl font-black tracking-tighter tabular-nums transition-colors ${etaSeconds !== null && etaSeconds < 120 ? 'text-emerald-500' : 'text-white'}`}>
                    {etaSeconds === null ? '--' : Math.ceil(etaSeconds / 60)}
                  </span>
                  <span className={`text-xl font-black uppercase tracking-widest transition-colors ${etaSeconds !== null && etaSeconds < 120 ? 'text-emerald-500' : 'text-blue-500'}`}>{t('main.min')}</span>
                </div>
                <p className="text-xs font-bold text-slate-400">
                  {user?.role === 'driver' ? t('main.pickup_desc') : t('main.distance_desc')}
                </p>
              </div>

              {/* Members/Waiting List */}
              <div className="space-y-5">
                <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest ml-4">{t('main.waiting_near')}</p>
                <div className="space-y-3">
                  {members.map(m => (
                    <div key={m.id} className="glass p-5 rounded-[2rem] flex items-center gap-4 border-white/5 hover:border-blue-500/20 transition-all">
                      <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-2xl font-black overflow-hidden relative group">
                        <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                        👤
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-black text-slate-900">{m.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{memberEtas[m.id] || t('common.loading')}</p>
                      </div>
                      <div className={`w-3 h-3 rounded-full ${memberEtas[m.id] ? 'bg-emerald-500 animate-pulse' : 'bg-slate-700'}`} />
                    </div>
                  ))}
                  {members.length === 0 && <p className="text-center py-10 text-slate-600 font-bold text-xs italic glass rounded-3xl border-dashed border-white/5">{t('main.scanning')}</p>}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Controls */}
        <div className="mt-10 space-y-4">
          {user?.role === 'driver' && (
            <button
              onClick={() => {
                setIsBroadcasting(!isBroadcasting);
                isBroadcastingRef.current = !isBroadcasting;
              }}
              className={`w-full py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] transition-all shadow-2xl active:scale-95 ${isBroadcasting ? 'bg-red-500/10 border border-red-500/50 text-red-500' : 'bg-emerald-600 shadow-emerald-500/20 text-white'}`}
            >
              {isBroadcasting ? t('main.stop_session') : t('main.start_session')}
            </button>
          )}
          <div className="flex gap-4">
            <button
              onClick={() => router.push('/profile')}
              className="flex-1 py-5 glass rounded-[2rem] font-bold text-[10px] uppercase tracking-widest text-slate-400 hover:text-white transition-all border-white/5"
            >
              {t('common.profile')}
            </button>
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="flex-1 py-5 glass rounded-[2rem] font-bold text-[10px] uppercase tracking-widest text-slate-400 hover:text-white transition-all border-white/5"
            >
              {t('common.support')}
            </button>
            <button
              onClick={logout}
              className="flex-1 py-5 glass rounded-[2rem] font-bold text-[10px] uppercase tracking-widest text-slate-400 hover:text-white transition-all border-white/5"
            >
              {t('common.logout')}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Map Container */}
      <main className="flex-1 relative p-2 md:p-6 bg-slate-50">
        <div id="map" className="w-full h-full rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/5 overflow-hidden" />

        {/* Map Overlays */}
        <div className={`absolute top-10 ${isRTL ? 'left-10' : 'right-10'} z-10 flex flex-col gap-3`}>
          <button
            onClick={() => mapRef.current?.setCenter(studentPos)}
            className="p-5 glass rounded-2xl shadow-2xl text-white hover:bg-white/10 transition-all border-white/10"
          >
            🎯
          </button>
          <button
            onClick={() => setView('dashboard')}
            className="lg:hidden p-5 glass rounded-2xl shadow-2xl text-white hover:bg-white/10 transition-all border-white/10"
          >
            🏠
          </button>
        </div>

        {status && (
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10">
            <div className="glass px-6 py-3 rounded-2xl border-white/5 shadow-2xl flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{status}</span>
            </div>
          </div>
        )}
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { 
          background: rgba(255, 255, 255, 0.05); 
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.1); }
      `}</style>
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        user={user}
      />
    </div>
  );
}
