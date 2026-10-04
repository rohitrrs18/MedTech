'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabase';
import {
  Plus, Trash2, Save, Stethoscope, Pill, FileText, Utensils,
  HeartPulse, User, Clock, Calendar, Wifi, MapPin, AlertCircle,
  CheckCircle2, Loader2, ArrowLeft, ClipboardList, Info
} from 'lucide-react';

export default function Prescribe() {
  const router = useRouter();
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [appt, setAppt] = useState(null);
  const [patient, setPatient] = useState(null);
  const [existing, setExisting] = useState(null);
  const [form, setForm] = useState({
    diagnosis: '',
    notes: '',
    diet: '',
    medicines: [],
  });
  const [msg, setMsg] = useState({ text: '', kind: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('medtech-user') || 'null');
    if (!u || u.role !== 'doctor') return router.push('/login');
    setUser(u);
    loadAll();
  }, [router, id]);

  const loadAll = async () => {
    const { data: a } = await supabase
      .from('appointments').select('*').eq('id', id).single();
    setAppt(a);

    if (a?.patient_id) {
      const { data: p } = await supabase
        .from('patients')
        .select('*')
        .eq('patient_id', a.patient_id)
        .maybeSingle();
      setPatient(p);
    }

    const { data: existingPresc } = await supabase
      .from('prescriptions')
      .select('*')
      .eq('appointment_id', id)
      .maybeSingle();

    if (existingPresc) {
      setExisting(existingPresc);
      setForm({
        diagnosis: existingPresc.diagnosis || '',
        notes: existingPresc.notes || '',
        diet: existingPresc.diet || '',
        medicines: Array.isArray(existingPresc.medicines) ? existingPresc.medicines : [],
      });
    } else {
      // default: one empty medicine row for convenience
      setForm(f => ({ ...f, medicines: [{ name: '', dosage: '', times_per_day: 1, duration_days: 5 }] }));
    }
  };

  const addMed = () => {
    setForm({
      ...form,
      medicines: [
        ...form.medicines,
        { name: '', dosage: '', times_per_day: 1, duration_days: 5 },
      ],
    });
  };

  const updateMed = (i, key, val) => {
    const arr = [...form.medicines];
    arr[i] = { ...arr[i], [key]: val };
    setForm({ ...form, medicines: arr });
  };

  const removeMed = (i) => {
    setForm({
      ...form,
      medicines: form.medicines.filter((_, idx) => idx !== i),
    });
  };

  const save = async () => {
    setMsg({ text: '', kind: '' });
    if (!appt) return;

    const validMeds = form.medicines.filter((m) => m.name?.trim());
    if (!form.diagnosis.trim() && validMeds.length === 0) {
      return setMsg({
        text: 'Please add a diagnosis or at least one medicine',
        kind: 'error',
      });
    }

    setSaving(true);
    try {
      // If editing an existing prescription, delete old trackers first
      if (existing) {
        await supabase
          .from('medicine_tracker')
          .delete()
          .eq('prescription_id', existing.id);

        await supabase
          .from('prescriptions')
          .update({
            diagnosis: form.diagnosis,
            notes: form.notes,
            diet: form.diet,
            medicines: validMeds,
          })
          .eq('id', existing.id);
      } else {
        const { error } = await supabase.from('prescriptions').insert({
          appointment_id: appt.id,
          patient_id: appt.patient_id,
          doctor_id: user.id,
          diagnosis: form.diagnosis,
          notes: form.notes,
          diet: form.diet,
          medicines: validMeds,
        });
        if (error) throw error;
      }

      // Fetch the prescription id (for creating trackers)
      const { data: presc } = await supabase
        .from('prescriptions')
        .select('id')
        .eq('appointment_id', appt.id)
        .single();

      const today = new Date().toISOString().slice(0, 10);
      for (const m of validMeds) {
        const end = new Date();
        end.setDate(end.getDate() + parseInt(m.duration_days || 1));

        await supabase.from('medicine_tracker').insert({
          patient_id: appt.patient_id,
          prescription_id: presc.id,
          medicine_name: m.name.trim(),
          dosage: m.dosage || '',
          times_per_day: parseInt(m.times_per_day) || 1,
          duration_days: parseInt(m.duration_days) || 1,
          start_date: today,
          end_date: end.toISOString().slice(0, 10),
          taken_log: [],
        });
      }

      await supabase
        .from('appointments')
        .update({ status: 'completed' })
        .eq('id', appt.id);

      setMsg({ text: 'Prescription saved successfully', kind: 'success' });
      setTimeout(() => router.push('/doctor/dashboard'), 1200);
    } catch (e) {
      setMsg({ text: 'Error: ' + e.message, kind: 'error' });
    }
    setSaving(false);
  };

  if (!user || !appt) {
    return (
      <>
        <Navbar role="doctor" name={user?.name} />
        <main className="max-w-4xl mx-auto p-8">
          <p className="opacity-60">Loading appointment...</p>
        </main>
      </>
    );
  }

  const isOnline = appt.type === 'online';
  const validMedsCount = form.medicines.filter((m) => m.name?.trim()).length;

  return (
    <>
      <Navbar role="doctor" name={user.name} />

      <main className="max-w-4xl mx-auto p-4 md:p-8">
        {/* ─── BACK + HEADER ─── */}
        <Link
          href="/doctor/dashboard"
          className="inline-flex items-center gap-1.5 text-xs opacity-60 hover:opacity-100 transition mb-4"
        >
          <ArrowLeft size={13} /> Back to queue
        </Link>

        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-2">
            <ClipboardList size={14} />
            <span>{existing ? 'Edit Prescription' : 'New Prescription'}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            {existing ? 'Update prescription' : 'Write prescription'}
          </h1>
          <p className="opacity-60 mt-2 text-sm">
            Fill in the diagnosis, medicines, and diet advice for this consultation
          </p>
        </div>

        {/* ─── PATIENT CARD ─── */}
        <div className="relative overflow-hidden rounded-3xl border border-gray-200 dark:border-neutral-800 bg-gradient-to-br from-blue-500/5 via-transparent to-emerald-500/5 dark:from-blue-500/10 dark:to-emerald-500/10 p-5 md:p-6 mb-6">
          <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

          <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Avatar */}
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 grid place-items-center text-white font-bold text-lg flex-shrink-0 shadow-lg shadow-emerald-500/20">
              {(patient?.name || appt.patient_id).charAt(0).toUpperCase()}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-base truncate">
                {patient?.name || 'Patient'}
              </p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs opacity-60 mt-1">
                <span className="font-mono">{appt.patient_id}</span>
                {patient?.phone && (
                  <span className="flex items-center gap-1">
                    <User size={11} /> {patient.phone}
                  </span>
                )}
              </div>
            </div>

            {/* Token chip */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                  isOnline
                    ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {isOnline ? <Wifi size={12} /> : <MapPin size={12} />}
                {appt.type}
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wider opacity-50 font-medium">
                  Token
                </p>
                <p className="font-bold text-lg leading-tight">#{appt.token_number}</p>
              </div>
            </div>
          </div>

          {/* Meta row */}
          <div className="relative mt-4 pt-4 border-t border-gray-200 dark:border-neutral-800/70 flex flex-wrap gap-x-4 gap-y-1.5 text-xs opacity-60">
            <span className="flex items-center gap-1.5">
              <Calendar size={12} /> {appt.appointment_date}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock size={12} /> Status: {appt.status}
            </span>
            {patient?.weight && patient?.height && (
              <span className="flex items-center gap-1.5">
                <Info size={12} /> {patient.weight} kg · {patient.height} cm
              </span>
            )}
          </div>
        </div>

        {/* ─── EDIT NOTICE ─── */}
        {existing && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-sm mb-6">
            <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
            <span>
              A prescription already exists for this appointment. Saving will
              replace the previous version and reset the patient's medicine tracker.
            </span>
          </div>
        )}

        {/* ─── FORM ─── */}
        <div className="space-y-4">
          {/* Diagnosis */}
          <FormSection
            icon={HeartPulse}
            iconColor="text-red-500"
            iconBg="bg-red-500/10"
            title="Diagnosis"
            hint="Primary condition or reason for visit"
          >
            <input
              className="input"
              placeholder="e.g. Acute bronchitis"
              value={form.diagnosis}
              onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
            />
          </FormSection>

          {/* Medicines */}
          <FormSection
            icon={Pill}
            iconColor="text-emerald-500"
            iconBg="bg-emerald-500/10"
            title="Medicines"
            hint={`${validMedsCount} medicine${validMedsCount !== 1 ? 's' : ''} added`}
            action={
              <button
                onClick={addMed}
                className="btn-ghost text-xs inline-flex items-center gap-1.5 py-1.5 px-3"
              >
                <Plus size={13} /> Add medicine
              </button>
            }
          >
            {form.medicines.length === 0 ? (
              <div className="text-center py-6 rounded-xl border-2 border-dashed border-gray-200 dark:border-neutral-800">
                <Pill size={20} className="mx-auto opacity-30 mb-2" />
                <p className="text-sm opacity-50">No medicines added yet</p>
                <button
                  onClick={addMed}
                  className="text-emerald-500 text-xs font-medium mt-1 hover:underline"
                >
                  Add your first medicine
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {form.medicines.map((m, i) => (
                  <MedicineRow
                    key={i}
                    index={i}
                    med={m}
                    onChange={(key, val) => updateMed(i, key, val)}
                    onRemove={() => removeMed(i)}
                  />
                ))}
              </div>
            )}
          </FormSection>

          {/* Notes */}
          <FormSection
            icon={FileText}
            iconColor="text-blue-500"
            iconBg="bg-blue-500/10"
            title="Clinical Notes"
            hint="Optional observations and instructions"
          >
            <textarea
              className="input resize-none"
              rows={3}
              placeholder="e.g. Rest for 3 days, follow up if fever persists"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </FormSection>

          {/* Diet */}
          <FormSection
            icon={Utensils}
            iconColor="text-orange-500"
            iconBg="bg-orange-500/10"
            title="Diet Advice"
            hint="Optional nutritional guidance"
          >
            <textarea
              className="input resize-none"
              rows={2}
              placeholder="e.g. Avoid cold drinks, increase warm fluids"
              value={form.diet}
              onChange={(e) => setForm({ ...form, diet: e.target.value })}
            />
          </FormSection>

          {/* Message */}
          {msg.text && (
            <div
              className={`flex items-start gap-2.5 p-3 rounded-xl border text-sm ${
                msg.kind === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                  : 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'
              }`}
            >
              {msg.kind === 'success' ? (
                <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" />
              ) : (
                <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              )}
              <span>{msg.text}</span>
            </div>
          )}

          {/* Save bar */}
          <div className="sticky bottom-4 flex items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-[#141414] border border-gray-200 dark:border-neutral-800 shadow-lg shadow-black/5 dark:shadow-black/40 backdrop-blur">
            <div className="text-xs opacity-60 hidden sm:block">
              {validMedsCount > 0 ? (
                <>
                  <span className="font-semibold">{validMedsCount}</span> medicine
                  {validMedsCount !== 1 ? 's' : ''} will be saved and tracked
                </>
              ) : (
                'No medicines to track yet'
              )}
            </div>
            <button
              onClick={save}
              disabled={saving}
              className="btn-primary inline-flex items-center gap-2 flex-shrink-0"
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save size={16} /> {existing ? 'Update' : 'Save'} prescription
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </>
  );
}

