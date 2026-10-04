'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabase';
import {
  CheckCircle2, Circle, Pill, Calendar, Clock,
  Sun, Moon, Sunrise, Sunset, Sparkles, Info,
  Activity, TrendingUp, Package
} from 'lucide-react';

export default function Medicines() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [meds, setMeds] = useState([]);
  const [updating, setUpdating] = useState(null);
  const [tab, setTab] = useState('active'); // 'active' | 'past'

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('medtech-user') || 'null');
    if (!u || u.role !== 'patient') return router.push('/login');
    setUser(u);
    load(u.id);
  }, [router]);

  const load = async (pid) => {
    const { data } = await supabase
      .from('medicine_tracker')
      .select('*')
      .eq('patient_id', pid)
      .order('created_at', { ascending: false });
    setMeds(data || []);
  };

  const markDose = async (med, idx) => {
    setUpdating(`${med.id}-${idx}`);
    const log = Array.isArray(med.taken_log) ? [...med.taken_log] : [];
    const today = new Date().toISOString().slice(0, 10);
    const key = `${today}-${idx}`;
    const exists = log.includes(key);
    const newLog = exists ? log.filter(k => k !== key) : [...log, key];

    // optimistic update
    setMeds(prev =>
      prev.map(m => (m.id === med.id ? { ...m, taken_log: newLog } : m))
    );

    const { error } = await supabase
      .from('medicine_tracker')
      .update({ taken_log: newLog })
      .eq('id', med.id);

    if (error) load(user.id); // revert on error
    setUpdating(null);
  };

  if (!user) return null;

  const today = new Date().toISOString().slice(0, 10);

  // Split into active / past based on end_date
  const active = meds.filter(m => !m.end_date || m.end_date >= today);
  const past = meds.filter(m => m.end_date && m.end_date < today);

  // Aggregate today's stats
  const totalDosesToday = active.reduce((sum, m) => sum + (m.times_per_day || 0), 0);
  const takenToday = active.reduce((sum, m) => {
    const logs = Array.isArray(m.taken_log) ? m.taken_log : [];
    return sum + logs.filter(k => k.startsWith(today)).length;
  }, 0);
  const progressPct = totalDosesToday ? Math.round((takenToday / totalDosesToday) * 100) : 0;

  const list = tab === 'active' ? active : past;

  return (
    <>
      <Navbar role="patient" name={user.name} />

      <main className="max-w-5xl mx-auto p-4 md:p-8">
        {/* ─── HEADER ─── */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-2">
            <Pill size={14} />
            <span>Medicine Tracker</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            My medicines
          </h1>
          <p className="opacity-60 mt-2 text-sm">
            Track your daily doses and stay on schedule
          </p>
        </div>

        {/* ─── TODAY'S PROGRESS ─── */}
        {active.length > 0 && (
          <div className="relative overflow-hidden rounded-3xl border border-gray-200 dark:border-neutral-800 bg-gradient-to-br from-emerald-500/5 via-transparent to-teal-500/5 dark:from-emerald-500/10 dark:to-teal-500/10 p-6 mb-6">
            <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

            <div className="relative flex items-center gap-5">
              {/* Progress ring */}
              <div className="relative w-20 h-20 flex-shrink-0">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                  <circle
                    cx="40" cy="40" r="34"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="7"
                    className="text-gray-200 dark:text-neutral-800"
                  />
                  <circle
                    cx="40" cy="40" r="34"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="7"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 34}`}
                    strokeDashoffset={`${2 * Math.PI * 34 * (1 - progressPct / 100)}`}
                    className="text-emerald-500 transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 grid place-items-center">
                  <span className="text-lg font-bold tabular-nums">{progressPct}%</span>
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp size={14} className="text-emerald-500" />
                  <p className="text-xs uppercase tracking-wider font-semibold opacity-70">
                    Today's Progress
                  </p>
                </div>
                <p className="text-2xl font-bold tracking-tight">
                  {takenToday}
                  <span className="text-base opacity-50 font-normal">
                    {' '}/ {totalDosesToday} doses
                  </span>
                </p>
                <p className="text-xs opacity-60 mt-1">
                  {progressPct === 100
                    ? '🎉 All doses completed today!'
                    : progressPct === 0
                    ? "Let's start your day — tap a dose below"
                    : 'Keep going, you\'re on track'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ─── TABS ─── */}
        {meds.length > 0 && (
          <div className="flex gap-2 mb-6 p-1 rounded-xl bg-gray-100 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 max-w-xs">
            <button
              onClick={() => setTab('active')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition ${
                tab === 'active'
                  ? 'bg-white dark:bg-neutral-800 shadow'
                  : 'opacity-60 hover:opacity-100'
              }`}
            >
              <Activity size={14} /> Active
              {active.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-semibold">
                  {active.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setTab('past')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition ${
                tab === 'past'
                  ? 'bg-white dark:bg-neutral-800 shadow'
                  : 'opacity-60 hover:opacity-100'
              }`}
            >
              <Package size={14} /> Past
              {past.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-500/10 text-gray-500 font-semibold">
                  {past.length}
                </span>
              )}
            </button>
          </div>
        )}

        {/* ─── EMPTY STATE ─── */}
        {meds.length === 0 && (
          <div className="card flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 grid place-items-center mb-4">
              <Pill size={26} className="text-emerald-500" />
            </div>
            <p className="font-semibold text-lg">No medicines yet</p>
            <p className="text-sm opacity-50 mt-1 max-w-xs">
              When your doctor prescribes medicines, they'll appear here with a daily tracker.
            </p>
          </div>
        )}

        {meds.length > 0 && list.length === 0 && (
          <div className="card flex flex-col items-center justify-center py-14 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-neutral-800 grid place-items-center mb-3">
              <Package size={22} className="opacity-40" />
            </div>
            <p className="font-medium">
              {tab === 'active' ? 'No active medicines' : 'No past medicines'}
            </p>
            <p className="text-sm opacity-50 mt-1">
              {tab === 'active'
                ? 'All your prescriptions have completed'
                : 'Your completed medicines will show here'}
            </p>
          </div>
        )}

        {/* ─── MEDICINE CARDS ─── */}
        <div className="space-y-4">
          {list.map(med => {
            const logs = Array.isArray(med.taken_log) ? med.taken_log : [];
            const doneToday = logs.filter(k => k.startsWith(today)).length;
            const total = med.times_per_day || 1;
            const isComplete = doneToday >= total;
            const isPast = tab === 'past';
            const pill = med.medicine_name || 'Unnamed';

            return (
              <div
                key={med.id}
                className={`card transition-colors ${
                  isPast ? 'opacity-70' : 'hover:border-gray-300 dark:hover:border-neutral-700'
                }`}
              >
                {/* Top row: pill info + progress */}
                <div className="flex items-start gap-4 mb-5">
                  {/* Pill icon */}
                  <div
                    className={`w-12 h-12 rounded-2xl grid place-items-center flex-shrink-0 ${
                      isPast
                        ? 'bg-gray-100 dark:bg-neutral-800'
                        : isComplete
                        ? 'bg-emerald-500/10'
                        : 'bg-blue-500/10'
                    }`}
                  >
                    <Pill
                      size={22}
                      className={
                        isPast
                          ? 'opacity-40'
                          : isComplete
                          ? 'text-emerald-500'
                          : 'text-blue-500'
                      }
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <h3 className="font-semibold text-base truncate">{pill}</h3>
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${
                          isPast
                            ? 'bg-gray-100 dark:bg-neutral-800 text-gray-500'
                            : isComplete
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                        }`}
                      >
                        {isPast
                          ? 'Completed'
                          : isComplete
                          ? '✓ Done today'
                          : `${doneToday}/${total} today`}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs opacity-60">
                      {med.dosage && (
                        <span className="flex items-center gap-1">
                          <Info size={11} /> {med.dosage}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock size={11} /> {total}x/day
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={11} /> {med.duration_days} days
                      </span>
                    </div>

                    {/* Date range */}
                    {(med.start_date || med.end_date) && (
                      <p className="text-[11px] opacity-40 mt-1.5 font-mono">
                        {med.start_date} → {med.end_date}
                      </p>
                    )}
                  </div>
                </div>

                {/* Dose buttons */}
                {!isPast && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {Array.from({ length: total }).map((_, i) => {
                      const done = logs.includes(`${today}-${i}`);
                      const timeLabel = getTimeLabel(i, total);
                      const TimeIcon = getTimeIcon(i, total);
                      const busy = updating === `${med.id}-${i}`;

                      return (
                        <button
                          key={i}
                          onClick={() => markDose(med, i)}
                          disabled={busy}
                          className={`group relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                            done
                              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : 'border-gray-200 dark:border-neutral-800 hover:border-blue-500/40 hover:bg-blue-500/5'
                          }`}
                        >
                          <span className="flex-shrink-0">
                            {done ? (
                              <CheckCircle2 size={18} className="text-emerald-500" />
                            ) : (
                              <Circle size={18} className="opacity-50" />
                            )}
                          </span>
                          <span className="flex items-center gap-1.5 min-w-0">
                            <TimeIcon size={13} className="opacity-70 flex-shrink-0" />
                            <span className="truncate">{timeLabel}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Completion bar for active meds */}
                {!isPast && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-[11px] opacity-50 mb-1.5">
                      <span>Daily progress</span>
                      <span className="tabular-nums">{doneToday}/{total}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-100 dark:bg-neutral-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isComplete
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                            : 'bg-gradient-to-r from-blue-500 to-cyan-500'
                        }`}
                        style={{ width: `${(doneToday / total) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </>
  );
}

/* ─── Helpers ─── */
function getTimeLabel(idx, total) {
  if (total === 1) return 'Once daily';
  if (total === 2) return idx === 0 ? 'Morning' : 'Night';
  if (total === 3) return ['Morning', 'Afternoon', 'Night'][idx] || `Dose ${idx + 1}`;
  return `Dose ${idx + 1}`;
}

function getTimeIcon(idx, total) {
  if (total === 1) return Sun;
  if (total === 2) return idx === 0 ? Sunrise : Moon;
  if (total === 3) return [Sunrise, Sun, Moon][idx] || Clock;
  return Clock;
}