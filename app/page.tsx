'use client';

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

  const [etaSeconds, setEtaSeconds] = useState<number | null>(null);
  const [status, setStatus] = useState('Waiting for location permission...');
  const [studentPos, setStudentPos] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    // 🛰️ Get student GPS
    if (!navigator.geolocation) {
      setStatus('Geolocation not supported');
      return;
    }

    navigator.geolocation.watchPosition(
      (pos) => {
        setStudentPos({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setStatus('Live location enabled');
      },
      () => setStatus('Location permission denied'),
      { enableHighAccuracy: true }
    );
  }, []);

  useEffect(() => {
    if (!studentPos) return;

    const loadMap = () => {
      if (window.google?.maps) {
        initMap();
        return;
      }

      if (document.getElementById('google-maps-script')) return;

      const script = document.createElement('script');
      script.id = 'google-maps-script';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;
      script.async = true;
      script.onload = initMap;
      document.body.appendChild(script);
    };

    const initMap = async () => {
      const res = await fetch('http://localhost:8000/index.php?r=api/vans');
      const vans = await res.json();
      if (!vans.length) return;

      const van = vans[0];

      mapRef.current = new window.google.maps.Map(
        document.getElementById('map'),
        {
          center: studentPos,
          zoom: 13,
          restriction: {
            latLngBounds: {
              north: 34.2,
              south: 32.8,
              west: 35.0,
              east: 36.0,
            },
          },
        }
      );

      // 🚌 Van marker
      vanMarkerRef.current = new window.google.maps.Marker({
        position: { lat: van.lat, lng: van.lng },
        map: mapRef.current,
        title: 'Van',
      });

      // 🙋 Student marker
      studentMarkerRef.current = new window.google.maps.Marker({
        position: studentPos,
        map: mapRef.current,
        icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
        title: 'You',
      });

      directionsServiceRef.current =
        new window.google.maps.DirectionsService();

      const calculateETA = (vanPos: any, studentPos: any) => {
        directionsServiceRef.current.route(
          {
            origin: vanPos,
            destination: studentPos,
            travelMode: window.google.maps.TravelMode.DRIVING,
          },
          (result: any, status: string) => {
            if (status === 'OK') {
              setEtaSeconds(result.routes[0].legs[0].duration.value);
            }
          }
        );
      };

      calculateETA({ lat: van.lat, lng: van.lng }, studentPos);

      // 🔄 Update every 5s
      intervalRef.current = setInterval(async () => {
        const res = await fetch('http://localhost:8000/index.php?r=api/vans');
        const data = await res.json();
        if (!data.length) return;

        const v = data[0];

        vanMarkerRef.current.setPosition({ lat: v.lat, lng: v.lng });
        studentMarkerRef.current.setPosition(studentPos);

        calculateETA({ lat: v.lat, lng: v.lng }, studentPos);
      }, 5000);
    };

    loadMap();

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [studentPos]);

  return (
    <div className="flex h-screen w-screen bg-slate-100">
      {/* Sidebar */}
      <aside className="w-80 bg-slate-900 text-white flex flex-col px-6 py-8">
        <h1 className="text-2xl font-bold mb-6">🚌 Van Tracker</h1>

        <div className="bg-slate-800 rounded-xl p-5 mb-6">
          <p className="text-xs text-slate-400">Status</p>
          <p className="text-sm">{status}</p>
        </div>

        <div className="bg-slate-800 rounded-xl p-5">
          <p className="text-xs text-slate-400">Estimated Arrival</p>
          <p className="text-3xl font-semibold text-emerald-400 mt-2">
            {etaSeconds === null
              ? 'Calculating...'
              : etaSeconds <= 60
              ? '🟢 Van Arrived'
              : `${Math.ceil(etaSeconds / 60)} min`}
          </p>
        </div>

        <div className="flex-1" />

        <p className="text-xs text-slate-500">
          Your location is used only to calculate ETA
        </p>
      </aside>

      <main className="flex-1">
        <div id="map" className="w-full h-full" />
      </main>
    </div>
  );
}
