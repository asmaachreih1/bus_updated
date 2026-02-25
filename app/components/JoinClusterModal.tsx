import { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

interface JoinClusterModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: any;
    onSuccess: () => void;
}

export default function JoinClusterModal({ isOpen, onClose, user, onSuccess }: JoinClusterModalProps) {
    const { isRTL } = useLanguage();
    const [code, setCode] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');

    if (!isOpen) return null;

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (code.length < 6) {
            setStatus('error');
            setErrorMsg('Code must be 6 characters');
            return;
        }

        setStatus('loading');
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            const token = localStorage.getItem('tracker_token');
            const res = await fetch(`${apiUrl}/api/clusters/join`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ code: code.toUpperCase(), userId: user.id }),
            });
            const data = await res.json();
            if (data.success) {
                setStatus('success');
                setTimeout(() => {
                    onSuccess();
                    onClose();
                    setCode('');
                    setStatus('idle');
                }, 1500);
            } else {
                setStatus('error');
                setErrorMsg(data.error || 'Invalid code');
            }
        } catch (err) {
            setStatus('error');
            setErrorMsg('Network error');
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

            <div className={`relative w-full max-w-sm glass bg-white/90 p-8 rounded-[2.5rem] shadow-2xl border-slate-200 transform grow-in ${isRTL ? 'text-right' : 'text-left'}`}>
                <button onClick={onClose} className={`absolute top-6 ${isRTL ? 'left-6' : 'right-6'} text-slate-400 hover:text-slate-800 transition-colors bg-slate-100 p-2 rounded-full`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>

                <div className="w-16 h-16 bg-[#f5b829]/10 text-[#f5b829] rounded-2xl flex items-center justify-center text-3xl mb-6 mx-auto">
                    🔗
                </div>

                <h2 className="text-2xl font-black text-slate-800 mb-2 text-center">Join Cluster</h2>
                <p className="text-sm font-bold text-slate-500 mb-8 text-center">Enter the 6-digit code provided by your driver.</p>

                <form onSubmit={handleJoin} className="space-y-6">
                    <div>
                        <input
                            type="text"
                            value={code}
                            onChange={(e) => {
                                setCode(e.target.value.toUpperCase());
                                setStatus('idle');
                            }}
                            placeholder="e.g., A1B2C3"
                            maxLength={6}
                            className={`w-full bg-slate-50 border-2 border-slate-200 text-slate-900 rounded-2xl px-6 py-4 outline-none transition-all placeholder:text-slate-400 font-black text-center tracking-[0.5em] text-xl focus:border-[#f5b829] ${status === 'error' ? 'border-red-500/50 bg-red-50' : ''}`}
                            required
                        />
                        {status === 'error' && (
                            <p className="text-red-500 text-xs font-bold mt-2 text-center animate-in slide-in-from-top-1">{errorMsg}</p>
                        )}
                        {status === 'success' && (
                            <p className="text-emerald-500 text-xs font-bold mt-2 text-center animate-in slide-in-from-top-1">Successfully joined!</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={status === 'loading' || status === 'success' || code.length < 6}
                        className={`w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-3
              ${status === 'success'
                                ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                                : 'bg-[#f5b829] text-slate-800 shadow-[#f5b829]/30 hover:bg-[#f5b829]/90 active:scale-95 disabled:opacity-50 disabled:active:scale-100 disabled:hover:bg-[#f5b829]'}`}
                    >
                        {status === 'loading' ? (
                            <span className="w-5 h-5 border-2 border-slate-800/30 border-t-slate-800 rounded-full animate-spin" />
                        ) : status === 'success' ? (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check"><polyline points="20 6 9 17 4 12" /></svg>
                                Joined!
                            </>
                        ) : (
                            'Join Now'
                        )}
                    </button>
                </form>
            </div>
            <style jsx global>{`
        .grow-in { animation: growIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes growIn {
          0% { opacity: 0; transform: scale(0.95); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
        </div>
    );
}
