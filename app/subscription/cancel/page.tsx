"use client";

import React from "react";
import { useRouter } from "next/navigation";

const CancelPage = () => {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center font-[family-name:var(--font-geist-sans)]">
            <div className="relative mb-8">
                <div className="absolute inset-0 bg-red-500/20 blur-3xl rounded-full" />
                <div className="relative w-24 h-24 bg-red-500 rounded-[2rem] flex items-center justify-center text-white text-5xl shadow-2xl shadow-red-500/40 animate-in zoom-in duration-500">
                    ✕
                </div>
            </div>

            <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-4">Payment Cancelled</h1>
            <p className="text-slate-500 font-bold max-w-xs mb-10 leading-relaxed">
                The payment process was interrupted. No charges were made to your account. You can try again whenever you're ready.
            </p>

            <div className="flex flex-col gap-4 w-full max-w-xs">
                <button
                    onClick={() => router.push('/')}
                    className="w-full py-5 bg-slate-900 text-white font-black rounded-2xl uppercase tracking-[0.2em] transition-all hover:bg-slate-800 active:scale-95"
                >
                    Return Home
                </button>
                <button
                    onClick={() => window.history.back()}
                    className="w-full py-4 glass text-slate-400 font-black rounded-2xl uppercase tracking-[0.2em] transition-all hover:text-slate-600"
                >
                    Try Again
                </button>
            </div>
        </div>
    );
};

export default CancelPage;
