'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ThemeToggle from './ThemeToggle';
import { Heart, LogOut } from 'lucide-react';

export default function Navbar({ role, name }) {
  const router = useRouter();
  const logout = () => {
    localStorage.removeItem('medtech-user');
    router.push('/login');
  };
  return (
    <nav className="sticky top-0 z-40 backdrop-blur bg-white/80 dark:bg-black/70 border-b border-gray-200 dark:border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link
          href={role === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard'}
          className="flex items-center gap-2 font-bold text-lg"
        >
          <Heart className="text-emerald-500" /> MedTech
        </Link>
        <div className="flex items-center gap-3">
          {name && <span className="text-sm opacity-70 hidden sm:block">{name}</span>}
          <ThemeToggle />
          <button
            onClick={logout}
            className="p-2 rounded-full border border-gray-300 dark:border-neutral-700 hover:bg-gray-100 dark:hover:bg-neutral-800"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </nav>
  );
}