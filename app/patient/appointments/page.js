'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabase';
import {
  Calendar, Clock, Stethoscope, Wifi, MapPin,
  CheckCircle2, AlertCircle, Loader2, ChevronDown,
  CalendarPlus, History, ArrowRight
} from 'lucide-react';

export default function Appointments() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [list, setList] = useState([]);
  const [form, setForm] = useState({
    doctor_id: '',
    type: 'online',
    date: new Date().toISOString().slice(0, 10),
  });
  const [msg, setMsg] = useState({ text: '', kind: '' });
  const [booking, setBooking] = useState(false);
  const [slots, setSlots] = useState({ online: 0, offline: 0 });

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('medtech-user') || 'null');
    if (!u || u.role !== 'patient') return router.push('/login');
    setUser(u);
    loadDoctors();
    loadList(u.id);
  }, [router]);

  useEffect(() => {
    if (form.doctor_id && form.date) loadSlots();
  }, [form.doctor_id, form.date]);

  const loadDoctors = async () => {
    const { data } = await supabase.from('doctors').select('*').order('doctor_id');
    setDoctors(data || []);
  };

  const loadList = async (pid) => {
    const { data } = await supabase
      .from('appointments')
      .select('*, doctors:doctor_id(name,specialty)')
      .eq('patient_id', pid)
      .order('created_at', { ascending: false });
    setList(data || []);
  };

  const loadSlots = async () => {
    const { doctor_id, date } = form;
    const [on, off] = await Promise.all([
      supabase.from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('doctor_id', doctor_id).eq('appointment_date', date).eq('type', 'online'),
      supabase.from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('doctor_id', doctor_id).eq('appointment_date', date).eq('type', 'offline'),
    ]);
    setSlots({ online: on.count || 0, offline: off.count || 0 });
  };

  const book = async () => {
    setMsg({ text: '', kind: '' });
    if (!form.doctor_id) return setMsg({ text: 'Please select a doctor first', kind: 'error' });

    setBooking(true);
    const { doctor_id, type, date } = form;
    const limit = type === 'online' ? 30 : 70;

    const { count } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('doctor_id', doctor_id)
      .eq('appointment_date', date)
      .eq('type', type);

    if ((count || 0) >= limit) {
      setMsg({ text: `All ${type} slots are full for this doctor on ${date}`, kind: 'error' });
      setBooking(false);
      return;
    }

    const { data: existing } = await supabase
      .from('appointments')
      .select('token_number')
      .eq('doctor_id', doctor_id)
      .eq('appointment_date', date)
      .eq('type', type)
      .order('token_number', { ascending: false })
      .limit(1);

    const nextToken = existing?.[0]?.token_number ? existing[0].token_number + 1 : 1;

    const { error } = await supabase.from('appointments').insert({
      patient_id: user.id,
      doctor_id,
      type,
      token_number: nextToken,
      appointment_date: date,
    });

    if (error) {
      setMsg({ text: error.message, kind: 'error' });
      setBooking(false);
      return;
    }

    setMsg({ text: `Confirmed — your token is #${nextToken}`, kind: 'success' });
    loadList(user.id);
    loadSlots();
    setBooking(false);
  };

  if (!user) return null;

  const selectedDoctor = doctors.find(d => d.doctor_id === form.doctor_id);

  return (
    <>
      <Navbar role="patient" name={user.name} />

      <main className="max-w-7xl mx-auto p-4 md:p-8">
        {/* ─── HEADER ─── */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-2">
            <Calendar size={14} />
            <span>Appointments</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Book & manage visits
          </h1>
          <p className="opacity-60 mt-2 text-sm">
            Choose a doctor and reserve your online or offline token
          </p>
        </div>

        {/* ─── BOOKING PANEL ─── */}
        <div className="relative overflow-hidden rounded-3xl border border-gray-200 dark:border-neutral-800 bg-gradient-to-br from-emerald-500/5 via-transparent to-blue-500/5 dark:from-emerald-500/10 dark:to-blue-500/10 p-6 md:p-8 mb-8">
          <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

          <div className="relative flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 grid place-items-center">
              <CalendarPlus size={20} className="text-emerald-500" />
            </div>
            <div>
              <h2 className="font-bold text-lg">New Appointment</h2>
              <p className="text-xs opacity-60">Online max 30 • Offline max 70 per doctor per day</p>
            </div>
          </div>

          <div className="relative grid md:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Doctor */}
            <div className="relative">
              <label className="block text-[11px] uppercase tracking-wider opacity-50 font-medium mb-1.5">
                Doctor
              </label>
              <div className="relative">
                <Stethoscope size={15} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40 pointer-events-none" />
                <select
                  className="input pl-9 pr-8 appearance-none cursor-pointer"
                  value={form.doctor_id}
                  onChange={e => setForm({ ...form, doctor_id: e.target.value })}
                >
                  <option value="">Select a doctor</option>
                  {doctors.map(d => (
                    <option key={d.doctor_id} value={d.doctor_id}>
                      {d.name} — {d.specialty}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 opacity-40 pointer-events-none" />
              </div>
            </div>

            {/* Type */}
            <div>
              <label className="block text-[11px] uppercase tracking-wider opacity-50 font-medium mb-1.5">
                Consultation
              </label>
              <div className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-gray-100 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, type: 'online' })}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium transition ${
                    form.type === 'online'
                      ? 'bg-white dark:bg-neutral-800 shadow text-blue-500'
                      : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  <Wifi size={14} /> Online
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, type: 'offline' })}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium transition ${
                    form.type === 'offline'
                      ? 'bg-white dark:bg-neutral-800 shadow text-emerald-500'
                      : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  <MapPin size={14} /> Offline
                </button>
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="block text-[11px] uppercase tracking-wider opacity-50 font-medium mb-1.5">
                Date
              </label>
              <div className="relative">
                <Clock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40 pointer-events-none" />
                <input
                  type="date"
                  className="input pl-9"
                  value={form.date}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={e => setForm({ ...form, date: e.target.value })}
                />
              </div>
            </div>

            {/* Book */}
            <div className="flex items-end">
              <button
                onClick={book}
                disabled={booking || !form.doctor_id}
                className="btn-primary w-full inline-flex items-center justify-center gap-2 h-[42px]"
              >
                {booking ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Booking...
                  </>
                ) : (
                  <>
                    Book <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Slot indicator */}
          {form.doctor_id && (
            <div className="relative mt-4 flex flex-wrap items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium">
                <Wifi size={12} /> {slots.online}/30 online booked
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">
                <MapPin size={12} /> {slots.offline}/70 offline booked
              </span>
              {selectedDoctor && (
                <span className="opacity-50">
                  for {selectedDoctor.name} on {form.date}
                </span>
              )}
            </div>
          )}

          {/* Message */}
          {msg.text && (
            <div
              className={`relative mt-4 flex items-start gap-2.5 p-3 rounded-xl border text-sm ${
                msg.kind === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                  : 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'
              }`}
            >
              {msg.kind === 'success' ? <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" /> : <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />}
              <span>{msg.text}</span>
            </div>
          )}
        </div>

        {/* ─── APPOINTMENT LIST ─── */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <History size={16} className="opacity-50" />
            <h2 className="font-bold text-lg">My Appointments</h2>
            {list.length > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-neutral-800 opacity-70 font-medium">
                {list.length}
              </span>
            )}
          </div>
        </div>

        {list.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-14 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-neutral-800 grid place-items-center mb-4">
              <Calendar size={24} className="opacity-40" />
            </div>
            <p className="font-medium">No appointments yet</p>
            <p className="text-sm opacity-50 mt-1 mb-4">
              Book your first consultation above
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {list.map(a => {
              const isOnline = a.type === 'online';
              const isCompleted = a.status === 'completed';
              const statusStyles = isCompleted
                ? 'bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-400'
                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';

              return (
                <div
                  key={a.id}
                  className="card group hover:border-gray-300 dark:hover:border-neutral-700 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {/* Token badge */}
                    <div
                      className={`relative w-14 h-14 rounded-2xl grid place-items-center flex-shrink-0 ${
                        isOnline ? 'bg-blue-500/10' : 'bg-emerald-500/10'
                      }`}
                    >
                      <span
                        className={`font-bold text-lg ${
                          isOnline ? 'text-blue-500' : 'text-emerald-500'
                        }`}
                      >
                        #{a.token_number}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">
                        {a.doctors?.name || a.doctor_id}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs opacity-60 mt-1">
                        {a.doctors?.specialty && (
                          <span className="truncate">{a.doctors.specialty}</span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar size={11} /> {a.appointment_date}
                        </span>
                        <span
                          className={`flex items-center gap-1 ${
                            isOnline ? 'text-blue-500' : 'text-emerald-500'
                          }`}
                        >
                          {isOnline ? <Wifi size={11} /> : <MapPin size={11} />}
                          <span className="capitalize">{a.type}</span>
                        </span>
                      </div>
                    </div>

                    {/* Status */}
                    <span
                      className={`text-[11px] px-2.5 py-1 rounded-full font-medium capitalize flex-shrink-0 ${statusStyles}`}
                    >
                      {a.status}
                    </span>
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