/* ─── FORM SECTION ─── */
function FormSection({ icon: Icon, iconColor, iconBg, title, hint, action, children }) {
  return (
    <div className="card">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl ${iconBg} grid place-items-center flex-shrink-0`}>
            <Icon size={17} className={iconColor} />
          </div>
          <div>
            <h3 className="font-semibold text-sm">{title}</h3>
            {hint && <p className="text-[11px] opacity-50 mt-0.5">{hint}</p>}
          </div>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

/* ─── MEDICINE ROW ─── */
function MedicineRow({ index, med, onChange, onRemove }) {
  const dosagePresets = ['500mg', '250mg', '100mg', '5ml', '10ml', '1 tablet'];
  const frequencyOptions = [1, 2, 3, 4];
  const durationOptions = [3, 5, 7, 10, 14, 30];

  return (
    <div className="p-4 rounded-xl border border-gray-200 dark:border-neutral-800 bg-gray-50/50 dark:bg-neutral-900/30">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-emerald-500/10 grid place-items-center text-emerald-500 text-[10px] font-bold">
            {index + 1}
          </span>
          <span className="text-xs font-medium opacity-60">
            {med.name || 'New medicine'}
          </span>
        </div>
        <button
          onClick={onRemove}
          className="w-7 h-7 rounded-lg grid place-items-center text-red-500 hover:bg-red-500/10 transition"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Name */}
      <input
        className="input mb-3"
        placeholder="Medicine name (e.g. Amoxicillin)"
        value={med.name}
        onChange={(e) => onChange('name', e.target.value)}
      />

      {/* Dosage */}
      <label className="block text-[10px] uppercase tracking-wider opacity-50 font-medium mb-1.5">
        Dosage
      </label>
      <input
        className="input mb-2"
        placeholder="e.g. 500mg"
        value={med.dosage}
        onChange={(e) => onChange('dosage', e.target.value)}
      />
      <div className="flex flex-wrap gap-1.5 mb-3">
        {dosagePresets.map((p) => (
          <button
            key={p}
            onClick={() => onChange('dosage', p)}
            className={`text-[11px] px-2 py-1 rounded-md border transition ${
              med.dosage === p
                ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'border-gray-200 dark:border-neutral-800 hover:border-emerald-500/30'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Frequency + Duration */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] uppercase tracking-wider opacity-50 font-medium mb-1.5">
            Times / day
          </label>
          <div className="flex gap-1">
            {frequencyOptions.map((n) => (
              <button
                key={n}
                onClick={() => onChange('times_per_day', n)}
                className={`flex-1 py-1.5 rounded-md border text-xs font-medium transition ${
                  parseInt(med.times_per_day) === n
                    ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'border-gray-200 dark:border-neutral-800 hover:border-emerald-500/30'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-[10px] uppercase tracking-wider opacity-50 font-medium mb-1.5">
            Duration (days)
          </label>
          <div className="flex flex-wrap gap-1">
            {durationOptions.map((n) => (
              <button
                key={n}
                onClick={() => onChange('duration_days', n)}
                className={`py-1.5 px-2 rounded-md border text-xs font-medium transition ${
                  parseInt(med.duration_days) === n
                    ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'border-gray-200 dark:border-neutral-800 hover:border-emerald-500/30'
                }`}
              >
                {n}d
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}