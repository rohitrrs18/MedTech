'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    const u = localStorage.getItem('medtech-user');
    if (!u) return router.push('/login');
    const user = JSON.parse(u);
    router.push(user.role === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard');
  }, [router]);
  return <div className="min-h-screen grid place-items-center">Loading...</div>;
}