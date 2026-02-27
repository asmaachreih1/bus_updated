'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '../context/LanguageContext';

type ProfileUser = {
  id?: string;
  name?: string;
  email?: string;
  role?: 'user' | 'driver' | 'admin';
  capacity?: number;
  username?: string;
  bio?: string;
  phone?: string;
  address?: string;
  website?: string;
  avatarUrl?: string;
  createdAt?: string;
};

type ProfileForm = {
  name: string;
  username: string;
  bio: string;
  phone: string;
  address: string;
  website: string;
  avatarUrl: string;
};

const EMPTY_FORM: ProfileForm = {
  name: '',
  username: '',
  bio: '',
  phone: '',
  address: '',
  website: '',
  avatarUrl: '',
};

function toForm(user: ProfileUser): ProfileForm {
  return {
    name: user.name || '',
    username: user.username || '',
    bio: user.bio || '',
    phone: user.phone || '',
    address: user.address || '',
    website: user.website || '',
    avatarUrl: user.avatarUrl || '',
  };
}

function formatMemberSince(value?: string): string {
  if (!value) return 'Recently';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently';

  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = dataUrl;
  });
}

async function imageFileToAvatarDataUrl(file: File): Promise<string> {
  const original = await fileToDataUrl(file);
  const img = await loadImage(original);

  const maxSize = 640;
  const ratio = Math.min(1, maxSize / Math.max(img.width, img.height));
  const width = Math.max(1, Math.round(img.width * ratio));
  const height = Math.max(1, Math.round(img.height * ratio));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not process image');
  }

  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL('image/jpeg', 0.82);
}

