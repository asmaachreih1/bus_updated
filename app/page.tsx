'use client';

import { useEffect, useRef, useState } from 'react';
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
  const [isClusterManagerOpen, setIsClusterManagerOpen] = useState(false);
  const [hasNotifiedArrival, setHasNotifiedArrival] = useState(false);
  const [selectedVanId, setSelectedVanId] = useState<string | null>(null);
  const selectedVanIdRef = useRef<string | null>(null);
  const [discoveryEtas, setDiscoveryEtas] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    selectedVanIdRef.current = selectedVanId;
  }, [selectedVanId]);

  const handleSelectVan = async (vanId: string | null) => {
    setSelectedVanId(vanId);
    setEtaSeconds(null);
    if (!userRef.current) return;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    try {
      await fetch(`${apiUrl}/api/select-van`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: myIdRef.current, vanId })
      });
      if (vanId && studentPosRef.current) {
        await fetch(`${apiUrl}/api/update-member`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: myIdRef.current, ...studentPosRef.current, name: userRef.current.name, selectedVanId: vanId })
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    // Auth Check
    const savedUser = localStorage.getItem('tracker_user');
    let skipLanding = false;

    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      userRef.current = userData;
      myIdRef.current = userData.id;

      if (userData.role === 'admin') {
        window.location.href = '/admin';
        return;
      } else if (userData.role === 'user' || userData.role === 'driver') {
        setView('app');
        skipLanding = true;
        if (userData.role === 'driver') {
          setIsBroadcasting(true);
          isBroadcastingRef.current = true;
        }
      }
    } else {
      setUser({ role: 'guest', name: 'Guest Explorer' });
    }

    let timer: any;
    if (!skipLanding) {
      timer = setTimeout(() => {
        setView('dashboard');
      }, 2500);
    }

    // Geolocation Startup
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
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

    return () => { if (timer) clearTimeout(timer); };
  }, []);

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

        let filteredMembers = activeMembersList;
        if (userRef.current?.role === 'driver') {
          filteredMembers = activeMembersList.filter((m: any) => m.selectedVanId === myIdRef.current);
        }
        setMembers(filteredMembers);

        if (view === 'app') {
          // Geofencing Check for Passenger
          if (userRef.current?.role === 'user' && activeVansList.length > 0) {
            const selectedVan = activeVansList.find((v: any) => v.id === selectedVanIdRef.current);
            if (!selectedVan) {
              // Discovery Mode: Calculate ETAs to all vans
              dms.getDistanceMatrix({
                origins: activeVansList.map((v: any) => ({ lat: v.lat, lng: v.lng })),
                destinations: [pos],
                travelMode: 'DRIVING',
              }, (response: any, status: string) => {
                if (status === 'OK') {
                  const newDiscoveryEtas: { [key: string]: string } = {};
                  response.rows.forEach((row: any, i: number) => {
                    const el = row.elements[0];
                    if (el.status === 'OK') {
                      newDiscoveryEtas[activeVansList[i].id] = el.duration.text;
                    }
                  });
                  setDiscoveryEtas(newDiscoveryEtas);
                }
              });
            } else {
              // Active Tracking Mode
              dms.getDistanceMatrix({
                origins: [{ lat: selectedVan.lat, lng: selectedVan.lng }],
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
          }

          // 3. Update Markers
          updateMapMarkers(activeVansList, filteredMembers);

          // 4. Calculate ETAs (for drivers to see all assigned members)
          if (activeVansList.length > 0 && filteredMembers.length > 0 && userRef.current?.role === 'driver') {
            calculateETAs(dms, activeVansList[0], filteredMembers);
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
    window.location.href = '/login';
  };

  if (view === 'splash') {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-white overflow-hidden">
        <div className="relative flex flex-col items-center">
          <div className="relative w-64 h-64 animate-pulse mb-4 flex items-center justify-center">
            <img src="/logooo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="mt-8 text-5xl md:text-7xl font-black tracking-tighter text-slate-900 animate-in slide-in-from-bottom-8 fade-in duration-1000">
            TRACKER
          </h1>
          <div className="mt-6 flex gap-2">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-3 h-3 rounded-full bg-[#f5b829] animate-bounce" style={{ animationDelay: `${i * 0.2}s` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (view === 'dashboard') {
    return (
      <div className="flex flex-col min-h-screen w-full bg-white text-slate-800 font-[family-name:var(--font-geist-sans)]">
        {/* Navigation */}
        <nav className="flex items-center justify-between px-6 py-4 md:px-12 md:py-6 sticky top-0 bg-white/80 backdrop-blur-md z-50 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <img src="/logooo.png" alt="Logo" className="w-14 h-14 object-contain" />
            <h1 className="text-xl font-black tracking-tighter text-slate-900">TRACKER</h1>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden md:flex gap-8 text-sm font-bold text-slate-500 uppercase tracking-widest">
              <a href="#" className="hover:text-[#f5b829] transition-colors">Dashboard</a>
              <a href="#" className="hover:text-[#f5b829] transition-colors">Analytics</a>
              <a href="#" className="hover:text-[#f5b829] transition-colors">Settings</a>
            </div>
            <button
              onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-colors"
            >
              {language === 'en' ? 'AR' : 'EN'}
            </button>
            {(!user || user.role === 'guest') && (
              <button
                onClick={() => window.location.href = '/login'}
                className="hidden md:block px-6 py-2 bg-white border border-slate-200 text-slate-800 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-slate-50 transition-all shadow-lg shadow-[#f5b829]/50"
              >
                Sign In
              </button>
            )}
          </div>
        </nav>

        <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12 md:py-20 flex flex-col items-center text-center">
          {/* Hero Section */}
          <div className="flex flex-col items-center max-w-4xl mb-16">
            <div className={`inline-flex items-center gap-2 px-4 py-2 bg-[#f5b829]/10 text-[#f5b829] rounded-full text-[10px] font-black uppercase tracking-widest mb-8 border border-[#f5b829]/20 shadow-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
              <span className="w-2 h-2 rounded-full bg-[#f5b829] animate-pulse" />
              Lebanon's Transport Network
            </div>

            <h2 className="text-5xl md:text-8xl font-black text-slate-900 mb-8 tracking-tighter leading-[0.9]">
              Track Your Ride <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#f5b829] to-[#f5b829]">in Real Time</span>
            </h2>

            <p className="text-slate-500 font-bold text-lg md:text-xl max-w-2xl mb-12 leading-relaxed">
              Connect with drivers and passengers across Lebanon. Real-time vehicle tracking, cluster management, and attendance coordination — all in one platform.
            </p>

            <div className={`flex flex-col sm:flex-row gap-4 w-full sm:w-auto ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
              <button
                onClick={() => window.location.href = '/login?role=driver'}
                className="px-10 py-5 bg-[#f5b829] text-slate-800 font-black rounded-2xl hover:bg-[#f5b829]/80 shadow-xl shadow-[#f5b829]/30 flex items-center justify-center gap-3 group"
              >
                Sign In as Driver <span className={`transition-transform duration-300 group-hover:translate-x-1 ${isRTL ? 'rotate-180 group-hover:-translate-x-1' : ''}`}>➔</span>
              </button>
              <button
                onClick={() => window.location.href = '/login?role=user'}
                className="px-10 py-5 bg-white border border-slate-200 text-slate-900 font-black rounded-2xl hover:border-[#f5b829] transition-all shadow-sm"
              >
                Sign In as Passenger
              </button>
            </div>
          </div>

          {/* Stats Display */}
          <div className={`grid grid-cols-1 md:grid-cols-3 gap-12 w-full max-w-5xl mb-24 py-12 border-y border-slate-100 ${isRTL ? 'md:divide-x-reverse' : 'md:divide-x'} divide-slate-100`}>
            <div>
              <p className="text-4xl font-black text-slate-900 mb-1">50+</p>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Active Routes</p>
            </div>
            <div>
              <p className="text-4xl font-black text-slate-900 mb-1">200+</p>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Vehicles Tracked</p>
            </div>
            <div>
              <p className="text-4xl font-black text-slate-900 mb-1">99.9%</p>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Uptime</p>
            </div>
          </div>

          {/* Features Section Header */}
          <div className="mb-16">
            <h3 className="text-3xl md:text-5xl font-black text-slate-900 mb-4 tracking-tighter">Everything you need for transport</h3>
            <p className="text-slate-500 font-bold text-lg max-w-2xl mx-auto">Powerful features designed to connect drivers and passengers across the country.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full mb-24">
            {/* Feature 1 */}
            <div className="glass-card p-10 flex flex-col items-center text-center group hover:shadow-xl transition-all duration-500 border-slate-100">
              <div className="w-16 h-16 bg-[#f5b829]/10 text-[#f5b829] rounded-2xl flex items-center justify-center text-3xl mb-8 group-hover:scale-110 transition-transform">📍</div>
              <h4 className="text-xl font-black text-slate-900 mb-4 uppercase tracking-tight">Live Tracking</h4>
              <p className="text-slate-500 font-bold text-sm leading-relaxed">Monitor vehicles in real-time with precise GPS tracking across all of Lebanon.</p>
            </div>

            {/* Feature 2 */}
            <div className="glass-card p-10 flex flex-col items-center text-center group hover:shadow-xl transition-all duration-500 border-slate-100">
              <div className="w-16 h-16 bg-[#f5b829]/10 text-[#f5b829] rounded-2xl flex items-center justify-center text-3xl mb-8 group-hover:scale-110 transition-transform">🗺️</div>
              <h4 className="text-xl font-black text-slate-900 mb-4 uppercase tracking-tight">Smart Routing</h4>
              <p className="text-slate-500 font-bold text-sm leading-relaxed">Optimize routes automatically to reduce travel time and improve efficiency.</p>
            </div>

            {/* Feature 3 */}
            <div className="glass-card p-10 flex flex-col items-center text-center group hover:shadow-xl transition-all duration-500 border-slate-100">
              <div className="w-16 h-16 bg-[#f5b829]/10 text-[#f5b829] rounded-2xl flex items-center justify-center text-3xl mb-8 group-hover:scale-110 transition-transform">📊</div>
              <h4 className="text-xl font-black text-slate-900 mb-4 uppercase tracking-tight">Analytics</h4>
              <p className="text-slate-500 font-bold text-sm leading-relaxed">Gain insights with comprehensive reports on fleet performance and utilization.</p>
            </div>
          </div>

          {/* Final CTA */}
          <div className="w-full bg-white border border-slate-200 rounded-[3rem] p-12 md:p-20 text-slate-800 flex flex-col items-center relative overflow-hidden shadow-2xl shadow-[#f5b829]/50">
            <div className="absolute top-0 right-0 w-64 h-64 bg-slate-100 blur-[100px] -translate-y-1/2 translate-x-1/2" />
            <h3 className="text-3xl md:text-5xl font-black mb-8 tracking-tighter max-w-2xl">Ready to transform your transport experience?</h3>
            <button
              onClick={() => window.location.href = '/login'}
              className="px-10 py-5 bg-[#f5b829] text-slate-800 font-black rounded-2xl hover:bg-[#f5b829]/80 transition-all shadow-xl text-lg"
            >
              Get Started Free
            </button>
          </div>
        </main>

        <footer className="w-full py-12 border-t border-slate-100 bg-slate-50">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 text-left">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <img src="/logooo.png" alt="Logo" className="w-8 h-8 object-contain" />
                <h1 className="text-lg font-black tracking-tighter text-slate-900">TRACKER</h1>
              </div>
              <p className="text-slate-500 font-bold text-sm max-w-sm">The most reliable transport tracking infrastructure in Lebanon, powered by real-time intelligence.</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 mb-6">Platform</p>
              <div className="flex flex-col gap-4 text-sm font-bold text-slate-500">
                <a href="#" className="hover:text-yellow-500 transition-colors">How it works</a>
                <a href="#" className="hover:text-yellow-500 transition-colors">Pricing</a>
                <a href="#" className="hover:text-yellow-500 transition-colors">App Download</a>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 mb-6">Company</p>
              <div className="flex flex-col gap-4 text-sm font-bold text-slate-500">
                <a href="#" className="hover:text-yellow-500 transition-colors">About Us</a>
                <a href="#" className="hover:text-yellow-500 transition-colors">Support</a>
                <a href="#" className="hover:text-yellow-500 transition-colors">Privacy Policy</a>
              </div>
            </div>
          </div>
          <div className="max-w-7xl mx-auto px-6 mt-12 pt-12 border-t border-slate-200 text-center">
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
              © 2026 Tracker Infrastructure • Built for Excellence
            </p>
          </div>
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
              <p className="text-lg font-black text-slate-800 leading-tight">{t('reports.nearly_here')}</p>
            </div>
            <button onClick={() => setEtaSeconds(null)} className="text-slate-500 hover:text-slate-800 transition-all">✕</button>
          </div>
        </div>
      )}
      {/* Sidebar Overlay (Mobile) */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className={`lg:hidden fixed top-6 ${isRTL ? 'right-6' : 'left-6'} z-50 glass p-3 rounded-2xl shadow-2xl active:scale-90 transition-all border-slate-200`}
      >
        <span className="text-lg">{isSidebarOpen ? '✕' : '📊'}</span>
      </button>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 ${isRTL ? 'right-0' : 'left-0'} z-40 w-[24rem] glass-card border-r-0 flex flex-col px-8 py-12 transition-transform duration-500 ease-in-out lg:relative lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : (isRTL ? 'translate-x-[100%]' : '-translate-x-full')}
      `}>
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-5">
            <button onClick={() => window.location.href = '/profile'} className={`w-14 h-14 rounded-full flex items-center justify-center text-3xl shadow-sm relative group overflow-hidden ${user?.role === 'driver' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/20'} transition-all`}>
              <span className="relative z-10 flex items-center justify-center">
                {user?.role === 'driver' ? (
                  (user?.capacity || 0) >= 5 ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bus-icon lucide-bus"><path d="M8 6v6" /><path d="M15 6v6" /><path d="M2 12h19.6" /><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3" /><circle cx="7" cy="18" r="2" /><path d="M9 18h5" /><circle cx="16" cy="18" r="2" /></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-car-icon lucide-car"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" /><circle cx="7" cy="17" r="2" /><path d="M9 17h6" /><circle cx="17" cy="17" r="2" /></svg>
                  )
                ) : <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>}
              </span>
            </button>
            <div>
              <h1 className="text-3xl font-black tracking-tighter text-slate-800">TRACKER</h1>
              <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${user?.role === 'driver' ? 'text-[#f5b829]' : 'text-[#f5b829]'}`}>
                {t(`auth.role_${user?.role || 'user'}`)} {t('main.session_type')}
              </span>
            </div>
          </div>
        </div>

        {/* Language Switcher in Sidebar */}
        <div className="mb-8">
          <div className="grid grid-cols-2 glass p-1 rounded-2xl border-slate-200">
            <button
              onClick={() => setLanguage('en')}
              className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${language === 'en' ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:text-slate-800'}`}
            >
              English
            </button>
            <button
              onClick={() => setLanguage('ar')}
              className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${language === 'ar' ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:text-slate-800'}`}
            >
              العربية
            </button>
          </div>
        </div>

        {/* Dynamic Role Content */}
        <div className="flex-1 overflow-y-auto space-y-8 pr-1 custom-scrollbar">
          {user?.role === 'guest' ? (
            <div className="space-y-6">
              <div className="glass p-8 rounded-[2.5rem] border-slate-200">
                <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-4">Discovery</p>
                <h2 className="text-xl font-black text-slate-800 mb-2">{t('main.available_vehicles')}</h2>
                <p className="text-xs text-slate-500 font-bold leading-relaxed mb-6">{t('main.discovery_desc')}</p>

                <div className="space-y-3">
                  {vans.map(v => (
                    <div key={v.id} className="glass p-5 rounded-2xl flex items-center justify-between group border-slate-200 hover:border-[#f5b829]/30 transition-all">
                      <div className="flex items-center gap-4">
                        <span className="text-2xl bg-[#f5b829]/10 p-3 rounded-xl">
                          {(v.capacity || 0) >= 5 ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bus-icon lucide-bus"><path d="M8 6v6" /><path d="M15 6v6" /><path d="M2 12h19.6" /><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3" /><circle cx="7" cy="18" r="2" /><path d="M9 18h5" /><circle cx="16" cy="18" r="2" /></svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-car-icon lucide-car"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" /><circle cx="7" cy="17" r="2" /><path d="M9 17h6" /><circle cx="17" cy="17" r="2" /></svg>
                          )}
                        </span>
                        <div>
                          <p className="text-sm font-black text-slate-800">Fleet {v.id.slice(0, 3)}</p>
                          <p className="text-[10px] font-bold text-[#f5b829] uppercase tracking-widest">
                            • {v.isDriving ? t('main.operational') : t('main.resting')}
                          </p>
                        </div>
                      </div>
                      <span className={`text-slate-600 group-hover:text-[#f5b829] transition-colors ${isRTL ? 'rotate-180' : ''}`}>➔</span>
                    </div>
                  ))}
                  {vans.length === 0 && <p className="text-[10px] font-black text-slate-600 text-center uppercase tracking-widest p-10">{t('common.offline')}</p>}
                </div>
              </div>
              <button
                onClick={() => window.location.href = '/login'}
                className="w-full py-6 glass bg-[#f5b829]/10 hover:bg-[#f5b829]/20 text-[#f5b829] font-black rounded-3xl transition-all border-[#f5b829]/20 uppercase tracking-widest text-xs"
              >
                {t('main.full_access_cta')}
              </button>
            </div>
          ) : user?.role === 'user' && !selectedVanId ? (
            <div className="space-y-6">
              <div className="glass p-8 rounded-[2.5rem] border-slate-200 shadow-xl shadow-[#f5b829]/50">
                <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-4">Discovery</p>
                <h2 className="text-xl font-black text-slate-800 mb-2">{t('main.available_vehicles')}</h2>
                <div className="space-y-3 mt-6">
                  {vans.map(v => (
                    <div key={v.id} className="glass p-5 rounded-2xl flex items-center justify-between border-slate-200 hover:border-[#f5b829]/50 hover:shadow-lg transition-all">
                      <div className="flex items-center gap-4">
                        <span className="text-2xl bg-yellow-400/10 p-3 rounded-xl">
                          {(v.capacity || 0) >= 5 ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bus-icon lucide-bus"><path d="M8 6v6" /><path d="M15 6v6" /><path d="M2 12h19.6" /><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3" /><circle cx="7" cy="18" r="2" /><path d="M9 18h5" /><circle cx="16" cy="18" r="2" /></svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-car-icon lucide-car"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" /><circle cx="7" cy="17" r="2" /><path d="M9 17h6" /><circle cx="17" cy="17" r="2" /></svg>
                          )}
                        </span>
                        <div>
                          <p className="text-sm font-black text-slate-800">Fleet {v.id.slice(0, 3)}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            ETA: <span className="text-[#f5b829] font-black">{discoveryEtas[v.id] || '---'}</span>
                          </p>
                        </div>
                      </div>
                      <button onClick={() => handleSelectVan(v.id)} className="px-5 py-2.5 bg-[#f5b829] text-slate-800 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-[#f5b829]/80 transition-all shadow-md active:scale-95">Select</button>
                    </div>
                  ))}
                  {vans.length === 0 && <p className="text-[10px] font-black text-slate-600 text-center uppercase tracking-widest p-10">{t('common.offline')}</p>}
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Active Tracking Card */}
              {user?.role === 'user' && (
                <div className={`glass-card p-8 rounded-[3rem] border-slate-200 relative overflow-hidden group transition-all duration-500 ${etaSeconds !== null && etaSeconds < 120 ? 'border-emerald-500/30 shadow-[0_0_40px_rgba(16,185,129,0.1)]' : ''}`}>
                  <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl -translate-y-1/2 translate-x-1/2 ${etaSeconds !== null && etaSeconds < 120 ? 'bg-emerald-500/20' : 'bg-[#f5b829]/10'}`} />
                  <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-4">{t('main.arrival_status')}</p>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className={`text-6xl font-black tracking-tighter tabular-nums transition-colors ${etaSeconds !== null && etaSeconds < 120 ? 'text-emerald-500' : 'text-slate-800'}`}>
                      {etaSeconds === null ? '--' : Math.ceil(etaSeconds / 60)}
                    </span>
                    <span className={`text-xl font-black uppercase tracking-widest transition-colors ${etaSeconds !== null && etaSeconds < 120 ? 'text-emerald-500' : 'text-[#f5b829]'}`}>{t('main.min')}</span>
                  </div>
                  <p className="text-xs font-bold text-slate-400 mb-6">
                    {t('main.distance_desc')}
                  </p>
                  <button onClick={() => handleSelectVan(null)} className="w-full py-4 glass bg-red-500/5 hover:bg-red-500/10 text-red-500 font-black rounded-2xl transition-all border-red-500/20 uppercase tracking-widest text-[10px] active:scale-95">
                    Cancel Selection
                  </button>
                </div>
              )}

              {/* Members/Waiting List */}
              {user?.role === 'driver' && (
                <div className="space-y-5">
                  <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest ml-4">{t('main.waiting_near')}</p>
                  <div className="space-y-3">
                    {members.map(m => (
                      <div key={m.id} className="glass p-5 rounded-[2rem] flex items-center gap-4 border-slate-200 hover:border-[#f5b829]/20 transition-all">
                        <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl font-black overflow-hidden relative group">
                          <div className="absolute inset-0 bg-[#f5b829]/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                          👤
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-black text-slate-900">{m.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ETA: {memberEtas[m.id] || t('common.loading')}</p>
                        </div>
                        <div className={`w-3 h-3 rounded-full ${memberEtas[m.id] ? 'bg-emerald-500 animate-pulse' : 'bg-slate-700'}`} />
                      </div>
                    ))}
                    {members.length === 0 && <p className="text-center py-10 text-slate-600 font-bold text-xs italic glass rounded-3xl border-dashed border-slate-200">Waiting for passengers to select you...</p>}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Controls */}
        <div className="mt-10 space-y-4">
          {user?.role === 'driver' && (
            <button
              onClick={() => setIsClusterManagerOpen(true)}
              className="w-full py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] transition-all shadow-2xl active:scale-95 bg-[#f5b829] text-slate-800 shadow-[#f5b829]/20"
            >
              {t('main.create_cluster') || 'Manage Cluster'}
            </button>
          )}
          {user?.role === 'user' && (
            <div className="flex gap-4">
              <button
                onClick={() => setIsReportModalOpen(true)}
                className="flex-1 py-5 bg-gradient-to-tr from-[#f5b829] to-[#f5b829]/80 rounded-[2rem] font-black text-[10px] uppercase tracking-widest text-slate-900 hover:shadow-lg hover:-translate-y-1 transition-all shadow-[#f5b829]/20 active:scale-95 border border-[#f5b829]/30"
              >
                {t('common.support') || 'Support & Feedback'}
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Map Container */}
      <main className="flex-1 relative p-2 md:p-6 bg-slate-50">
        <div id="map" className="w-full h-full rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-slate-200 overflow-hidden" />

        {/* Map Overlays */}
        <div className={`absolute top-10 ${isRTL ? 'left-10' : 'right-10'} z-10 hidden md:flex flex-col gap-3`}>
          <button
            onClick={() => mapRef.current?.setCenter(studentPos)}
            className="p-5 glass rounded-2xl shadow-2xl text-slate-800 hover:bg-slate-100 transition-all border-slate-200"
          >
            🎯
          </button>
        </div>

        {status && (
          <div className="absolute bottom-32 md:bottom-10 left-1/2 -translate-x-1/2 z-10">
            <div className="glass px-6 py-3 rounded-2xl border-slate-200 shadow-2xl flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-[#f5b829] animate-ping" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{status}</span>
            </div>
          </div>
        )}
        {/* Mobile Bottom Nav */}
        <div className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 px-10 py-4 pb-8 flex justify-between items-center z-50 rounded-t-[2.5rem] shadow-[0_-20px_40px_rgba(0,0,0,0.05)]">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-slate-400 hover:text-[#f5b829] transition-colors flex flex-col items-center gap-1 group">
            {user?.role === 'user' ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user group-hover:scale-110 transition-transform"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-home group-hover:scale-110 transition-transform"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
            )}
            <span className="text-[9px] font-black uppercase tracking-widest">{user?.role === 'user' ? t('auth.role_user') : 'Home'}</span>
          </button>

          <div className="relative -top-8">
            <button
              onClick={() => mapRef.current?.setCenter(studentPos)}
              className="w-16 h-16 bg-[#f5b829] text-white rounded-full flex items-center justify-center shadow-xl shadow-[#f5b829]/40 border-4 border-slate-50 transition-transform active:scale-95 hover:bg-[#f5b829]/80"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-map-icon lucide-map"><path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z" /><path d="M15 5.764v15" /><path d="M9 3.236v15" /></svg>
            </button>
          </div>

          {user?.role === 'user' && (
            <button onClick={() => setIsReportModalOpen(true)} className="p-2 text-slate-400 hover:text-[#f5b829] transition-colors flex flex-col items-center gap-1 group">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-life-buoy group-hover:scale-110 transition-transform"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="4" /><line x1="4.93" y1="4.93" x2="9.17" y2="9.17" /><line x1="14.83" y1="14.83" x2="19.07" y2="19.07" /><line x1="14.83" y1="9.17" x2="19.07" y2="4.93" /><line x1="14.83" y1="9.17" x2="18.36" y2="5.64" /><line x1="4.93" y1="19.07" x2="9.17" y2="14.83" /></svg>
              <span className="text-[9px] font-black uppercase tracking-widest">{t('common.support')}</span>
            </button>
          )}
        </div>
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
      {user?.role === 'driver' && (
        <ClusterManager
          user={user}
          isOpen={isClusterManagerOpen}
          onClose={() => setIsClusterManagerOpen(false)}
        />
      )}
    </div>
  );
}
