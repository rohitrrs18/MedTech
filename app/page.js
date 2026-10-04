'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    try {
      const u = localStorage.getItem('medtech-user');
      if (!u) return router.replace('/login');
      const user = JSON.parse(u);
      router.replace(user.role === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard');
    } catch {
      router.replace('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen grid place-items-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 animate-pulse" />
        <p className="text-sm opacity-50">Loading MedTech…</p>
      </div>
    </div>
  );
}