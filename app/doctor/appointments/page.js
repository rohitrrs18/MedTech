'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabase';
import {
  Calendar, Wifi, MapPin, ChevronLeft, ChevronRight, Search,
  CheckCircle2, Clock, FileEdit, Inbox, Filter, User,
  TrendingUp, Users, X
} from 'lucide-react';

export default function DoctorAppointments() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [list, setList] = useState([]);
  const [patients, setPatients] = useState({});
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all | online | offline | pending | completed

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('medtech-user') || 'null');
    if (!u || u.role !== 'doctor') return router.push('/login');
    setUser(u);
  }, [router]);

  useEffect(() => {
    if (!user) return;
    load();
  }, [user, date]);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('appointments')
      .select('*')
      .eq('doctor_id', user.id)
      .eq('appointment_date', date)
      .order('type')
      .order('token_number');

    const rows = data || [];
    setList(rows);

    // Enrich with patient names
    const ids = [...new Set(rows.map((r) => r.patient_id))];
    if (ids.length) {
      const { data: pts } = await supabase
        .from('patients')
        .select('patient_id,name,phone')
        .in('patient_id', ids);
      const map = Object.fromEntries((pts || []).map((p) => [p.patient_id, p]));
      setPatients(map);
    }
    setLoading(false);
  };

  // Aggregates
  const stats = useMemo(() => {
    const total = list.length;
    const online = list.filter((a) => a.type === 'online').length;
    const offline = list.filter((a) => a.type === 'offline').length;
    const pending = list.filter((a) => a.status !== 'completed').length;
    const completed = list.filter((a) => a.status === 'completed').length;
    return { total, online, offline, pending, completed };
  }, [list]);

  // Filtered list
  const filtered = useMemo(() => {
    let rows = list;
    if (filter === 'online') rows = rows.filter((a) => a.type === 'online');
    if (filter === 'offline') rows = rows.filter((a) => a.type === 'offline');
    if (filter === 'pending') rows = rows.filter((a) => a.status !== 'completed');
    if (filter === 'completed') rows = rows.filter((a) => a.status === 'completed');

    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter((a) => {
        const name = patients[a.patient_id]?.name?.toLowerCase() || '';
        return (
          a.patient_id?.toLowerCase().includes(q) ||
          String(a.token_number).includes(q) ||
          name.includes(q)
        );
      });
    }
    return rows;
  }, [list, filter, search, patients]);

  const shiftDate = (days) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    setDate(d.toISOString().slice(0, 10));
  };

  const isToday = date === new Date().toISOString().slice(0, 10);

  const dateLabel = new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  if (!user) return null;

  return (
    <>
      <Navbar role="doctor" name={user.name} />

      <main className="max-w-6xl mx-auto p-4 md:p-8">
        {/* ─── HEADER ─── */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-2">
            <Calendar size={14} />
            <span>Schedule</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Appointments
          </h1>
          <p className="opacity-60 mt-2 text-sm">
            View and manage consultations for any date
          </p>
        </div>

        {/* ─── DATE NAVIGATOR ─── */}
        <div className="relative overflow-hidden rounded-3xl border border-gray-200 dark:border-neutral-800 bg-gradient-to-br from-blue-500/5 via-transparent to-emerald-500/5 dark:from-blue-500/10 dark:to-emerald-500/10 p-5 md:p-6 mb-6">
          <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Left: date navigator */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => shiftDate(-1)}
                className="w-10 h-10 rounded-xl grid place-items-center border border-gray-200 dark:border-neutral-800 hover:bg-white dark:hover:bg-neutral-800 transition"
              >
                <ChevronLeft size={18} />
              </button>

              <div className="text-center px-3 min-w-[200px]">
                <p className="text-[11px] uppercase tracking-wider opacity-50 font-medium">
                  {isToday ? 'Today' : 'Selected date'}
                </p>
                <p className="font-semibold text-sm mt-0.5">{dateLabel}</p>
              </div>

              <button
                onClick={() => shiftDate(1)}
                className="w-10 h-10 rounded-xl grid place-items-center border border-gray-200 dark:border-neutral-800 hover:bg-white dark:hover:bg-neutral-800 transition"
              >
                <ChevronRight size={18} />
              </button>

              <div className="relative ml-2">
                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40 pointer-events-none" />
                <input
                  type="date"
                  className="input pl-9 h-10 text-sm w-[160px]"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              {!isToday && (
                <button
                  onClick={() => setDate(new Date().toISOString().slice(0, 10))}
                  className="text-xs px-3 py-1.5 rounded-lg border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition font-medium"
                >
                  Today
                </button>
              )}
            </div>

            {/* Right: summary stats */}
            <div className="flex items-center gap-2 flex-wrap">
              <SummaryPill
                icon={Users}
                label="Total"
                value={stats.total}
                color="text-gray-600 dark:text-gray-300"
                bg="bg-gray-100 dark:bg-neutral-800"
              />
              <SummaryPill
                icon={Clock}
                label="Pending"
                value={stats.pending}
                color="text-orange-600 dark:text-orange-400"
                bg="bg-orange-500/10"
              />
              <SummaryPill
                icon={CheckCircle2}
                label="Completed"
                value={stats.completed}
                color="text-purple-600 dark:text-purple-400"
                bg="bg-purple-500/10"
              />
            </div>
          </div>

          {/* Capacity bars */}
          <div className="relative grid sm:grid-cols-2 gap-4 mt-5 pt-5 border-t border-gray-200 dark:border-neutral-800/70">
            <CapacityBar
              icon={Wifi}
              label="Online"
              used={stats.online}
              total={30}
              color="from-blue-500 to-cyan-500"
              textColor="text-blue-600 dark:text-blue-400"
              bgColor="bg-blue-500/10"
            />
            <CapacityBar
              icon={MapPin}
              label="Offline"
              used={stats.offline}
              total={70}
              color="from-emerald-500 to-teal-500"
              textColor="text-emerald-600 dark:text-emerald-400"
              bgColor="bg-emerald-500/10"
            />
          </div>
        </div>

        {/* ─── TOOLBAR ─── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Users size={18} className="opacity-50" />
            <h2 className="font-bold text-lg">Consultations</h2>
            {filtered.length > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-neutral-800 opacity-70 font-medium">
                {filtered.length}
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40 pointer-events-none" />
              <input
                className="input pl-9 h-9 text-sm w-full sm:w-52"
                placeholder="Patient name / ID / token"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md grid place-items-center opacity-50 hover:opacity-100 hover:bg-gray-100 dark:hover:bg-neutral-800"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            <div className="flex gap-1 p-1 rounded-xl bg-gray-100 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800">
              <Chip active={filter === 'all'} onClick={() => setFilter('all')}>
                All
              </Chip>
              <Chip active={filter === 'pending'} onClick={() => setFilter('pending')}>
                Pending
              </Chip>
              <Chip active={filter === 'online'} onClick={() => setFilter('online')}>
                <Wifi size={11} /> Online
              </Chip>
              <Chip active={filter === 'offline'} onClick={() => setFilter('offline')}>
                <MapPin size={11} /> Offline
              </Chip>
              <Chip active={filter === 'completed'} onClick={() => setFilter('completed')}>
                Done
              </Chip>
            </div>
          </div>
        </div>

        {/* ─── LIST ─── */}
        {loading ? (
          <div className="card flex items-center justify-center py-14">
            <div className="flex items-center gap-2 text-sm opacity-60">
              <TrendingUp size={16} className="animate-pulse" />
              Loading appointments...
            </div>
          </div>
        ) : list.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 grid place-items-center mb-4">
              <Inbox size={26} className="text-blue-500" />
            </div>
            <p className="font-semibold text-lg">
              No appointments {isToday ? 'today' : 'on this date'}
            </p>
            <p className="text-sm opacity-50 mt-1 max-w-xs">
              {isToday
                ? 'Your queue is empty. Enjoy the breather.'
                : 'Try another date using the navigator above.'}
            </p>
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
              const p = patients[a.patient_id];

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
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      {/* Token */}
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

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <p className="font-semibold truncate">
                            {p?.name || 'Unknown patient'}
                          </p>
                          {isCompleted && (
                            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 font-semibold flex items-center gap-1">
                              <CheckCircle2 size={9} /> Done
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs opacity-60">
                          <span className="font-mono">{a.patient_id}</span>
                          {p?.phone && (
                            <span className="flex items-center gap-1">
                              <User size={11} /> {p.phone}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs mt-1.5">
                          <span
                            className={`flex items-center gap-1 font-medium ${
                              isOnline ? 'text-blue-500' : 'text-emerald-500'
                            }`}
                          >
                            {isOnline ? <Wifi size={11} /> : <MapPin size={11} />}
                            <span className="capitalize">{a.type}</span>
                          </span>
                          <span className="flex items-center gap-1 opacity-50">
                            <Clock size={11} /> {a.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action */}
                    <div className="flex-shrink-0 sm:ml-auto">
                      <Link
                        href={`/doctor/prescribe/${a.id}`}
                        className={`text-sm inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition ${
                          isCompleted ? 'btn-ghost' : 'btn-primary'
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

/* ─── SUMMARY PILL ─── */
function SummaryPill({ icon: Icon, label, value, color, bg }) {
  return (
    <div className={`flex items-center gap-2.5 px-3 py-2 rounded-xl ${bg}`}>
      <Icon size={15} className={color} />
      <div className="leading-tight">
        <p className="text-[10px] uppercase tracking-wider opacity-60 font-medium">
          {label}
        </p>
        <p className={`text-sm font-bold ${color}`}>{value}</p>
      </div>
    </div>
  );
}

/* ─── CAPACITY BAR ─── */
function CapacityBar({ icon: Icon, label, used, total, color, textColor, bgColor }) {
  const pct = Math.min((used / total) * 100, 100);
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-lg ${bgColor} grid place-items-center`}>
            <Icon size={13} className={textColor} />
          </div>
          <span className="text-xs font-medium opacity-70">{label}</span>
        </div>
        <span className={`text-xs font-semibold ${textColor} tabular-nums`}>
          {used} / {total}
        </span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 dark:bg-neutral-800 overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* ─── FILTER CHIP ─── */
function Chip({ active, onClick, children }) {
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