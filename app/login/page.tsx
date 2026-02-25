'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '../context/LanguageContext';

export default function Login() {
  const router = useRouter();
  const { t, language, setLanguage, isRTL } = useLanguage();

  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<'user' | 'driver'>('user');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    capacity: '14',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const endpoint = isLogin ? '/api/login' : '/api/signup';

    const payload = isLogin
      ? {
        email: formData.email.trim(),
        password: formData.password,
      }
      : {
        id: Math.random().toString(36).substring(2, 10),
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role,
        capacity: role === 'driver' ? formData.capacity : undefined,
      };

    try {
      const res = await fetch(`${apiUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        if (isLogin) {
          localStorage.setItem('tracker_user', JSON.stringify(data.user));
          if (data.token) localStorage.setItem('token', data.token);
          if (data.user.role === 'admin') {
            router.push('/admin');
          } else {
            sessionStorage.setItem('open_map_after_login', '1');
            router.push('/?view=app');
          }
        } else {
          // ✅ Signup success -> switch to login, don't auto-login
          setIsLogin(true);
          setFormData((prev) => ({
            ...prev,
            name: '',
            password: '',
            capacity: '14',
          }));
          setError('Account created! Please login.');
        }
      } else {
        setError(data.error || 'Authentication failed');
      }
    } catch {
      setError('Connection error. Is the server running?');
    } finally {
      setLoading(false);
    }
  };

  const accent = role === 'driver' ? 'amber' : 'blue';

  return (
    <div className="h-screen w-screen flex items-center justify-center relative overflow-hidden bg-slate-950 font-[family-name:var(--font-geist-sans)]">
      {/* Road / night background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-950 to-black" />

        {/* street glow */}
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_20%_15%,#ffffff18,transparent_40%),radial-gradient(circle_at_85%_35%,#ffffff12,transparent_42%),radial-gradient(circle_at_50%_85%,#ffffff10,transparent_45%)]" />

        {/* center road line (behind bus) */}
        <div className="absolute left-1/2 top-0 h-full w-2 -translate-x-1/2 opacity-40 z-0">
          <div className="h-full w-full bg-[linear-gradient(to_bottom,transparent_0,transparent_22px,#facc15aa_22px,#facc15aa_40px,transparent_40px,transparent_74px)] bg-[length:100%_74px] animate-[road_2s_linear_infinite]" />
        </div>
      </div>

      {/* Language Switcher */}
      <div className={`absolute top-6 ${isRTL ? 'left-6' : 'right-6'} z-50`}>
        <button
          onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
          className="px-5 py-2.5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md text-xs font-black text-white/90 hover:bg-white/10 transition-all uppercase tracking-widest"
          type="button"
        >
          {language === 'en' ? 'العربية' : 'English'}
        </button>
      </div>

      {/* Bus Card */}
      <div className="relative z-20 w-full max-w-md px-6">
        <div className="rounded-[3rem] border border-white/10 bg-gradient-to-b from-slate-900/90 to-slate-950/95 backdrop-blur-xl shadow-[0_40px_120px_rgba(0,0,0,0.7)] overflow-hidden">
          {/* Bus roof */}
          <div
            className={`h-10 border-b border-white/10 ${accent === 'amber'
                ? 'bg-gradient-to-r from-amber-500/30 via-yellow-400/20 to-amber-500/10'
                : 'bg-gradient-to-r from-blue-500/30 via-sky-400/20 to-blue-500/10'
              }`}
          />

          {/* Windows */}
          <div className="px-8 pt-5">
            <div className="grid grid-cols-4 gap-3 mb-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-9 rounded-2xl border border-white/10 bg-white/10 relative overflow-hidden"
                >
                  <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_30%_20%,#ffffff45,transparent_55%)]" />
                </div>
              ))}
            </div>

            {/* Header */}
            <div className="text-center mb-6">
              <div className="relative inline-block mb-4">
                <div
                  className={`absolute inset-0 blur-2xl rounded-full scale-150 animate-pulse ${accent === 'amber' ? 'bg-amber-500/15' : 'bg-blue-500/15'
                    }`}
                />
                <img
                  src="/logooo.jpeg"
                  alt="Logo"
                  className="w-16 h-16 mx-auto object-contain relative z-10 drop-shadow-md rounded-2xl"
                />
              </div>

              <h1 className="text-3xl font-black text-white tracking-tighter mb-1">
                {isLogin ? t('auth.title_login') : t('auth.title_signup')}
              </h1>
              <p className="text-white/60 font-bold text-sm">
                {isLogin ? t('auth.subtitle_login') : t('auth.subtitle_signup')}
              </p>

              {/* Route badge */}
              <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-2xl border border-white/10 bg-white/5 text-[10px] font-black uppercase tracking-[0.25em] text-white/80">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
                ROUTE: {role === 'driver' ? 'DRIVER LANE' : 'PASSENGER LANE'}
              </div>
            </div>

            {/* Role Switch */}
            <div className="grid grid-cols-2 p-1 rounded-2xl mb-5 h-11 relative overflow-hidden border border-white/10 bg-white/5">
              <button
                onClick={() => setRole('user')}
                className={`relative z-10 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-500 ${role === 'user' ? 'text-white' : 'text-white/60 hover:text-white/80'
                  }`}
                type="button"
              >
                <span>🚏</span> {t('auth.role_user')}
              </button>

              <button
                onClick={() => setRole('driver')}
                className={`relative z-10 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-500 ${role === 'driver' ? 'text-white' : 'text-white/60 hover:text-white/80'
                  }`}
                type="button"
              >
                <span>🚌</span> {t('auth.role_driver')}
              </button>

              <div
                className={`absolute inset-y-1 w-[calc(50%-4px)] rounded-xl transition-all duration-500 ease-out ${role === 'driver'
                    ? `bg-amber-600 shadow-md shadow-amber-600/20 ${isRTL ? 'translate-x-[calc(-100%-2px)]' : 'translate-x-[calc(100%+2px)]'
                    }`
                    : `bg-blue-600 shadow-md shadow-blue-600/20 ${isRTL ? 'translate-x-[-2px]' : 'translate-x-[2px]'
                    }`
                  }`}
              />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              {!isLogin && (
                <div className="group">
                  <label className="text-[9px] uppercase tracking-[0.2em] font-black text-white/60 ml-4 mb-2 block">
                    {t('auth.label_name')}
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your name"
                    className="w-full h-12 px-6 bg-white/5 border border-white/10 hover:border-white/20 focus:border-white/30 rounded-2xl focus:ring-4 focus:ring-white/5 transition-all font-bold outline-none text-white placeholder-white/35 text-sm"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
              )}

              <div className="group">
                <label className="text-[9px] uppercase tracking-[0.2em] font-black text-white/60 ml-4 mb-2 block">
                  {t('auth.label_email')}
                </label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  className="w-full h-12 px-6 bg-white/5 border border-white/10 hover:border-white/20 focus:border-white/30 rounded-2xl focus:ring-4 focus:ring-white/5 transition-all font-bold outline-none text-white placeholder-white/35 text-sm"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="group">
                <label className="text-[9px] uppercase tracking-[0.2em] font-black text-white/60 ml-4 mb-2 block">
                  Security Key
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full h-12 px-6 bg-white/5 border border-white/10 hover:border-white/20 focus:border-white/30 rounded-2xl focus:ring-4 focus:ring-white/5 transition-all font-bold outline-none text-white placeholder-white/35 text-sm"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>

              {!isLogin && role === 'driver' && (
                <div className="group">
                  <label className="text-[9px] uppercase tracking-[0.2em] font-black text-white/60 ml-4 mb-2 block">
                    {t('auth.label_capacity')}
                  </label>
                  <input
                    type="number"
                    placeholder="14"
                    className="w-full h-12 px-6 bg-white/5 border border-white/10 hover:border-white/20 focus:border-white/30 rounded-2xl focus:ring-4 focus:ring-white/5 transition-all font-bold outline-none text-white placeholder-white/35 text-sm"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    required
                  />
                </div>
              )}

              {error && (
                <div className="bg-white/5 border border-white/10 py-3 rounded-2xl text-white/90 text-[10px] font-black text-center animate-shake uppercase tracking-widest">
                  {error}
                </div>
              )}

              {/* Ticket button (shorter so always visible) */}
              <button
                disabled={loading}
                type="submit"
                className={`w-full h-12 mt-1 relative group overflow-hidden text-white font-black rounded-2xl transition-all active:scale-[0.98] uppercase tracking-[0.2em] text-[10px] border border-white/10 ${role === 'driver'
                    ? 'bg-amber-600/90 shadow-lg shadow-amber-600/20 hover:bg-amber-600'
                    : 'bg-blue-600/90 shadow-lg shadow-blue-600/20 hover:bg-blue-600'
                  }`}
              >
                <div className="absolute left-0 top-0 h-full w-8 flex flex-col items-center justify-evenly opacity-70">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <span key={i} className="h-1.5 w-1.5 rounded-full bg-white/40" />
                  ))}
                </div>
                <div className="absolute right-0 top-0 h-full w-8 flex flex-col items-center justify-evenly opacity-70">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <span key={i} className="h-1.5 w-1.5 rounded-full bg-white/40" />
                  ))}
                </div>

                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />

                {loading ? (
                  <span className="flex items-center justify-center gap-2 relative z-10">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    BOARDING...
                  </span>
                ) : (
                  <span className="relative z-10">🎟️ {isLogin ? t('auth.btn_login') : t('auth.btn_signup')}</span>
                )}
              </button>
            </form>

            {/* Toggle */}
            <div className="mt-5 text-center pb-4">
              <p className="text-white/60 font-bold text-xs tracking-wide">
                {isLogin ? t('auth.toggle_signup') : t('auth.toggle_login')}
                <button
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError('');
                  }}
                  className={`ml-2 text-white border-b border-white/20 hover:border-white/70 transition-all font-black ${isRTL ? 'mr-2 ml-0' : 'ml-2'
                    }`}
                  type="button"
                >
                  {isLogin ? t('auth.btn_signup') : t('auth.btn_login')}
                </button>
              </p>
            </div>
          </div>

          {/* Wheels (slightly smaller) */}
          <div className="flex justify-between px-10 pb-5 pt-1">
            <div className="h-9 w-9 rounded-full bg-slate-800 border border-white/10 shadow-inner relative">
              <div className="absolute inset-2 rounded-full bg-slate-900 border border-white/10" />
            </div>
            <div className="h-9 w-9 rounded-full bg-slate-800 border border-white/10 shadow-inner relative">
              <div className="absolute inset-2 rounded-full bg-slate-900 border border-white/10" />
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-4px);
          }
          75% {
            transform: translateX(4px);
          }
        }
        .animate-shake {
          animation: shake 0.2s ease-in-out 2;
        }
        @keyframes road {
          from {
            background-position-y: 0;
          }
          to {
            background-position-y: 74px;
          }
        }
      `}</style>
    </div>
  );
}
