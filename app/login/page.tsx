'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '../context/LanguageContext';

export default function Login() {
  const router = useRouter();
  const { t, language, setLanguage, isRTL } = useLanguage();
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<'user' | 'driver'>('user');
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    capacity: '14'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlRole = urlParams.get('role');
    if (urlRole === 'driver' || urlRole === 'user') {
      setRole(urlRole);
    }
  }, []);

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

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-white relative overflow-y-auto py-12 font-[family-name:var(--font-geist-sans)]">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full bus-pattern opacity-5 pointer-events-none" />
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#f5b829]/5 blur-[150px] rounded-full animate-mesh" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#f5b829]/5 blur-[150px] rounded-full animate-mesh" style={{ animationDelay: '4s' }} />

      <div className="w-full max-w-md p-6 relative z-10">
        <div className="glass-card rounded-[2.5rem] p-8 md:p-10 border-slate-100 bg-white/90 shadow-2xl shadow-[#f5b829]/50">
          <div className="text-center mb-10">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-[#f5b829]/5 blur-2xl rounded-full scale-150 animate-pulse" />
              <img
                src="/logooo.png"
                alt="Logo"
                className="w-32 h-32 mx-auto object-contain relative z-10"
              />
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-2">
              {isLogin ? t('auth.title_login') : t('auth.title_signup')}
            </h1>
            <p className="text-slate-400 font-bold text-sm">
              {isLogin ? t('auth.subtitle_login') : t('auth.subtitle_signup')}
            </p>
          </div>

          <div className="grid grid-cols-2 p-1 glass bg-slate-50/50 rounded-2xl mb-8 h-12 relative overflow-hidden border-slate-100">
            <button
              onClick={() => setRole('user')}
              className={`relative z-10 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-500 ${isRTL ? 'flex-row-reverse' : 'flex-row'} ${role === 'user' ? 'text-slate-800' : 'text-slate-400 hover:text-slate-500'}`}
              type="button"
            >
              <span><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-person-standing-icon lucide-person-standing"><circle cx="12" cy="5" r="1" /><path d="m9 20 3-6 3 6" /><path d="m6 8 6 2 6-2" /><path d="M12 10v4" /></svg></span> {t('auth.role_user')}
            </button>
            <button
              onClick={() => setRole('driver')}
              className={`relative z-10 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-500 ${isRTL ? 'flex-row-reverse' : 'flex-row'} ${role === 'driver' ? 'text-slate-800' : 'text-slate-400 hover:text-slate-500'}`}
              type="button"
            >
              <span><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`lucide lucide-car-icon lucide-car ${isRTL ? 'ml-2' : 'ml-6'}`}><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" /><circle cx="7" cy="17" r="2" /><path d="M9 17h6" /><circle cx="17" cy="17" r="2" /></svg></span> {t('auth.role_driver')}
            </button>
            <div className={`absolute inset-y-1 w-[calc(50%-4px)] ${role === 'driver' ? 'bg-[#f5b829] shadow-md shadow-[#f5b829]/20' : 'bg-white border border-slate-200 shadow-md shadow-[#f5b829]/50'} rounded-xl transition-all duration-500 ease-out ${role === 'driver' ? (isRTL ? 'translate-x-[calc(-100%-2px)]' : 'translate-x-[calc(100%+2px)]') : (isRTL ? 'translate-x-[-2px]' : 'translate-x-[2px]')}`} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="group">
                <label className="text-[9px] uppercase tracking-[0.2em] font-black text-slate-400 ml-4 mb-2 block group-focus-within:text-blue-600 transition-colors">{t('auth.label_name')}</label>
                <input
                  type="text"
                  placeholder="Enter your name"
                  className="w-full h-14 px-6 bg-slate-50/50 border border-slate-100 hover:border-[#f5b829]/20 focus:border-[#f5b829]/40 rounded-xl focus:ring-4 focus:ring-[#f5b829]/5 transition-all font-bold outline-none text-slate-800 placeholder-slate-300 text-sm"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            )}

            <div className="group">
              <label className="text-[9px] uppercase tracking-[0.2em] font-black text-slate-400 ml-4 mb-2 block group-focus-within:text-blue-600 transition-colors">{t('auth.label_email')}</label>
              <input
                type="email"
                placeholder="name@example.com"
                className="w-full h-14 px-6 bg-slate-50/50 border border-slate-100 hover:border-blue-500/20 focus:border-blue-500/40 rounded-xl focus:ring-4 focus:ring-blue-500/5 transition-all font-bold outline-none text-slate-800 placeholder-slate-300 text-sm"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="group relative">
              <label className="text-[9px] uppercase tracking-[0.2em] font-black text-slate-400 ml-4 mb-2 block group-focus-within:text-[#f5b829] transition-colors">Security Key</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="w-full h-14 pl-6 pr-12 bg-slate-50/50 border border-slate-100 hover:border-[#f5b829]/20 focus:border-[#f5b829]/40 rounded-xl focus:ring-4 focus:ring-[#f5b829]/5 transition-all font-bold outline-none text-slate-800 placeholder-slate-300 text-sm"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute inset-y-0 ${isRTL ? 'left-0 pl-4' : 'right-0 pr-4'} flex items-center text-slate-400 hover:text-slate-600 transition-colors`}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-eye-off-icon lucide-eye-off"><path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" /><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" /><path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" /><path d="m2 2 20 20" /></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-eye-icon lucide-eye"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" /><circle cx="12" cy="12" r="3" /></svg>
                  )}
                </button>
              </div>
            </div>

            {!isLogin && role === 'driver' && (
              <div className="group">
                <label className="text-[9px] uppercase tracking-[0.2em] font-black text-slate-400 ml-4 mb-2 block group-focus-within:text-[#f5b829] transition-colors">{t('auth.label_capacity')}</label>
                <input
                  type="number"
                  placeholder="14"
                  className="w-full h-14 px-6 bg-slate-50/50 border border-slate-100 hover:border-[#f5b829]/20 focus:border-[#f5b829]/40 rounded-xl focus:ring-4 focus:ring-[#f5b829]/5 transition-all font-bold outline-none text-slate-800 placeholder-slate-300 text-sm"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                />
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-100 py-3 rounded-xl text-red-500 text-[10px] font-black text-center animate-shake uppercase tracking-widest">
                {error}
              </div>
            )}

            <button
              disabled={loading}
              type="submit"
              className={`w-full h-14 mt-4 relative group overflow-hidden ${role === 'driver' ? 'bg-[#f5b829] shadow-lg shadow-[#f5b829]/10' : 'bg-white border border-slate-200 shadow-lg shadow-[#f5b829]/50'} text-slate-800 font-black rounded-xl transition-all active:scale-[0.98] uppercase tracking-[0.2em] text-[10px]`}
            >
              <div className="absolute inset-0 bg-slate-100 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              {loading ? (
                <span className="flex items-center justify-center gap-2 relative z-10">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  SECURE AUTHENTICATING...
                </span>
              ) : (
                <span className="relative z-10">{isLogin ? t('auth.btn_login') : t('auth.btn_signup')}</span>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-slate-400 font-bold text-xs tracking-wide">
              {isLogin ? t('auth.toggle_signup') : t('auth.toggle_login')}
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                }}
                className={`ml-2 text-slate-900 border-b border-slate-200 hover:border-slate-800 transition-all font-black ${isRTL ? 'mr-2 ml-0' : 'ml-2'}`}
                type="button"
              >
                {isLogin ? 'Workspace' : 'Sign In'}
              </button>
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-4px); }
                    75% { transform: translateX(4px); }
                }
                .animate-shake {
                    animation: shake 0.2s ease-in-out 2;
                }
            `}</style>
    </div>
  );
}
