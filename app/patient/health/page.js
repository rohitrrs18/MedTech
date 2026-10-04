'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabase';
import { Activity } from 'lucide-react';

export default function Health() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ weight: '', height: '' });
  const [msg, setMsg] = useState('');
  const [bmi, setBmi] = useState(null);

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('medtech-user') || 'null');
    if (!u || u.role !== 'patient') return router.push('/login');
    setUser(u);
    supabase.from('patients').select('weight,height').eq('patient_id', u.id).single()
      .then(({ data }) => {
        if (data?.weight) setForm({ weight: data.weight, height: data.height });
        computeBmi(data?.weight, data?.height);
      });
  }, [router]);

  const computeBmi = (w, h) => {
    if (w && h) setBmi((w / ((h / 100) ** 2)).toFixed(1));
  };

  const save = async () => {
    setMsg('');
    const { error } = await supabase.from('patients')
      .update({ weight: parseFloat(form.weight), height: parseFloat(form.height) })
      .eq('patient_id', user.id);
    if (error) return setMsg(error.message);
    computeBmi(form.weight, form.height);
    setMsg('Saved');
  };

  if (!user) return null;

  const getCategory = () => {
    if (!bmi) return '';
    const b = parseFloat(bmi);
    if (b < 18.5) return 'Underweight';
    if (b < 25) return 'Normal';
    if (b < 30) return 'Overweight';
    return 'Obese';
  };

  return (
    <>
      <Navbar role="patient" name={user.name} />
      <main className="max-w-3xl mx-auto p-4 md:p-8">
        <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
          <Activity className="text-orange-500" /> Health Record
        </h1>
        <div className="card">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm opacity-60">Weight (kg)</label>
              <input className="input mt-1" type="number" value={form.weight}
                onChange={e => setForm({ ...form, weight: e.target.value })} />
            </div>
            <div>
              <label className="text-sm opacity-60">Height (cm)</label>
              <input className="input mt-1" type="number" value={form.height}
                onChange={e => setForm({ ...form, height: e.target.value })} />
            </div>
          </div>
          <button onClick={save} className="btn-primary mt-4">Save</button>
          {msg && <p className="text-sm mt-2 text-emerald-500">{msg}</p>}

          {bmi && (
            <div className="mt-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <p className="text-sm opacity-70">Your BMI</p>
              <p className="text-3xl font-bold text-emerald-500">{bmi}</p>
              <p className="text-sm">{getCategory()}</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}