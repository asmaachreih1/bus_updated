'use client';

import { useRouter } from 'next/navigation';

export default function DriverPage() {
  const router = useRouter();

  const startTrip = () => {
    // Set flag and redirect to map
    localStorage.setItem('is_driver', 'true');
    router.replace('/');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-900 px-6 font-[family-name:var(--font-geist-sans)] mesh-gradient relative">
      <div className="absolute inset-0 bus-pattern opacity-30 pointer-events-none" />

      <div className="w-full max-w-sm bg-white rounded-[2.5rem] p-8 shadow-2xl relative z-10 text-center">
        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center text-4xl mb-6 mx-auto shadow-inner">
          🚌
        </div>

        <h1 className="text-2xl font-black text-slate-900 mb-2">Driver Console</h1>
        <p className="text-sm text-slate-500 mb-8">Start the session to share your location as the Bus.</p>

        <button
          onClick={startTrip}
          className="w-full bg-slate-900 hover:bg-black text-white font-black py-5 rounded-2xl transition-all active:scale-95 shadow-xl"
        >
          START DRIVING
        </button>
      </div>
    </div>
  );
}
