'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabase';
import {
  FileText, Upload, ExternalLink, Loader2, X, Image as ImageIcon,
  File as FileIcon, CheckCircle2, AlertCircle, Search, Cloud,
  Stethoscope, User, Calendar, Filter
} from 'lucide-react';

export default function Reports() {
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [user, setUser] = useState(null);
  const [reports, setReports] = useState([]);
  const [form, setForm] = useState({ title: '', description: '' });
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState({ text: '', kind: '' });
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' | 'patient' | 'doctor'
  const [search, setSearch] = useState('');

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('medtech-user') || 'null');
    if (!u || u.role !== 'patient') return router.push('/login');
    setUser(u);
    load(u.id);
  }, [router]);

  const load = async (pid) => {
    const { data } = await supabase
      .from('reports')
      .select('*')
      .eq('patient_id', pid)
      .order('created_at', { ascending: false });
    setReports(data || []);
  };

  const add = async () => {
    if (!form.title.trim()) {
      return setMsg({ text: 'Please enter a title', kind: 'error' });
    }
    setUploading(true);
    setMsg({ text: '', kind: '' });
    let fileUrl = '';

    try {
      if (file) {
        if (file.size > 50 * 1024 * 1024) throw new Error('File must be under 50 MB');
        const ext = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from('reports')
          .upload(fileName, file);
        if (upErr) throw upErr;

        const { data: urlData } = supabase.storage
          .from('reports')
          .getPublicUrl(fileName);
        fileUrl = urlData.publicUrl;
      }

      const { error } = await supabase.from('reports').insert({
        patient_id: user.id,
        title: form.title.trim(),
        description: form.description.trim(),
        file_url: fileUrl,
        uploaded_by: 'patient',
      });

      if (error) {
        if (fileUrl) {
          const path = fileUrl.split('/reports/')[1];
          if (path) await supabase.storage.from('reports').remove([path]);
        }
        throw error;
      }

      setForm({ title: '', description: '' });
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setMsg({ text: 'Report uploaded successfully', kind: 'success' });
      load(user.id);
      setTimeout(() => setMsg({ text: '', kind: '' }), 3000);
    } catch (e) {
      setMsg({ text: 'Error: ' + e.message, kind: 'error' });
    }
    setUploading(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) setFile(dropped);
  };

  if (!user) return null;

  // Filter + search
  const filtered = reports.filter(r => {
    if (filter !== 'all' && r.uploaded_by !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        r.title?.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const patientCount = reports.filter(r => r.uploaded_by === 'patient').length;
  const doctorCount = reports.filter(r => r.uploaded_by !== 'patient').length;

  return (
    <>
      <Navbar role="patient" name={user.name} />

      <main className="max-w-5xl mx-auto p-4 md:p-8">
        {/* ─── HEADER ─── */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs font-medium text-purple-600 dark:text-purple-400 mb-2">
            <FileText size={14} />
            <span>Medical Records</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Your reports
          </h1>
          <p className="opacity-60 mt-2 text-sm">
            Upload and access lab reports, scans and documents
          </p>
        </div>

        {/* ─── UPLOAD PANEL ─── */}
        <div className="relative overflow-hidden rounded-3xl border border-gray-200 dark:border-neutral-800 bg-gradient-to-br from-purple-500/5 via-transparent to-pink-500/5 dark:from-purple-500/10 dark:to-pink-500/10 p-6 md:p-8 mb-8">
          <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

          <div className="relative flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 grid place-items-center">
              <Upload size={20} className="text-purple-500" />
            </div>
            <div>
              <h2 className="font-bold text-lg">Upload a report</h2>
              <p className="text-xs opacity-60">PDF or image • max 50 MB</p>
            </div>
          </div>

          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative rounded-2xl border-2 border-dashed p-6 mb-4 cursor-pointer transition-all ${
              dragging
                ? 'border-purple-500 bg-purple-500/5'
                : file
                ? 'border-emerald-500/50 bg-emerald-500/5'
                : 'border-gray-300 dark:border-neutral-700 hover:border-purple-500/50 hover:bg-purple-500/5'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />

            {file ? (
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 grid place-items-center flex-shrink-0">
                  {file.type.startsWith('image/') ? (
                    <ImageIcon size={22} className="text-emerald-500" />
                  ) : (
                    <FileIcon size={22} className="text-emerald-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{file.name}</p>
                  <p className="text-xs opacity-60">
                    {(file.size / 1024).toFixed(1)} KB • {file.type || 'unknown'}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="w-8 h-8 rounded-lg grid place-items-center hover:bg-red-500/10 text-red-500 transition flex-shrink-0"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-4">
                <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-neutral-800 grid place-items-center mb-3">
                  <Cloud size={22} className="opacity-50" />
                </div>
                <p className="font-medium text-sm">
                  {dragging ? 'Drop file here' : 'Click to browse or drag & drop'}
                </p>
                <p className="text-xs opacity-50 mt-1">
                  PNG, JPG, PDF up to 50 MB
                </p>
              </div>
            )}
          </div>

          {/* Metadata fields */}
          <div className="grid md:grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-[11px] uppercase tracking-wider opacity-50 font-medium mb-1.5">
                Title *
              </label>
              <input
                className="input"
                placeholder="e.g. Blood Test Report"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wider opacity-50 font-medium mb-1.5">
                Description
              </label>
              <input
                className="input"
                placeholder="Optional notes"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
          </div>

          <button
            onClick={add}
            disabled={uploading || !form.title.trim()}
            className="btn-primary inline-flex items-center gap-2"
          >
            {uploading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Uploading...
              </>
            ) : (
              <>
                <Upload size={16} /> Save Report
              </>
            )}
          </button>

          {msg.text && (
            <div
              className={`mt-4 flex items-start gap-2.5 p-3 rounded-xl border text-sm ${
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
        </div>

        {/* ─── TOOLBAR ─── */}
        {reports.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <div className="flex gap-1 p-1 rounded-xl bg-gray-100 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 flex-shrink-0">
              <FilterButton active={filter === 'all'} onClick={() => setFilter('all')}>
                All
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-500/10 font-semibold">
                  {reports.length}
                </span>
              </FilterButton>
              <FilterButton active={filter === 'patient'} onClick={() => setFilter('patient')}>
                <User size={12} /> Mine
                {patientCount > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-semibold">
                    {patientCount}
                  </span>
                )}
              </FilterButton>
              <FilterButton active={filter === 'doctor'} onClick={() => setFilter('doctor')}>
                <Stethoscope size={12} /> Doctor
                {doctorCount > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-500 font-semibold">
                    {doctorCount}
                  </span>
                )}
              </FilterButton>
            </div>

            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40 pointer-events-none" />
              <input
                className="input pl-9"
                placeholder="Search reports..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* ─── EMPTY STATES ─── */}
        {reports.length === 0 && (
          <div className="card flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-purple-500/10 grid place-items-center mb-4">
              <FileText size={26} className="text-purple-500" />
            </div>
            <p className="font-semibold text-lg">No reports yet</p>
            <p className="text-sm opacity-50 mt-1 max-w-xs">
              Upload your first lab report or scan to keep everything in one place.
            </p>
          </div>
        )}

        {reports.length > 0 && filtered.length === 0 && (
          <div className="card flex flex-col items-center justify-center py-14 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-neutral-800 grid place-items-center mb-3">
              <Filter size={22} className="opacity-40" />
            </div>
            <p className="font-medium">No reports match your filters</p>
            <p className="text-sm opacity-50 mt-1">Try changing the filter or search query</p>
          </div>
        )}

        {/* ─── REPORT LIST ─── */}
        <div className="space-y-3">
          {filtered.map(r => {
            const isImage = r.file_url?.match(/\.(png|jpe?g|webp|gif)(\?|$)/i);
            const isPdf = r.file_url?.match(/\.pdf(\?|$)/i);
            const isDoctor = r.uploaded_by !== 'patient';

            return (
              <div
                key={r.id}
                className="card group hover:border-gray-300 dark:hover:border-neutral-700 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {/* Thumbnail / icon */}
                  <div className="w-14 h-14 rounded-2xl flex-shrink-0 overflow-hidden bg-gray-100 dark:bg-neutral-800 grid place-items-center">
                    {isImage && r.file_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={r.file_url}
                        alt={r.title}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : isPdf ? (
                      <FileIcon size={22} className="text-red-500" />
                    ) : (
                      <FileText size={22} className="text-purple-500" />
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 flex-wrap">
                      <p className="font-semibold truncate">{r.title}</p>
                      <span
                        className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 flex-shrink-0 ${
                          isDoctor
                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {isDoctor ? <Stethoscope size={9} /> : <User size={9} />}
                        {isDoctor ? 'Doctor' : 'You'}
                      </span>
                    </div>

                    {r.description && (
                      <p className="text-sm opacity-60 truncate mt-0.5">
                        {r.description}
                      </p>
                    )}

                    <div className="flex items-center gap-3 text-xs opacity-50 mt-1.5">
                      <span className="flex items-center gap-1">
                        <Calendar size={11} />
                        {new Date(r.created_at).toLocaleDateString('en-US', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Open button */}
                  {r.file_url && (
                    <a
                      href={r.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-ghost inline-flex items-center gap-2 text-sm flex-shrink-0"
                    >
                      <ExternalLink size={14} />
                      <span className="hidden sm:inline">Open</span>
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </>
  );
}

/* ─── FILTER BUTTON HELPER ─── */
function FilterButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
        active ? 'bg-white dark:bg-neutral-800 shadow' : 'opacity-60 hover:opacity-100'
      }`}
    >
      {children}
    </button>
  );
}