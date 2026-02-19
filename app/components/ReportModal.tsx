'use client';

import { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: any;
}

export default function ReportModal({ isOpen, onClose, user }: ReportModalProps) {
    const { t, isRTL } = useLanguage();
    const [type, setType] = useState('delay');
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [success, setSuccess] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSending(true);
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

        try {
            await fetch(`${apiUrl}/api/reports`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    userName: user.name,
                    type,
                    message
                })
            });
            setSuccess(true);
            setTimeout(() => {
                onClose();
                setSuccess(false);
                setMessage('');
            }, 2000);
        } catch (error) {
            console.error('Failed to send report', error);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm">
            <div className={`w-full max-w-lg glass-card rounded-[3rem] p-10 border-white/5 relative overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.5)] ${isRTL ? 'text-right' : 'text-left'}`}>
                <div className={`absolute top-0 ${isRTL ? 'left-0' : 'right-0'} w-40 h-40 bg-blue-500/10 blur-3xl`} />

                {success ? (
                    <div className="py-12 text-center space-y-4">
                        <div className="text-6xl animate-bounce">✅</div>
                        <h3 className="text-2xl font-black text-white uppercase tracking-widest">{t('reports.success')}</h3>
                        <p className="text-slate-400 font-bold">{t('reports.success_desc')}</p>
                    </div>
                ) : (
                    <>
                        <div className="flex justify-between items-center mb-10">
                            <div>
                                <h3 className="text-2xl font-black text-white tracking-tighter uppercase">{t('reports.title')}</h3>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('admin.health_desc')}</p>
                            </div>
                            <button onClick={onClose} className="p-4 glass rounded-2xl text-slate-500 hover:text-white transition-all">✕</button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-4 ml-2">{t('reports.type_label')}</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {['delay', 'route', 'behavior', 'other'].map((cat) => (
                                        <button
                                            key={cat}
                                            type="button"
                                            onClick={() => setType(cat)}
                                            className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${type === cat ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20' : 'glass border-white/5 text-slate-400 hover:text-white'}`}
                                        >
                                            {t(`reports.cat_${cat}`)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-4 ml-2">{t('reports.msg_label')}</label>
                                <textarea
                                    required
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder={t('reports.placeholder')}
                                    className={`w-full h-32 p-6 glass bg-white/5 border-white/10 rounded-3xl text-sm font-bold text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all placeholder:text-slate-700 resize-none ${isRTL ? 'text-right' : 'text-left'}`}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={sending}
                                className="w-full py-6 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-3xl transition-all uppercase tracking-widest text-xs shadow-2xl shadow-blue-500/20 active:scale-95 disabled:opacity-50"
                            >
                                {sending ? t('cluster.processing') : t('reports.send')}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}
