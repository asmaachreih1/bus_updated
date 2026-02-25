"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const SuccessContent = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const sessionId = searchParams.get('session_id');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (sessionId) {
            // Here we could verify the session with the backend
            // and update the user's subscription status in the DB.
            // For now, we'll simulate the update.
            const finalizeSubscription = async () => {
                try {
                    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
                    const res = await fetch(`${apiUrl}/api/stripe/verify-session?session_id=${sessionId}`);
                    const data = await res.json();

                    if (data.success) {
                        const savedUser = localStorage.getItem('tracker_user');
                        if (savedUser) {
                            const userData = JSON.parse(savedUser);
                            userData.isSubscribed = true;
                            userData.subscriptionType = data.packageType;
                            localStorage.setItem('tracker_user', JSON.stringify(userData));
                            window.dispatchEvent(new Event('storage'));
                        }
                    }

                    setLoading(false);
                } catch (e) {
                    setLoading(false);
                }
            };

            finalizeSubscription();
        }
    }, [sessionId]);

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center font-[family-name:var(--font-geist-sans)]">
            <div className="relative mb-8">
                <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full" />
                <div className="relative w-24 h-24 bg-emerald-500 rounded-[2rem] flex items-center justify-center text-white text-5xl shadow-2xl shadow-emerald-500/40 animate-in zoom-in duration-500">
                    ✓
                </div>
            </div>

            <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-4">Payment Successful!</h1>
            <p className="text-slate-500 font-bold max-w-xs mb-10 leading-relaxed">
                Your premium access is now active. You're all set to join the fleet and experience first-class tracking.
            </p>

            {loading ? (
                <div className="flex items-center gap-2 text-slate-400 font-black uppercase tracking-widest text-[10px]">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" />
                    Finalizing System Access...
                </div>
            ) : (
                <button
                    onClick={() => router.push('/')}
                    className="px-10 py-5 bg-[#f5b829] text-slate-800 font-black rounded-2xl uppercase tracking-[0.2em] shadow-2xl shadow-[#f5b829]/20 transition-all hover:scale-105 active:scale-95"
                >
                    Back to Dashboard
                </button>
            )}
        </div>
    );
};

const SuccessPage = () => {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <SuccessContent />
        </Suspense>
    );
};

export default SuccessPage;
