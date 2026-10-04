'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabase';
import {
  Calendar, Users, Clock, Wifi, MapPin, Search, Filter,
  Stethoscope, ArrowUpRight, CheckCircle2, Circle,
  Activity, TrendingUp, Sparkles, FileEdit, Inbox
} from 'lucide-react';

export default function DoctorDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [today, setToday] = useState({ online: 0, offline: 0, list: [] });
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // 'all' | 'online' | 'offline' | 'pending' | 'completed'

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('medtech-user') || 'null');
    if (!u || u.role !== 'doctor') return router.push('/login');
    setUser(u);
    load(u.id);
  }, [router]);

  const load = async (docId) => {
    const date = new Date().toISOString().slice(0, 10);
    const { data } = await supabase
      .from('appointments')
      .select('*')
      .eq('doctor_id', docId)
      .eq('appointment_date', date)
      .order('token_number');

    const rows = data || [];
    const online = rows.filter(a => a.type === 'online').length;
    const offline = rows.filter(a => a.type === 'offline').length;
    setToday({ online, offline, list: rows });
  };

  const stats = useMemo(() => {
    const total = today.list.length;
    const pending = today.list.filter(a => a.status !== 'completed').length;
    const completed = today.list.filter(a => a.status === 'completed').length;
    return {
      online: today.online,
      offline: today.offline,
      total,
      pending,
      completed,
      onlinePct: Math.round((today.online / 30) * 100),
      offlinePct: Math.round((today.offline / 70) * 100),
    };
  }, [today]);

  const filtered = useMemo(() => {
    let list = today.list;
    if (filter === 'online') list = list.filter(a => a.type === 'online');
    if (filter === 'offline') list = list.filter(a => a.type === 'offline');
    if (filter === 'pending') list = list.filter(a => a.status !== 'completed');
    if (filter === 'completed') list = list.filter(a => a.status === 'completed');
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        a => a.patient_id?.toLowerCase().includes(q) ||
             String(a.token_number).includes(q)
      );
    }
    return list;
  }, [today.list, filter, search]);

  if (!user) return null;

  const todayDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  return (
    <>
      <Navbar role="doctor" name={user.name} />

      <main className="max-w-7xl mx-auto p-4 md:p-8">
        {/* ─── HERO ─── */}
        <div className="relative overflow-hidden rounded-3xl border border-gray-200 dark:border-neutral-800 bg-gradient-to-br from-blue-500/5 via-transparent to-emerald-500/5 dark:from-blue-500/10 dark:to-emerald-500/10 p-6 md:p-8 mb-8">
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

          <div className="relative flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-3">
                <Sparkles size={14} />
                <span>{todayDate}</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                {greeting}, {user.name.replace('Dr. ', '')}
              </h1>
              <p className="text-sm opacity-60 mt-2">
                Here's your schedule for today
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-[11px] uppercase tracking-wider opacity-50 font-medium">
                  Doctor ID
                </p>
                <p className="font-mono text-sm font-semibold">{user.id}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-emerald-600 grid place-items-center text-white shadow-lg shadow-blue-500/20">
                <Stethoscope size={20} />
              </div>
            </div>
          </div>
        </div>

        {/* ─── STAT CARDS ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Online capacity */}
          <div className="card group hover:border-blue-500/40 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className="w-11 h-11 rounded-xl bg-blue-500/10 grid place-items-center">
                <Wifi size={20} className="text-blue-500" />
              </div>
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold">
                Online
              </span>
            </div>
            <p className="text-xs uppercase tracking-wider opacity-50 font-medium mb-1">
              Online slots
            </p>
            <p className="text-3xl font-bold tracking-tight mb-2">
              {stats.online}
              <span className="text-base opacity-40 font-normal"> / 30</span>
            </p>
            <div className="h-1.5 rounded-full bg-gray-100 dark:bg-neutral-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500"
                style={{ width: `${Math.min(stats.onlinePct, 100)}%` }}
              />
            </div>
          </div>

          {/* Offline capacity */}
          <div className="card group hover:border-emerald-500/40 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/10 grid place-items-center">
                <MapPin size={20} className="text-emerald-500" />
              </div>
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold">
                Offline
              </span>
            </div>
            <p className="text-xs uppercase tracking-wider opacity-50 font-medium mb-1">
              Offline slots
            </p>
            <p className="text-3xl font-bold tracking-tight mb-2">
              {stats.offline}
              <span className="text-base opacity-40 font-normal"> / 70</span>
            </p>
            <div className="h-1.5 rounded-full bg-gray-100 dark:bg-neutral-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                style={{ width: `${Math.min(stats.offlinePct, 100)}%` }}
              />
            </div>
          </div>

          {/* Pending */}
          <div className="card group hover:border-orange-500/40 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className="w-11 h-11 rounded-xl bg-orange-500/10 grid place-items-center">
                <Clock size={20} className="text-orange-500" />
              </div>
              {stats.pending > 0 && (
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              )}
            </div>
            <p className="text-xs uppercase tracking-wider opacity-50 font-medium mb-1">
              Pending
            </p>
            <p className="text-3xl font-bold tracking-tight">
              {stats.pending}
            </p>
            <p className="text-xs opacity-50 mt-2">
              {stats.pending === 0 ? 'All caught up' : 'Awaiting consultation'}
            </p>
          </div>

          {/* Completed */}
          <div className="card group hover:border-purple-500/40 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className="w-11 h-11 rounded-xl bg-purple-500/10 grid place-items-center">
                <CheckCircle2 size={20} className="text-purple-500" />
              </div>
              <TrendingUp size={16} className="opacity-30" />
            </div>
            <p className="text-xs uppercase tracking-wider opacity-50 font-medium mb-1">
              Completed
            </p>
            <p className="text-3xl font-bold tracking-tight">
              {stats.completed}
            </p>
            <p className="text-xs opacity-50 mt-2">
              of {stats.total} total today
            </p>
          </div>
        </div>

        {/* ─── QUEUE HEADER ─── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Activity size={18} className="opacity-50" />
            <h2 className="font-bold text-lg">Today's Queue</h2>
            {today.list.length > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-neutral-800 opacity-70 font-medium">
                {today.list.length}
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            {/* Search */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40 pointer-events-none" />
              <input
                className="input pl-9 h-9 text-sm w-full sm:w-56"
                placeholder="Search patient / token"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Filter chips */}
            <div className="flex gap-1 p-1 rounded-xl bg-gray-100 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800">
              <FilterChip active={filter === 'all'} onClick={() => setFilter('all')}>
                All
              </FilterChip>
              <FilterChip active={filter === 'pending'} onClick={() => setFilter('pending')}>
                Pending
              </FilterChip>
              <FilterChip active={filter === 'online'} onClick={() => setFilter('online')}>
                <Wifi size={11} /> Online
              </FilterChip>
              <FilterChip active={filter === 'offline'} onClick={() => setFilter('offline')}>
                <MapPin size={11} /> Offline
              </FilterChip>
              <FilterChip active={filter === 'completed'} onClick={() => setFilter('completed')}>
                Done
              </FilterChip>
            </div>
          </div>
        </div>

        {/* ─── QUEUE LIST ─── */}
        {today.list.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 grid place-items-center mb-4">
              <Inbox size={26} className="text-blue-500" />
            </div>
            <p className="font-semibold text-lg">No appointments today</p>
            <p className="text-sm opacity-50 mt-1 max-w-xs">
              Your queue is empty. Enjoy the breather — or check other dates from the Appointments page.
            </p>
            <Link href="/doctor/appointments" className="btn-ghost mt-4 text-sm inline-flex items-center gap-1.5">
              View schedule <ArrowUpRight size={14} />
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-14 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-neutral-800 grid place-items-center mb-3">
              <Filter size={22} className="opacity-40" />
            </div>
            <p className="font-medium">No matches</p>
            <p className="text-sm opacity-50 mt-1">Try a different filter or search</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((a) => {
              const isOnline = a.type === 'online';
              const isCompleted = a.status === 'completed';

              return (
                <div
                  key={a.id}
                  className={`card group transition-colors ${
                    isCompleted
                      ? 'opacity-70 hover:opacity-100'
                      : 'hover:border-gray-300 dark:hover:border-neutral-700'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Token badge */}
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div
                        className={`relative w-14 h-14 rounded-2xl grid place-items-center flex-shrink-0 ${
                          isCompleted
                            ? 'bg-gray-100 dark:bg-neutral-800'
                            : isOnline
                            ? 'bg-blue-500/10'
                            : 'bg-emerald-500/10'
                        }`}
                      >
                        <span
                          className={`font-bold text-lg ${
                            isCompleted
                              ? 'opacity-40'
                              : isOnline
                              ? 'text-blue-500'
                              : 'text-emerald-500'
                          }`}
                        >
                          #{a.token_number}
                        </span>
                        {!isCompleted && (
                          <span
                            className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-[#141414] ${
                              isOnline ? 'bg-blue-500' : 'bg-emerald-500'
                            }`}
                          />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold font-mono text-sm">
                            {a.patient_id}
                          </p>
                          {isCompleted && (
                            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 font-semibold flex items-center gap-1">
                              <CheckCircle2 size={9} /> Completed
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs opacity-60 mt-1">
                          <span
                            className={`flex items-center gap-1 ${
                              isOnline ? 'text-blue-500' : 'text-emerald-500'
                            }`}
                          >
                            {isOnline ? <Wifi size={11} /> : <MapPin size={11} />}
                            <span className="capitalize">{a.type}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={11} /> {a.appointment_date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Circle
                              size={8}
                              fill="currentColor"
                              className={isCompleted ? 'opacity-40' : 'text-orange-500'}
                            />
                            {a.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action */}
                    <div className="flex items-center gap-2 flex-shrink-0 sm:ml-auto">
                      <Link
                        href={`/doctor/prescribe/${a.id}`}
                        className={`text-sm inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition ${
                          isCompleted
                            ? 'btn-ghost'
                            : 'btn-primary'
                        }`}
                      >
                        <FileEdit size={15} />
                        {isCompleted ? 'View' : 'Prescribe'}
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}

/* ─── FILTER CHIP ─── */
function FilterChip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
        active ? 'bg-white dark:bg-neutral-800 shadow' : 'opacity-60 hover:opacity-100'
      }`}
    >
      {children}
    </button>
  );
}