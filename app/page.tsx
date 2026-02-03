'use client'; // Force Vercel rebuild

import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    google: any;
  }
}

export default function Home() {
  const mapRef = useRef<any>(null);
  const vanMarkerRef = useRef<any>(null);
  const studentMarkerRef = useRef<any>(null);
  const directionsServiceRef = useRef<any>(null);
  const intervalRef = useRef<any>(null);

  const memberMarkersRef = useRef<{ [key: string]: any }>({});
  const myIdRef = useRef<string>('');

  const [studentPos, setStudentPos] = useState<{ lat: number; lng: number } | null>(null);
  const [etaSeconds, setEtaSeconds] = useState<number | null>(null);
  const [status, setStatus] = useState('Requesting location…');
  const [memberEtas, setMemberEtas] = useState<{ [key: string]: string }>({});
  const [members, setMembers] = useState<any[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userName, setUserName] = useState<string>('');
  const [showNameModal, setShowNameModal] = useState(false);
  const [isDriver, setIsDriver] = useState(false);

  useEffect(() => {
    myIdRef.current = localStorage.getItem('bus_user_id') || Math.random().toString(36).substring(7);
    localStorage.setItem('bus_user_id', myIdRef.current);

    // Check if Driver Mode is active
    const driverFlag = localStorage.getItem('is_driver');
    if (driverFlag === 'true') {
      setIsDriver(true);
    }

    const savedName = localStorage.getItem('bus_user_name');
    if (savedName) {
      setUserName(savedName);
    } else {
      setShowNameModal(true);
    }
  }, []);

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (userName.trim()) {
      localStorage.setItem('bus_user_name', userName.trim());
      setShowNameModal(false);
    }
  };

  const stopDriving = () => {
    localStorage.removeItem('is_driver');
    setIsDriver(false);
    window.location.reload(); // Reload to reset state deeply
  };

  /* 1️⃣ Student GPS */
  useEffect(() => {
    if (!navigator.geolocation) {
      setStatus('Geolocation not supported');
      return;
    }

    const watchPos = () => {
      navigator.geolocation.watchPosition(
        (pos) => {
          setStudentPos({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
          setStatus(isDriver ? 'Broadcasting Bus Location' : 'Live location enabled');
        },
        () => setStatus('Location permission denied'),
        { enableHighAccuracy: true }
      );
    };

    watchPos();
  }, [isDriver]);

  /* 2️⃣ Init map ONCE */
  useEffect(() => {
    if (!studentPos || mapRef.current || !window.google?.maps) return;

    const initMap = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const res = await fetch(`${apiUrl}/api/vans`);
        const data = await res.json();

        mapRef.current = new window.google.maps.Map(
          document.getElementById('map'),
          {
            center: studentPos,
            zoom: 15,
            minZoom: 9,
            disableDefaultUI: true,
            zoomControl: false,
            mapTypeId: 'roadmap',
            restriction: {
              latLngBounds: {
                north: 34.0,
                south: 33.0,
                west: 35.0,
                east: 36.0,
              },
              strictBounds: false,
            },
            styles: []
          }
        );

        vanMarkerRef.current = new window.google.maps.Marker({
          map: mapRef.current,
          title: 'Bus',
          icon: {
            path: 'M20,12H4V4H20V12M22,2H2V16H4V22H6V16H18V22H20V16H22V2M18,11H16V6H18V11M14,11H6V6H14V11Z',
            fillColor: '#F59E0B',
            fillOpacity: 1,
            strokeColor: '#000',
            strokeWeight: 1,
            scale: 1.5,
            anchor: new window.google.maps.Point(12, 12)
          }
        });

        directionsServiceRef.current = new window.google.maps.DirectionsService();
        startPolling();
      } catch (err) {
        console.error(err);
      }
    };

    initMap();
  }, [studentPos]); // Start map when we have pos

  /* 3️⃣ Poll backend */
  const startPolling = () => {
    const distanceMatrixService = new window.google.maps.DistanceMatrixService();

    intervalRef.current = setInterval(async () => {
      // Need latest state inside interval
      // Ideally use a ref for isDriver, but let's just rely on the fact that isDriver doesn't change often without reload
      // OR pass it in. For simplicity, we re-check localStorage or rely on closure capture if dependencies were correct.
      // But setInterval doesn't update closure scope. Let's use a "Ref" approach for stable access if needed.
      // Actually, simplest is to use current detected location.

      if (!studentPos) return;

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const currentlyDriving = localStorage.getItem('is_driver') === 'true';

        if (currentlyDriving) {
          // I AM THE BUS
          await fetch(`${apiUrl}/api/update-location`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              van_id: 1,
              lat: studentPos.lat,
              lng: studentPos.lng
            })
          });
        } else {
          // I AM A STUDENT
          await fetch(`${apiUrl}/api/update-member`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: myIdRef.current,
              lat: studentPos.lat,
              lng: studentPos.lng,
              name: userName || 'Someone'
            })
          });
        }

        // Get everyone
        const res = await fetch(`${apiUrl}/api/vans`);
        const data = await res.json();

        const vans = data.vans || [];
        const allMembers = data.members || [];

        // Filter out members who have arrived
        const currentMembers = allMembers.filter((m: any) => !m.arrived);
        setMembers(currentMembers);

        if (vans.length > 0) {
          const van = vans[0];

          if (!vanMarkerRef.current && mapRef.current) {
            vanMarkerRef.current = new window.google.maps.Marker({
              map: mapRef.current,
              title: 'Bus',
              icon: {
                path: 'M20,12H4V4H20V12M22,2H2V16H4V22H6V16H18V22H20V16H22V2M18,11H16V6H18V11M14,11H6V6H14V11Z',
                fillColor: '#F59E0B',
                fillOpacity: 1,
                strokeColor: '#000',
                strokeWeight: 1,
                scale: 1.5,
                anchor: new window.google.maps.Point(12, 12)
              }
            });
          }
          if (vanMarkerRef.current) {
            vanMarkerRef.current.setPosition({ lat: van.lat, lng: van.lng });
          }

          // Calculate ETAs for WAITING members
          const waitingDestinations = currentMembers.map((m: any) => ({ lat: m.lat, lng: m.lng }));

          if (waitingDestinations.length > 0) {
            distanceMatrixService.getDistanceMatrix(
              {
                origins: [{ lat: van.lat, lng: van.lng }],
                destinations: waitingDestinations,
                travelMode: window.google.maps.TravelMode.DRIVING,
              },
              async (response: any, status: string) => {
                if (status === 'OK' && response.rows[0].elements) {
                  const newEtas: { [key: string]: string } = {};
                  const arrivalPromises: Promise<any>[] = [];

                  response.rows[0].elements.forEach((element: any, idx: number) => {
                    const member = currentMembers[idx];
                    if (element.status === 'OK') {
                      const seconds = element.duration.value;
                      newEtas[member.id] = element.duration.text;

                      // MARK AS ARRIVED if within 60 seconds
                      if (seconds <= 60) {
                        arrivalPromises.push(
                          fetch(`${apiUrl}/api/mark-arrived`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id: member.id })
                          })
                        );
                      }

                      if (member.id === myIdRef.current) {
                        setEtaSeconds(seconds);
                      }
                    }
                  });
                  setMemberEtas(newEtas);
                  if (arrivalPromises.length > 0) await Promise.all(arrivalPromises);
                }
              }
            );
          }
        }

        // 2. Update/Cleanup Member Markers
        // Remove markers for members who arrived or left
        Object.keys(memberMarkersRef.current).forEach(id => {
          if (!currentMembers.find((m: any) => m.id === id) || id === myIdRef.current) {
            memberMarkersRef.current[id].setMap(null);
            delete memberMarkersRef.current[id];
          }
        });

        currentMembers.forEach((m: any) => {
          if (m.id === myIdRef.current) return;

          if (!memberMarkersRef.current[m.id]) {
            memberMarkersRef.current[m.id] = new window.google.maps.Marker({
              map: mapRef.current,
              title: m.name,
              icon: {
                path: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
                fillColor: '#10B981', // Emerald for Friends
                fillOpacity: 0.9,
                strokeColor: '#fff',
                strokeWeight: 1.5,
                scale: 1.3,
                anchor: new window.google.maps.Point(12, 12)
              }
            });
          }
          memberMarkersRef.current[m.id].setPosition({ lat: m.lat, lng: m.lng });
        });

        // 3. Update "You" Marker (ONLY IF NOT DRIVING - bus marker covers driver)
        if (!currentlyDriving) {
          if (!studentMarkerRef.current && mapRef.current) {
            studentMarkerRef.current = new window.google.maps.Marker({
              map: mapRef.current,
              title: 'You',
              icon: {
                path: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
                fillColor: '#2563EB', // Blue for You
                fillOpacity: 1,
                strokeColor: '#fff',
                strokeWeight: 2,
                scale: 1.5,
                anchor: new window.google.maps.Point(12, 12)
              }
            });
          }
          if (studentMarkerRef.current) {
            studentMarkerRef.current.setPosition(studentPos);
          }
        } else {
          // If driving, hide student marker if it exists
          if (studentMarkerRef.current) {
            studentMarkerRef.current.setMap(null);
            studentMarkerRef.current = null;
          }
        }

      } catch (e) {
        console.error("Fetch error", e);
      }
    }, 4000);
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen w-screen bg-slate-50 text-slate-900 font-[family-name:var(--font-geist-sans)] overflow-hidden">
      {/* Mobile Header / Overlay Toggle */}
      <button
        onClick={() => setIsSidebarOpen(true)}
        className="lg:hidden fixed top-6 left-6 z-20 p-4 bg-white rounded-2xl shadow-xl shadow-slate-200 border border-slate-100 flex items-center justify-center active:scale-90 transition-transform"
      >
        <span className="text-xl">📊</span>
      </button>

      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-30 transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-80 mesh-gradient border-r border-slate-200 flex flex-col px-6 py-8 shadow-2xl transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:shadow-sm
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="absolute inset-0 bus-pattern opacity-40 pointer-events-none" />

        <div className="flex items-center justify-between mb-10 relative z-10">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl shadow-xl shadow-slate-200 border border-slate-100 flex items-center justify-center ${isDriver ? 'bg-amber-100' : 'bg-white'}`}>
              <span className="text-2xl drop-shadow-sm">🚌</span>
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900 leading-none mb-1">Bus Tracker</h1>
              <p className={`text-[10px] font-bold uppercase tracking-widest ${isDriver ? 'text-amber-600' : 'text-slate-400'}`}>
                {isDriver ? 'DRIVER MODE ACTIVE' : 'Training Group'}
              </p>
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-slate-400 hover:text-slate-600 active:scale-95">
            <span className="text-xl">✕</span>
          </button>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1.5">System Status</p>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${status.includes('enabled') || status.includes('Broadcasting') ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
              <p className="text-sm font-semibold text-slate-700">{status}</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl shadow-slate-200/50">
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-4">Estimated Arrival</p>
            <div className="flex flex-col gap-1">
              <span className="text-5xl font-black text-slate-900 tabular-nums">
                {etaSeconds === null ? '--' : etaSeconds <= 60 ? '0' : Math.ceil(etaSeconds / 60)}
                <span className="text-base font-bold text-slate-400 ml-2">min</span>
              </span>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs font-medium text-slate-500">
                  {isDriver ? 'You are driving 🚌' : etaSeconds === null ? 'Locating bus...' : etaSeconds <= 60 ? '🚌 Bus arrived' : 'Bus is on the way'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Member List */}
        <div className="mt-8 relative z-10 flex-1 overflow-y-auto custom-scrollbar pr-1">
          <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-4">Friends & Arrivals</p>
          <div className="space-y-3 pb-6">
            {members.map((m) => {
              const isMe = m.id === myIdRef.current;
              if (isMe && isDriver) return null; // Don't show myself in the list if I am driving

              return (
                <div key={m.id} className={`flex items-center gap-3 p-3 backdrop-blur rounded-2xl border transition-all group ${isMe ? 'bg-blue-50/50 border-blue-100 shadow-sm' : 'bg-white/50 border-slate-100 hover:border-amber-200'}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-inner group-hover:scale-110 transition-transform font-bold ${isMe ? 'bg-blue-100 text-blue-600' : 'bg-emerald-50 text-slate-700'}`}>
                    <span className="text-sm">{isMe ? '👤' : 'M'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-bold truncate ${isMe ? 'text-blue-900' : 'text-slate-800'}`}>
                      {m.name || 'Friend'} {isMe && <span className="text-[10px] font-medium text-blue-500">(You)</span>}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium truncate">
                      {isMe ? 'Sharing location...' : 'Waiting location'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-[10px] font-black tabular-nums ${isMe ? 'text-blue-600' : 'text-amber-500'}`}>
                      {memberEtas[m.id] || '---'}
                    </p>
                    <div className="flex justify-end mt-1">
                      <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isMe ? 'bg-blue-400' : 'bg-emerald-400'}`} />
                    </div>
                  </div>
                </div>
              );
            })}
            {members.length === 0 && (
              <p className="text-[11px] text-slate-400 italic text-center py-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                Waiting for friends...
              </p>
            )}
          </div>
        </div>

        <div className="mt-6">
          {isDriver ? (
            <button
              onClick={stopDriving}
              className="flex items-center justify-center gap-2 w-full py-4 bg-red-500 hover:bg-red-600 text-white text-xs font-black rounded-[1.5rem] transition-all shadow-xl shadow-red-500/20 active:scale-95 uppercase tracking-wide"
            >
              STOP DRIVING
            </button>
          ) : (
            <a href="/driver" className="flex items-center justify-center gap-2 w-full py-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-[1.5rem] transition-all shadow-xl shadow-slate-900/10 active:scale-95 uppercase tracking-wide">
              DRIVER MODE
            </a>
          )}
        </div>

        <div className="mt-6 lg:mt-auto">
          <div className={`p-4 rounded-2xl border ${isDriver ? 'bg-amber-50 border-amber-100' : 'bg-blue-50/50 border-blue-100'}`}>
            <p className={`text-[10px] leading-relaxed font-bold ${isDriver ? 'text-amber-600' : 'text-blue-600/70'}`}>
              {isDriver ? 'You are broadcasting the bus location.' : 'Sharing live location with friends.'}
            </p>
          </div>
        </div>
      </aside>

      <main className="flex-1 relative bg-slate-100 p-2 lg:p-4">
        <div id="map" className="w-full h-full rounded-[1.5rem] lg:rounded-[2rem] shadow-2xl shadow-slate-200 border border-white overflow-hidden" />

        {/* Floating current location button (Mobile) */}
        {!isSidebarOpen && (
          <button
            onClick={() => mapRef.current?.setCenter(studentPos)}
            className="lg:hidden absolute bottom-8 right-8 p-4 bg-white rounded-full shadow-2xl border border-slate-100 active:scale-90 transition-transform z-10"
          >
            <span className="text-xl">🎯</span>
          </button>
        )}
      </main>

      {/* Name Capture Modal (Only if not driving, usually) */}
      {showNameModal && !isDriver && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md">
          <div className="w-full max-w-sm bg-white rounded-[2.5rem] p-8 shadow-2xl border border-white relative overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="absolute inset-0 bus-pattern opacity-10 pointer-events-none" />

            <div className="relative z-10">
              <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-inner mx-auto">
                👋
              </div>
              <h2 className="text-2xl font-black text-slate-900 text-center mb-2">Welcome!</h2>
              <p className="text-sm text-slate-500 text-center mb-8">What should your friends call you on the map?</p>

              <form onSubmit={handleSaveName} className="space-y-4">
                <input
                  autoFocus
                  type="text"
                  placeholder="Enter your name"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 text-slate-900 font-bold placeholder:text-slate-300 transition-all"
                  required
                />
                <button
                  type="submit"
                  className="w-full py-4 bg-slate-900 hover:bg-black text-white font-black rounded-2xl shadow-xl shadow-slate-900/10 transition-all active:scale-95 uppercase tracking-wide text-xs"
                >
                  Join Training Group
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
