'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DriverPage() {
  const router = useRouter();
  const watchIdRef = useRef<number | null>(null);

  const [status, setStatus] = useState('Ready to start trip');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [tripStarted, setTripStarted] = useState(false);

  useEffect(() => {
    if (!tripStarted) return;

    if (!navigator.geolocation) {
      setStatus('Geolocation not supported');
      return;
    }

    // 🛰️ Start watching location
    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        setCoords({ lat, lng });
        setStatus('Sending live location');

        try {
          await fetch('http://localhost:8000/index.php?r=api/update-location', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `van_id=1&lat=${lat}&lng=${lng}`,
          });
        } catch {
          setStatus('Failed to send location');
        }
      },
      (error) => {
        setStatus('Location permission denied');
        console.error(error);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000,
      }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [tripStarted]);

  const startTrip = () => {
    setTripStarted(true);
    setStatus('Starting trip...');
    
    // ⏩ Redirect to main map after 2 seconds
    setTimeout(() => {
      router.push('/');
    }, 2000);
  };

  const stopTrip = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
    setTripStarted(false);
    setStatus('Trip stopped');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white px-6">
      <h1 className="text-3xl font-bold mb-6">🚌 Driver Mode</h1>

      <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md shadow">
        <p className="text-sm text-slate-400 mb-2">Status</p>
        <p className="text-lg font-semibold mb-4">{status}</p>

        {coords && (
          <>
            <p className="text-sm text-slate-400">Current Location</p>
            <p className="text-sm mt-1">
              Lat: {coords.lat.toFixed(6)}
              <br />
              Lng: {coords.lng.toFixed(6)}
            </p>
          </>
        )}

        {!tripStarted ? (
          <button
            onClick={startTrip}
            className="mt-6 w-full bg-emerald-500 hover:bg-emerald-600 text-black font-semibold py-3 rounded-xl transition"
          >
            ▶ Start Trip
          </button>
        ) : (
          <button
            onClick={stopTrip}
            className="mt-6 w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-xl transition"
          >
            ⏹ Stop Trip
          </button>
        )}
      </div>

      <p className="text-xs text-slate-500 mt-6 text-center">
        Keep this page open while driving
      </p>
    </div>
  );
}
