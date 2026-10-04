'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabase';
import {
  ClipboardList, Stethoscope, Calendar, Pill, Utensils,
  FileText, AlertCircle, ChevronDown, History,
  HeartPulse, Info
} from 'lucide-react';

export default function Prescriptions() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [list, setList] = useState([]);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('medtech-user') || 'null');
    if (!u || u.role !== 'patient') return router.push('/login');
    setUser(u);
    load(u.id);
  }, [router]);

  const load = async (pid) => {
    const { data } = await supabase
      .from('prescriptions')
      .select('*')
      .eq('patient_id', pid)
      .order('created_at', { ascending: false });

    const rows = data || [];

    // Enrich with doctor info
    const docIds = [...new Set(rows.map(r => r.doctor_id))];
    if (docIds.length) {
      const { data: doctors } = await supabase
        .from('doctors')
        .select('doctor_id,name,specialty')
        .in('doctor_id', docIds);
      const map = Object.fromEntries((doctors || []).map(d => [d.doctor_id, d]));
      rows.forEach(r => { r._doctor = map[r.doctor_id]; });
    }

    setList(rows);
    // Expand the newest prescription by default
    if (rows[0]) setExpanded({ [rows[0].id]: true });
  };

  const toggle = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  if (!user) return null;

  return (
    <>
      <Navbar role="patient" name={user.name} />

      <main className="max-w-5xl mx-auto p-4 md:p-8">
        {/* ─── HEADER ─── */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-2">
            <ClipboardList size={14} />
            <span>Medical Records</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Your prescriptions
          </h1>
          <p className="opacity-60 mt-2 text-sm">
            Diagnoses, medicines and diet advice from your doctors
          </p>
        </div>

        {/* ─── EMPTY STATE ─── */}
        {list.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 grid place-items-center mb-4">
              <ClipboardList size={26} className="text-emerald-500" />
            </div>
            <p className="font-semibold text-lg">No prescriptions yet</p>
            <p className="text-sm opacity-50 mt-1 max-w-xs">
              After your appointment, your doctor's prescriptions will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {list.map((p, idx) => {
              const open = expanded[p.id];
              const medicines = Array.isArray(p.medicines) ? p.medicines : [];
              const isLatest = idx === 0;

              return (
                <div
                  key={p.id}
                  className="card p-0 overflow-hidden transition-colors hover:border-gray-300 dark:hover:border-neutral-700"
                >
                  {/* ─── CARD HEADER (clickable) ─── */}
                  <button
                    onClick={() => toggle(p.id)}
                    className="w-full text-left p-5 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-neutral-900/40 transition-colors"
                  >
                    {/* Doctor avatar */}
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 grid place-items-center text-white font-bold flex-shrink-0 shadow-sm shadow-emerald-500/20">
                      {(p._doctor?.name || p.doctor_id)
                        .replace('Dr. ', '')
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold truncate">
                          {p._doctor?.name || p.doctor_id}
                        </p>
                        {isLatest && (
                          <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold">
                            Latest
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs opacity-60 mt-1">
                        {p._doctor?.specialty && (
                          <span className="flex items-center gap-1">
                            <Stethoscope size={11} /> {p._doctor.specialty}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar size={11} />
                          {new Date(p.created_at).toLocaleDateString('en-US', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}
                        </span>
                        {medicines.length > 0 && (
                          <span className="flex items-center gap-1">
                            <Pill size={11} />
                            {medicines.length} medicine{medicines.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Chevron */}
                    <ChevronDown
                      size={18}
                      className={`opacity-40 transition-transform duration-300 flex-shrink-0 ${
                        open ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {/* ─── EXPANDED BODY ─── */}
                  <div
                    className={`grid transition-all duration-300 ease-in-out ${
                      open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="px-5 pb-5 pt-1 border-t border-gray-100 dark:border-neutral-800/70">
                        {/* Diagnosis */}
                        {p.diagnosis && (
                          <Section
                            icon={HeartPulse}
                            iconColor="text-red-500"
                            iconBg="bg-red-500/10"
                            title="Diagnosis"
                          >
                            <p className="text-sm leading-relaxed">{p.diagnosis}</p>
                          </Section>
                        )}

                        {/* Notes */}
                        {p.notes && (
                          <Section
                            icon={FileText}
                            iconColor="text-blue-500"
                            iconBg="bg-blue-500/10"
                            title="Notes"
                          >
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{p.notes}</p>
                          </Section>
                        )}

                        {/* Diet */}
                        {p.diet && (
                          <Section
                            icon={Utensils}
                            iconColor="text-orange-500"
                            iconBg="bg-orange-500/10"
                            title="Diet Advice"
                          >
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{p.diet}</p>
                          </Section>
                        )}

                        {/* Medicines */}
                        {medicines.length > 0 && (
                          <Section
                            icon={Pill}
                            iconColor="text-emerald-500"
                            iconBg="bg-emerald-500/10"
                            title={`Medicines (${medicines.length})`}
                          >
                            <div className="grid sm:grid-cols-2 gap-2">
                              {medicines.map((m, i) => (
                                <div
                                  key={i}
                                  className="p-3 rounded-xl border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900/50"
                                >
                                  <div className="flex items-start justify-between gap-2 mb-2">
                                    <p className="font-medium text-sm truncate">
                                      {m.name || 'Unnamed'}
                                    </p>
                                    {m.dosage && (
                                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium flex-shrink-0">
                                        {m.dosage}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3 text-xs opacity-60">
                                    {m.times_per_day && (
                                      <span className="flex items-center gap-1">
                                        <Clock size={11} /> {m.times_per_day}x/day
                                      </span>
                                    )}
                                    {m.duration_days && (
                                      <span className="flex items-center gap-1">
                                        <Calendar size={11} /> {m.duration_days} days
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </Section>
                        )}

                        {/* Fallback if empty */}
                        {!p.diagnosis && !p.notes && !p.diet && medicines.length === 0 && (
                          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-gray-50 dark:bg-neutral-900/50 border border-gray-200 dark:border-neutral-800 mt-3">
                            <Info size={14} className="opacity-50 mt-0.5 flex-shrink-0" />
                            <p className="text-xs opacity-60">
                              This prescription has no additional details recorded.
                            </p>
                          </div>
                        )}
                      </div>
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

/* ─── SECTION HELPER ─── */
function Section({ icon: Icon, iconColor, iconBg, title, children }) {
  return (
    <div className="mt-5 first:mt-4">
      <div className="flex items-center gap-2 mb-2.5">
        <div className={`w-7 h-7 rounded-lg ${iconBg} grid place-items-center flex-shrink-0`}>
          <Icon size={14} className={iconColor} />
        </div>
        <h3 className="text-xs uppercase tracking-wider font-semibold opacity-70">
          {title}
        </h3>
      </div>
      <div className="pl-9">{children}</div>
    </div>
  );
}