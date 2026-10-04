'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabase';
import {
  Calendar, Pill, FileText, Activity, ClipboardList,
  ArrowUpRight, Sparkles, Clock, TrendingUp
} from 'lucide-react';

export default function PatientDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ appts: 0, meds: 0, reports: 0, prescs: 0 });
  const [recent, setRecent] = useState({ appt: null, med: null });

  useEffect(() => {
    const u = localStorage.getItem('medtech-user');
    if (!u) return router.push('/login');
    const parsed = JSON.parse(u);
    if (parsed.role !== 'patient') return router.push('/doctor/dashboard');
    setUser(parsed);
    loadAll(parsed.id);
  }, [router]);

  const loadAll = async (pid) => {
    const [a, m, r, p, recentAppt, recentMed] = await Promise.all([
      supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('patient_id', pid),
      supabase.from('medicine_tracker').select('*', { count: 'exact', head: true }).eq('patient_id', pid),
      supabase.from('reports').select('*', { count: 'exact', head: true }).eq('patient_id', pid),
      supabase.from('prescriptions').select('*', { count: 'exact', head: true }).eq('patient_id', pid),
      supabase.from('appointments')
        .select('*, doctors:doctor_id(name,specialty)')
        .eq('patient_id', pid)
        .order('created_at', { ascending: false })
        .limit(1),
      supabase.from('medicine_tracker')
        .select('*')
        .eq('patient_id', pid)
        .order('created_at', { ascending: false })
        .limit(1),
    ]);

    setStats({
      appts: a.count || 0,
      meds: m.count || 0,
      reports: r.count || 0,
      prescs: p.count || 0,
    });
    setRecent({
      appt: recentAppt.data?.[0] || null,
      med: recentMed.data?.[0] || null,
    });
  };

  if (!user) return null;

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  const cards = [
    {
      href: '/patient/appointments',
      label: 'Appointments',
      value: stats.appts,
      icon: Calendar,
      accent: 'text-blue-500',
      bg: 'bg-blue-500/10',
      sub: recent.appt ? `Last: ${recent.appt.doctors?.name || recent.appt.doctor_id}` : 'No bookings yet',
    },
    {
      href: '/patient/prescriptions',
      label: 'Prescriptions',
      value: stats.prescs,
      icon: ClipboardList,
      accent: 'text-indigo-500',
      bg: 'bg-indigo-500/10',
      sub: stats.prescs ? 'View history' : 'None issued yet',
    },
    {
      href: '/patient/medicines',
      label: 'Medicines',
      value: stats.meds,
      icon: Pill,
      accent: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
      sub: recent.med ? `Latest: ${recent.med.medicine_name}` : 'No active meds',
    },
    {
      href: '/patient/reports',
      label: 'Reports',
      value: stats.reports,
      icon: FileText,
      accent: 'text-purple-500',
      bg: 'bg-purple-500/10',
      sub: stats.reports ? 'View all files' : 'Upload your first',
    },
  ];

  return (
    <>
      <Navbar role="patient" name={user.name} />

      <main className="max-w-7xl mx-auto p-4 md:p-8">
        {/* ─── HERO HEADER ─── */}
        <div className="relative overflow-hidden rounded-3xl border border-gray-200 dark:border-neutral-800 bg-gradient-to-br from-emerald-500/5 via-transparent to-blue-500/5 dark:from-emerald-500/10 dark:to-blue-500/10 p-6 md:p-8 mb-8">
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl" />

          <div className="relative flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-3">
                <Sparkles size={14} />
                <span>{today}</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                {greeting}, {user.name.split(' ')[0]}
              </h1>
              <p className="text-sm opacity-60 mt-2">
                Welcome back to your health workspace
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-[11px] uppercase tracking-wider opacity-50 font-medium">
                  Patient ID
                </p>
                <p className="font-mono text-sm font-semibold">{user.id}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 grid place-items-center text-white font-bold text-lg shadow-lg shadow-emerald-500/20">
                {user.name.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </div>

        {/* ─── STAT CARDS ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {cards.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="group relative card hover:border-gray-300 dark:hover:border-neutral-700 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/40 transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-11 h-11 rounded-xl ${c.bg} grid place-items-center`}>
                  <c.icon size={20} className={c.accent} />
                </div>
                <ArrowUpRight
                  size={16}
                  className="opacity-30 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all"
                />
              </div>

              <p className="text-xs uppercase tracking-wider opacity-50 font-medium mb-1">
                {c.label}
              </p>
              <p className="text-3xl font-bold tracking-tight mb-2">{c.value}</p>
              <p className="text-xs opacity-50 truncate">{c.sub}</p>
            </Link>
          ))}
        </div>

        {/* ─── QUICK ACTIONS + ACTIVITY ─── */}
        <div className="grid lg:grid-cols-3 gap-4">
          {/* Quick Actions */}
          <div className="lg:col-span-2 card">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-bold text-lg">Quick Actions</h2>
                <p className="text-xs opacity-50 mt-0.5">Jump into what you need</p>
              </div>
              <TrendingUp size={18} className="opacity-30" />
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <Link
                href="/patient/appointments"
                className="group flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-neutral-800 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all"
              >
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 grid place-items-center flex-shrink-0">
                  <Calendar size={18} className="text-emerald-500" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm">Book Appointment</p>
                  <p className="text-xs opacity-50 truncate">Online or offline token</p>
                </div>
                <ArrowUpRight size={14} className="ml-auto opacity-0 group-hover:opacity-50 transition" />
              </Link>

              <Link
                href="/patient/reports"
                className="group flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-neutral-800 hover:border-purple-500/50 hover:bg-purple-500/5 transition-all"
              >
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 grid place-items-center flex-shrink-0">
                  <FileText size={18} className="text-purple-500" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm">Upload Report</p>
                  <p className="text-xs opacity-50 truncate">PDF or image file</p>
                </div>
                <ArrowUpRight size={14} className="ml-auto opacity-0 group-hover:opacity-50 transition" />
              </Link>

              <Link
                href="/patient/health"
                className="group flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-neutral-800 hover:border-orange-500/50 hover:bg-orange-500/5 transition-all"
              >
                <div className="w-10 h-10 rounded-lg bg-orange-500/10 grid place-items-center flex-shrink-0">
                  <Activity size={18} className="text-orange-500" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm">Update Health</p>
                  <p className="text-xs opacity-50 truncate">Weight, height & BMI</p>
                </div>
                <ArrowUpRight size={14} className="ml-auto opacity-0 group-hover:opacity-50 transition" />
              </Link>

              <Link
                href="/patient/medicines"
                className="group flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-neutral-800 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 grid place-items-center flex-shrink-0">
                  <Pill size={18} className="text-blue-500" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm">Track Medicines</p>
                  <p className="text-xs opacity-50 truncate">Log your daily doses</p>
                </div>
                <ArrowUpRight size={14} className="ml-auto opacity-0 group-hover:opacity-50 transition" />
              </Link>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card">
            <div className="flex items-center gap-2 mb-5">
              <Clock size={16} className="opacity-40" />
              <h2 className="font-bold text-lg">Recent Activity</h2>
            </div>

            <div className="space-y-3">
              {recent.appt ? (
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-500/10 grid place-items-center flex-shrink-0">
                      <Calendar size={16} className="text-blue-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {recent.appt.doctors?.name || recent.appt.doctor_id}
                      </p>
                      <p className="text-xs opacity-50">
                        Token #{recent.appt.token_number} • {recent.appt.appointment_date}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm opacity-50 text-center py-6">
                  No appointments yet
                </p>
              )}

              {recent.med && (
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-500/10 grid place-items-center flex-shrink-0">
                      <Pill size={16} className="text-emerald-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {recent.med.medicine_name}
                      </p>
                      <p className="text-xs opacity-50">
                        {recent.med.dosage} • {recent.med.times_per_day}x/day
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}