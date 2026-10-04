'use client';
export const dynamic = 'force-dynamic';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  Heart, Stethoscope, User, Mail, Phone,
  Loader2, AlertCircle, ArrowRight, UserPlus, LogIn, Sparkles
} from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';

export default function LoginPage() {
  const router = useRouter();
  const [flipped, setFlipped] = useState(false);
  const [role, setRole] = useState('patient');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [lEmail, setLEmail] = useState('');
  const [lPhone, setLPhone] = useState('');
  const [rName, setRName] = useState('');
  const [rEmail, setREmail] = useState('');
  const [rPhone, setRPhone] = useState('');

  const handleLogin = async () => {
    setError('');
    if (!lEmail.trim()) return setError('Please enter your email');
    if (role === 'patient' && !lPhone.trim()) return setError('Please enter your phone');

    setLoading(true);
    try {
      const email = lEmail.trim().toLowerCase();
      if (role === 'doctor') {
        const { data, error } = await supabase
          .from('doctors').select('*').eq('email', email).maybeSingle();
        if (error) throw error;
        if (!data) throw new Error('Doctor not found');
        localStorage.setItem('medtech-user', JSON.stringify({
          role: 'doctor', name: data.name, id: data.doctor_id, email: data.email,
        }));
        router.push('/doctor/dashboard');
      } else {
        const { data, error } = await supabase
          .from('patients').select('*')
          .eq('email', email).eq('phone', lPhone.trim())
          .maybeSingle();
        if (error) throw error;
        if (!data) throw new Error('No account found with those credentials');
        localStorage.setItem('medtech-user', JSON.stringify({
          role: 'patient', name: data.name, id: data.patient_id, email: data.email,
        }));
        router.push('/patient/dashboard');
      }
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const handleRegister = async () => {
    setError('');
    if (!rName.trim()) return setError('Please enter your full name');
    if (!rEmail.trim()) return setError('Please enter your email');
    if (!rPhone.trim()) return setError('Please enter your phone');

    setLoading(true);
    try {
      const patientId = 'PT' + Date.now().toString().slice(-8);
      const { data, error } = await supabase
        .from('patients')
        .insert({
          patient_id: patientId,
          name: rName.trim(),
          email: rEmail.trim().toLowerCase(),
          phone: rPhone.trim(),
        })
        .select().single();
      if (error) throw error;
      localStorage.setItem('medtech-user', JSON.stringify({
        role: 'patient', name: data.name, id: data.patient_id, email: data.email,
      }));
      router.push('/patient/dashboard');
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const switchToRegister = () => { setFlipped(true); setError(''); };
  const switchToLogin = () => { setFlipped(false); setError(''); };

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col relative">
      {/* Background orbs */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute top-[-20%] left-[-15%] w-[35rem] h-[35rem] rounded-full bg-emerald-500/10 dark:bg-emerald-500/15 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-15%] w-[35rem] h-[35rem] rounded-full bg-blue-500/10 dark:bg-blue-500/15 blur-[120px]" />
      </div>

      {/* Top bar */}
      <div className="flex justify-between items-center px-4 md:px-6 py-3 max-w-7xl mx-auto w-full flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 grid place-items-center shadow-lg shadow-emerald-500/20">
            <Heart size={18} className="text-white" fill="currentColor" />
          </div>
          <span className="font-bold text-lg tracking-tight">MedTech</span>
        </div>
        <ThemeToggle />
      </div>

      {/* Main — locked to remaining height, no scroll */}
      <div className="flex-1 min-h-0 grid place-items-center px-4 pb-4">
        <div className="w-full max-w-md">
          {/* Heading */}
          <div className="text-center mb-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium mb-2">
              <Sparkles size={12} />
              {flipped ? 'New patient? Get started' : 'Welcome back to MedTech'}
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">
              {flipped ? 'Create your account' : 'Sign in to continue'}
            </h1>
            <p className="text-xs opacity-60 mt-1">
              {flipped
                ? 'Your health records, all in one place'
                : 'Access prescriptions, reports and appointments'}
            </p>
          </div>

          {/* Role switcher */}
          <div className="flex gap-1 mb-3 p-1 bg-gray-100/80 dark:bg-neutral-900/80 backdrop-blur rounded-2xl border border-gray-200 dark:border-neutral-800">
            <button
              onClick={() => { setRole('patient'); setError(''); }}
              disabled={flipped}
              className={`flex-1 py-2 rounded-xl font-medium flex items-center justify-center gap-2 text-sm transition-all ${
                role === 'patient'
                  ? 'bg-white dark:bg-neutral-800 shadow-sm'
                  : 'opacity-60 hover:opacity-100'
              } ${flipped ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              <User size={15} /> Patient
            </button>
            <button
              onClick={() => { setRole('doctor'); setError(''); }}
              disabled={flipped}
              className={`flex-1 py-2 rounded-xl font-medium flex items-center justify-center gap-2 text-sm transition-all ${
                role === 'doctor'
                  ? 'bg-white dark:bg-neutral-800 shadow-sm'
                  : 'opacity-60 hover:opacity-100'
              } ${flipped ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              <Stethoscope size={15} /> Doctor
            </button>
          </div>

          {/* Flip card — fixed height, compact */}
          <div className="[perspective:2000px]">
            <div
              className="relative w-full h-[400px] transition-transform duration-[900ms] [transform-style:preserve-3d]"
              style={{ transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
            >
              {/* FRONT — LOGIN */}
              <div className="absolute inset-0 card p-5 md:p-6 [backface-visibility:hidden] overflow-hidden flex flex-col">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 grid place-items-center">
                    <LogIn size={15} className="text-emerald-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Sign in</p>
                    <p className="text-[11px] opacity-50">Continue as {role}</p>
                  </div>
                </div>

                <div className="space-y-3 flex-1">
                  <Field
                    icon={Mail}
                    placeholder="Email address"
                    type="email"
                    value={lEmail}
                    onChange={(e) => setLEmail(e.target.value)}
                    onEnter={handleLogin}
                  />
                  {role === 'patient' && (
                    <Field
                      icon={Phone}
                      placeholder="Phone number"
                      type="tel"
                      value={lPhone}
                      onChange={(e) => setLPhone(e.target.value)}
                      onEnter={handleLogin}
                    />
                  )}

                  {error && <ErrorBanner message={error} />}

                  <button
                    disabled={loading}
                    onClick={handleLogin}
                    className="btn-primary w-full inline-flex items-center justify-center gap-2 h-10"
                  >
                    {loading ? (
                      <><Loader2 size={15} className="animate-spin" /> Signing in...</>
                    ) : (
                      <>Sign in <ArrowRight size={15} /></>
                    )}
                  </button>
                </div>

                <div className="pt-3 mt-3 border-t border-gray-200 dark:border-neutral-800 space-y-2">
                  <button
                    onClick={switchToRegister}
                    className="w-full py-2 rounded-lg border border-gray-200 dark:border-neutral-800 hover:border-emerald-500/50 hover:bg-emerald-500/5 text-xs font-medium transition inline-flex items-center justify-center gap-1.5"
                  >
                    <UserPlus size={13} /> Create new account
                  </button>
                  {role === 'doctor' && (
                    <p className="text-[10px] text-center opacity-40 font-mono">
                      demo: arjun@medtech.com
                    </p>
                  )}
                </div>
              </div>

              {/* BACK — REGISTER */}
              <div
                className="absolute inset-0 card p-5 md:p-6 [backface-visibility:hidden] overflow-hidden flex flex-col"
                style={{ transform: 'rotateY(180deg)' }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 grid place-items-center">
                    <UserPlus size={15} className="text-emerald-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Register</p>
                    <p className="text-[11px] opacity-50">New patient account</p>
                  </div>
                </div>

                <div className="space-y-3 flex-1">
                  <Field
                    icon={User}
                    placeholder="Full name"
                    value={rName}
                    onChange={(e) => setRName(e.target.value)}
                  />
                  <Field
                    icon={Mail}
                    placeholder="Email address"
                    type="email"
                    value={rEmail}
                    onChange={(e) => setREmail(e.target.value)}
                  />
                  <Field
                    icon={Phone}
                    placeholder="Phone number"
                    type="tel"
                    value={rPhone}
                    onChange={(e) => setRPhone(e.target.value)}
                    onEnter={handleRegister}
                  />

                  {error && <ErrorBanner message={error} />}

                  <button
                    disabled={loading}
                    onClick={handleRegister}
                    className="btn-primary w-full inline-flex items-center justify-center gap-2 h-10"
                  >
                    {loading ? (
                      <><Loader2 size={15} className="animate-spin" /> Creating...</>
                    ) : (
                      <>Create account <ArrowRight size={15} /></>
                    )}
                  </button>
                </div>

                <div className="pt-3 mt-3 border-t border-gray-200 dark:border-neutral-800">
                  <button
                    onClick={switchToLogin}
                    className="w-full py-2 rounded-lg border border-gray-200 dark:border-neutral-800 hover:border-emerald-500/50 hover:bg-emerald-500/5 text-xs font-medium transition inline-flex items-center justify-center gap-1.5"
                  >
                    <LogIn size={13} /> Back to sign in
                  </button>
                </div>
              </div>
            </div>
          </div>

          <p className="text-center text-[10px] opacity-40 mt-3">
            MedTech · Dual appointment system
          </p>
        </div>
      </div>
    </div>
  );
}

/* FIELD WITH ICON */
function Field({ icon: Icon, onEnter, ...props }) {
  return (
    <div className="relative group">
      <Icon
        size={15}
        className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40 group-focus-within:opacity-100 group-focus-within:text-emerald-500 transition-all pointer-events-none"
      />
      <input
        className="input pl-9 h-10 text-sm"
        onKeyDown={(e) => { if (e.key === 'Enter' && onEnter) onEnter(); }}
        {...props}
      />
    </div>
  );
}

/* ERROR BANNER */
function ErrorBanner({ message }) {
  return (
    <div className="flex items-start gap-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs">
      <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />
      <span className="leading-snug">{message}</span>
    </div>
  );
}