export default function ProfilePage() {
  const router = useRouter();
  const { t, isRTL, language, setLanguage } = useLanguage();
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [form, setForm] = useState<ProfileForm>(EMPTY_FORM);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const initials = useMemo(() => {
    const name = (form.name || user?.name || '').trim();
    if (!name) return 'U';

    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || '')
      .join('');
  }, [form.name, user?.name]);

  const roleLabel = useMemo(() => {
    if (user?.role === 'driver') return t('auth.role_driver');
    if (user?.role === 'admin') return 'Admin';
    return t('auth.role_user');
  }, [t, user?.role]);

  useEffect(() => {
    const loadProfile = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.replace('/login');
        return;
      }

      try {
        const res = await fetch(`${apiUrl}/api/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        if (!res.ok || !data?.success || !data?.user) {
          localStorage.removeItem('tracker_user');
          localStorage.removeItem('token');
          router.replace('/login');
          return;
        }

        const nextUser = data.user as ProfileUser;
        setUser(nextUser);
        setForm(toForm(nextUser));
        localStorage.setItem('tracker_user', JSON.stringify(nextUser));
      } catch {
        setError('Unable to load profile right now.');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [apiUrl, router]);

  const handleChange = (field: keyof ProfileForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handlePhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.');
      e.target.value = '';
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setError('Image is too large. Please choose a file under 8MB.');
      e.target.value = '';
      return;
    }

    try {
      setError('');
      const avatarDataUrl = await imageFileToAvatarDataUrl(file);
      handleChange('avatarUrl', avatarDataUrl);
      setSuccess('Photo selected. Click Save profile.');
    } catch {
      setError('Could not read that image. Please try another one.');
    } finally {
      e.target.value = '';
    }
  };

  const resetForm = () => {
    if (!user) return;
    setForm(toForm(user));
    setError('');
    setSuccess('Changes discarded.');
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const token = localStorage.getItem('token');
    if (!token) {
      router.replace('/login');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`${apiUrl}/api/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name,
          username: form.username,
          bio: form.bio,
          phone: form.phone,
          address: form.address,
          website: form.website,
          avatarUrl: form.avatarUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data?.success || !data?.user) {
        setError(data?.error || 'Failed to update profile.');
        return;
      }

      const nextUser = data.user as ProfileUser;
      setUser(nextUser);
      setForm(toForm(nextUser));
      localStorage.setItem('tracker_user', JSON.stringify(nextUser));
      setSuccess('Profile updated successfully.');
    } catch {
      setError('Connection error while saving profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen px-4 py-8 md:px-8 md:py-10 bg-[#0b0d12]">
        <div className="max-w-3xl mx-auto rounded-3xl border border-white/10 bg-zinc-900/85 p-8 backdrop-blur-xl">
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-zinc-300">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className={`min-h-screen relative overflow-x-hidden px-4 py-6 md:px-8 md:py-10 ${isRTL ? 'text-right' : 'text-left'}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_8%,rgba(221,42,123,0.12),transparent_34%),radial-gradient(circle_at_86%_10%,rgba(81,91,212,0.1),transparent_30%),linear-gradient(180deg,#0d0f14_0%,#090b10_58%,#07090d_100%)]" />

      <main className="relative z-10 max-w-3xl mx-auto">
        <section className="rounded-3xl border border-white/10 bg-zinc-900/85 p-5 md:p-7 backdrop-blur-xl shadow-[0_22px_80px_-44px_rgba(0,0,0,0.9)] float-up">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              onClick={() => router.push('/?view=app')}
              className="h-10 px-4 rounded-xl border border-white/15 bg-white/5 text-xs font-bold uppercase tracking-[0.14em] text-zinc-200 hover:bg-white/10 transition-colors"
              type="button"
            >
              {t('profile.back_to_dashboard')}
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
                className="h-10 px-3 rounded-xl border border-white/15 bg-white/5 text-xs font-bold uppercase tracking-[0.14em] text-zinc-200 hover:bg-white/10 transition-colors"
                type="button"
              >
                {language === 'en' ? 'AR' : 'EN'}
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem('tracker_user');
                  localStorage.removeItem('token');
                  sessionStorage.removeItem('open_map_after_login');
                  router.replace('/login');
                }}
                className="h-10 px-3 rounded-xl border border-rose-400/35 bg-rose-500/12 text-xs font-bold uppercase tracking-[0.14em] text-rose-100 hover:bg-rose-500/20 transition-colors"
                type="button"
              >
                {t('common.logout')}
              </button>
            </div>
          </div>

          <div className="mt-6 flex flex-col md:flex-row md:items-center gap-4">
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              className="relative h-20 w-20 rounded-3xl overflow-hidden bg-zinc-800 shadow-xl ring-4 ring-white/10 shrink-0"
              title="Add photo"
            >
              <img
                src={form.avatarUrl.trim() || '/default-avatar.svg'}
                alt={`${initials} profile photo`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = '/default-avatar.svg';
                }}
              />
              <span className="absolute bottom-1 right-1 h-6 w-6 rounded-full border border-white/30 bg-black/70 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-white" fill="currentColor" aria-hidden="true">
                  <path d="M9 5a2 2 0 0 1 1.6-.8h2.8A2 2 0 0 1 15 5l.5 1H18a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3h2.5L9 5zm3 3.2A4.8 4.8 0 1 0 12 18a4.8 4.8 0 0 0 0-9.6zm0 2A2.8 2.8 0 1 1 12 16a2.8 2.8 0 0 1 0-5.8z" />
                </svg>
              </span>
            </button>

            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoFileChange}
              className="hidden"
            />

            <div className="min-w-0">
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-zinc-100 truncate">{form.name || user.name || 'Your profile'}</h1>
              <p className="mt-1 text-sm font-semibold text-zinc-400">{roleLabel} - Member since {formatMemberSince(user.createdAt)}</p>
            </div>
          </div>

          <form onSubmit={handleSave} className="mt-7 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block">
                <span className="block text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-2">Name</span>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  maxLength={80}
                  className="w-full h-11 rounded-xl border border-white/15 bg-zinc-950/70 px-4 text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-white/35 focus:ring-2 focus:ring-white/10"
                />
              </label>

              <label className="block">
                <span className="block text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-2">Username</span>
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => handleChange('username', e.target.value)}
                  maxLength={40}
                  placeholder="Short unique name"
                  className="w-full h-11 rounded-xl border border-white/15 bg-zinc-950/70 px-4 text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-white/35 focus:ring-2 focus:ring-white/10"
                />
              </label>
            </div>

            <label className="block">
              <span className="block text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-2">Bio ({form.bio.length}/300)</span>
              <textarea
                value={form.bio}
                onChange={(e) => handleChange('bio', e.target.value)}
                maxLength={300}
                rows={4}
                placeholder="Tell people a little about your route or preferences"
                className="w-full rounded-xl border border-white/15 bg-zinc-950/70 p-4 text-zinc-100 placeholder:text-zinc-500 outline-none resize-y focus:border-white/35 focus:ring-2 focus:ring-white/10"
              />
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block">
                <span className="block text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-2">Phone</span>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  maxLength={30}
                  placeholder="Optional"
                  className="w-full h-11 rounded-xl border border-white/15 bg-zinc-950/70 px-4 text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-white/35 focus:ring-2 focus:ring-white/10"
                />
              </label>

              <label className="block">
                <span className="block text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-2">Website</span>
                <input
                  type="text"
                  value={form.website}
                  onChange={(e) => handleChange('website', e.target.value)}
                  maxLength={120}
                  placeholder="https://"
                  className="w-full h-11 rounded-xl border border-white/15 bg-zinc-950/70 px-4 text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-white/35 focus:ring-2 focus:ring-white/10"
                />
              </label>
            </div>

            <label className="block">
              <span className="block text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-2">Address</span>
              <input
                type="text"
                value={form.address}
                onChange={(e) => handleChange('address', e.target.value)}
                maxLength={160}
                placeholder="Street, city, area"
                className="w-full h-11 rounded-xl border border-white/15 bg-zinc-950/70 px-4 text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-white/35 focus:ring-2 focus:ring-white/10"
              />
            </label>

            {error && (
              <div className="rounded-xl border border-rose-400/35 bg-rose-500/12 px-4 py-3 text-sm font-semibold text-rose-100">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-xl border border-emerald-400/35 bg-emerald-500/12 px-4 py-3 text-sm font-semibold text-emerald-100">
                {success}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 h-11 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 text-zinc-900 font-extrabold uppercase tracking-[0.16em] text-xs hover:from-yellow-300 hover:via-amber-300 hover:to-yellow-400 transition-all disabled:opacity-60 shadow-lg shadow-amber-500/30"
              >
                {saving ? 'Saving...' : 'Save profile'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 h-11 rounded-xl border border-white/15 bg-zinc-800/65 text-zinc-200 font-extrabold uppercase tracking-[0.16em] text-xs hover:bg-zinc-700/70 transition-colors"
              >
                Discard changes
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}
