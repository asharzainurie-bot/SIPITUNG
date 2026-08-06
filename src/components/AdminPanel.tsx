import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Settings,
  BarChart3,
  FileSpreadsheet,
  Download,
  Printer,
  Users,
  Database,
  Globe,
  Plus,
  Trash2,
  Edit,
  CheckCircle,
  Clock,
  XCircle,
  MessageSquare,
  ShieldCheck,
  Code,
  Copy,
  Check,
  ExternalLink,
  BookOpen,
  MapPin,
  RefreshCw
} from 'lucide-react';
import { Report, AppSettings, EmergencyContact, UserRole, ReportStatus, FaqItem } from '../types';
import { exportReportsToCSV, printSingleReportPDF } from '../utils/exporter';
import { PRESET_USERS } from '../data/initialData';

interface AdminPanelProps {
  reports: Report[];
  onUpdateReportStatus: (id: string, status: ReportStatus, catatan: string, officer: string) => void;
  onDeleteReport: (id: string) => void;
  settings: AppSettings;
  onSaveSettings: (newSettings: AppSettings, contacts: EmergencyContact[]) => void;
  contacts: EmergencyContact[];
  currentUser: UserRole | null;
  openAuthModal?: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  reports,
  onUpdateReportStatus,
  onDeleteReport,
  settings,
  onSaveSettings,
  contacts,
  currentUser,
  openAuthModal
}) => {
  // STRICT ADMIN AUTHORIZATION GUARD: Only users with role === 'admin' can access
  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center font-['Plus_Jakarta_Sans',sans-serif]">
        <div className="bg-slate-900 border border-slate-800 p-8 sm:p-10 rounded-3xl shadow-2xl space-y-5 max-w-lg mx-auto text-white">
          <div className="w-20 h-20 bg-red-600/20 text-red-500 rounded-3xl flex items-center justify-center mx-auto border border-red-500/30 shadow-lg shadow-red-950/50">
            <ShieldCheck className="w-10 h-10 text-red-500 animate-pulse" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white">
              AKSES PANEL ADMIN DIBATASI
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Halaman ini bersifat rahasia dan <strong>KHUSUS HANYA UNTUK ADMINISTRATOR PUSDALOPS</strong>. Warga publik dan pengguna umum tidak diizinkan melihat menu rekap dan pengaturan sistem ini.
            </p>
          </div>

          <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl text-left text-xs space-y-1.5 text-slate-400">
            <p className="font-bold text-amber-400 uppercase text-[10px]">Ketentuan Hak Akses:</p>
            <ul className="list-disc list-inside space-y-1 text-[11px]">
              <li>Role Akun Saat Ini: <strong className="text-red-400 uppercase">{currentUser ? currentUser.role : 'Belum Login (Tamu)'}</strong></li>
              <li>Minimal Role yang Dibutuhkan: <strong className="text-emerald-400">ADMIN</strong></li>
              <li>PIN Master Login Admin: <code className="bg-slate-900 px-1.5 py-0.5 rounded text-white font-mono">12345678</code></li>
            </ul>
          </div>

          {openAuthModal && (
            <button
              onClick={openAuthModal}
              className="w-full bg-gradient-to-r from-red-600 via-amber-600 to-red-600 hover:from-red-500 hover:to-amber-500 text-white font-extrabold py-3.5 rounded-2xl text-xs uppercase tracking-wider shadow-xl shadow-red-950/60 transition transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center space-x-2"
            >
              <ShieldCheck className="w-4 h-4 text-yellow-300" />
              <span>Masuk Sekarang Sebagai Admin</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  const [activeTab, setActiveTab] = useState<'rekap' | 'laporan' | 'pengguna' | 'pengaturan' | 'database' | 'vercel'>(
    'rekap'
  );

  // Edit Report Modal
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [newStatus, setNewStatus] = useState<ReportStatus>('diproses');
  const [catatanPetugas, setCatatanPetugas] = useState('');
  const [petugasAssigned, setPetugasAssigned] = useState('');

  // Settings state
  const [formSettings, setFormSettings] = useState<AppSettings>({ ...settings });
  const [formContacts, setFormContacts] = useState<EmergencyContact[]>([...contacts]);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // FAQ Management State
  const [editingFaq, setEditingFaq] = useState<FaqItem | null>(null);
  const [faqQuestion, setFaqQuestion] = useState('');
  const [faqAnswer, setFaqAnswer] = useState('');
  const [faqKeywords, setFaqKeywords] = useState('');
  const [faqCategory, setFaqCategory] = useState<'Bencana Alam' | 'Trantibum' | 'Mitigasi Bencana' | 'Informasi Umum'>('Informasi Umum');

  const handleAddOrUpdateFaq = (e: React.FormEvent) => {
    e.preventDefault();
    if (!faqQuestion.trim() || !faqAnswer.trim()) return;

    const kwArray = faqKeywords
      .split(',')
      .map(k => k.trim())
      .filter(Boolean);

    const currentFaqs = formSettings.chatbotFaqs || [];

    if (editingFaq) {
      // Update existing
      const updated = currentFaqs.map(f =>
        f.id === editingFaq.id
          ? { ...f, question: faqQuestion, answer: faqAnswer, keywords: kwArray, category: faqCategory }
          : f
      );
      setFormSettings({ ...formSettings, chatbotFaqs: updated });
    } else {
      // Create new
      const newFaq: FaqItem = {
        id: 'faq-' + Date.now(),
        question: faqQuestion,
        answer: faqAnswer,
        keywords: kwArray,
        category: faqCategory
      };
      setFormSettings({ ...formSettings, chatbotFaqs: [...currentFaqs, newFaq] });
    }

    // Reset form
    setEditingFaq(null);
    setFaqQuestion('');
    setFaqAnswer('');
    setFaqKeywords('');
  };

  const handleEditFaqClick = (faq: FaqItem) => {
    setEditingFaq(faq);
    setFaqQuestion(faq.question);
    setFaqAnswer(faq.answer);
    setFaqKeywords(faq.keywords ? faq.keywords.join(', ') : '');
    setFaqCategory(faq.category || 'Informasi Umum');
  };

  const handleDeleteFaq = (faqId: string) => {
    const updated = (formSettings.chatbotFaqs || []).filter(f => f.id !== faqId);
    setFormSettings({ ...formSettings, chatbotFaqs: updated });
  };

  // Database Scripts
  const [copiedScript, setCopiedScript] = useState<'sheet' | 'sql' | null>(null);
  const [supabaseTestStatus, setSupabaseTestStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [testingSupabase, setTestingSupabase] = useState(false);

  const handleTestSupabase = async () => {
    setTestingSupabase(true);
    setSupabaseTestStatus(null);
    const targetUrl = (formSettings.supabaseUrl || '').trim();
    const targetKey = (formSettings.supabaseAnonKey || '').trim();

    if (!targetUrl || !targetKey || !targetUrl.startsWith('http')) {
      setSupabaseTestStatus({
        success: false,
        message: 'Mohon isi URL Supabase (https://xxx.supabase.co) dan Anon Public API Key terlebih dahulu!'
      });
      setTestingSupabase(false);
      return;
    }

    // Attempt 1: Server-side API endpoint
    try {
      const res = await fetch('/api/supabase/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: targetUrl,
          anonKey: targetKey
        })
      });

      const contentType = res.headers.get('content-type');
      if (res.ok && contentType && contentType.includes('application/json')) {
        const data = await res.json();
        setSupabaseTestStatus({ success: data.success, message: data.message });
        if (data.success) {
          onSaveSettings({ ...formSettings, supabaseUrl: targetUrl, supabaseAnonKey: targetKey }, formContacts);
        }
        setTestingSupabase(false);
        return;
      }
    } catch (err) {
      console.warn('Backend API connection failed or non-JSON, using direct client-side Supabase verification...');
    }

    // Attempt 2: Direct Client-Side Supabase Verification Fallback (for Vercel Static deployment)
    try {
      const sb = createClient(targetUrl, targetKey);
      let activeTable = '';
      let rowCount = 0;
      let lastErr = '';

      for (const tbl of ['reports', 'sipitung_reports']) {
        const { data, error } = await sb.from(tbl).select('*').limit(1);
        if (!error) {
          activeTable = tbl;
          rowCount = data ? data.length : 0;
          break;
        } else {
          lastErr = error.message;
        }
      }

      if (!activeTable) {
        setSupabaseTestStatus({
          success: false,
          message: `KONEKSI KE SUPABASE GAGAL / TABEL 'reports' BELUM DIBUAT.\n\nDetail Error: ${lastErr}\n\n💡 SOLUSI: Buka Supabase Dashboard > SQL Editor, jalankan Script SQL Setup yang ada di tab Pengaturan Database Admin!`
        });
        setTestingSupabase(false);
        return;
      }

      // Test write / insert permission directly from browser with multi-schema fallback
      const testId = 'test-' + Date.now();
      const testTicket = 'TEST-VERCEL-' + Math.floor(100 + Math.random() * 900);
      const nowIso = new Date().toISOString();

      const camelPayload = {
        id: testId,
        ticketId: testTicket,
        namaPelapor: 'UJI SYSTEM SUPABASE VERCEL',
        noWhatsapp: '081234567890',
        desa: 'Tulis',
        alamat: 'Tes Koneksi Vercel Client',
        latitude: -6.9536,
        longitude: 109.8168,
        jenisKejadian: 'uji_sistem',
        kategori: 'bencana',
        waktuKejadian: nowIso,
        korban: 'Nihil',
        mediaUrl: 'https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?auto=format&fit=crop&w=800&q=80',
        mediaType: 'image',
        deskripsi: 'Tes verifikasi hak akses simpan aduan dari Vercel.',
        status: 'pending',
        catatanPetugas: '',
        petugasAssigned: '',
        createdAt: nowIso,
        updatedAt: nowIso
      };

      const lowerPayload = {
        id: testId,
        ticketid: testTicket,
        namapelapor: 'UJI SYSTEM SUPABASE VERCEL',
        nowhatsapp: '081234567890',
        desa: 'Tulis',
        alamat: 'Tes Koneksi Vercel Client',
        latitude: -6.9536,
        longitude: 109.8168,
        jeniskejadian: 'uji_sistem',
        kategori: 'bencana',
        waktukejadian: nowIso,
        korban: 'Nihil',
        mediaurl: 'https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?auto=format&fit=crop&w=800&q=80',
        mediatype: 'image',
        deskripsi: 'Tes verifikasi hak akses simpan aduan dari Vercel.',
        status: 'pending',
        catatanpetugas: '',
        petugasassigned: '',
        createdat: nowIso,
        updatedat: nowIso
      };

      const snakePayload = {
        id: testId,
        ticket_id: testTicket,
        nama_pelapor: 'UJI SYSTEM SUPABASE VERCEL',
        no_whatsapp: '081234567890',
        desa: 'Tulis',
        alamat: 'Tes Koneksi Vercel Client',
        latitude: -6.9536,
        longitude: 109.8168,
        jenis_kejadian: 'uji_sistem',
        kategori: 'bencana',
        waktu_kejadian: nowIso,
        korban: 'Nihil',
        media_url: 'https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?auto=format&fit=crop&w=800&q=80',
        media_type: 'image',
        deskripsi: 'Tes verifikasi hak akses simpan aduan dari Vercel.',
        status: 'pending',
        catatan_petugas: '',
        petugas_assigned: '',
        created_at: nowIso,
        updated_at: nowIso
      };

      let insertErr: any = null;
      let workedVariant = '';

      const { error: err1 } = await sb.from(activeTable).insert([camelPayload]);
      if (!err1) {
        workedVariant = 'camelCase';
      } else {
        const { error: err2 } = await sb.from(activeTable).insert([lowerPayload]);
        if (!err2) {
          workedVariant = 'lowercase';
        } else {
          const { error: err3 } = await sb.from(activeTable).insert([snakePayload]);
          if (!err3) {
            workedVariant = 'snake_case';
          } else {
            insertErr = err3 || err2 || err1;
          }
        }
      }

      if (!insertErr) {
        // Clean up test payload
        await sb.from(activeTable).delete().eq('id', testId);

        onSaveSettings({ ...formSettings, supabaseUrl: targetUrl, supabaseAnonKey: targetKey }, formContacts);
        setSupabaseTestStatus({
          success: true,
          message: `🎉 KONEKSI & IZIN SIMPAN SUPABASE 100% BERHASIL! (Format Skema: ${workedVariant})\n\nTabel "${activeTable}" terverifikasi dan siap menyimpan aduan secara langsung di Vercel!`
        });
      } else {
        setSupabaseTestStatus({
          success: false,
          message: `⚠️ KONEKSI TERHUBUNG, TAPI PENYIMPANAN DIBLOKIR!\n\nDetail Error: ${insertErr.message}\n\n💡 SOLUSI CARA MEMPERBAIKI:\nBuka Supabase Dashboard > SQL Editor, jalankan perintah ini:\nALTER TABLE reports DISABLE ROW LEVEL SECURITY;`
        });
      }
    } catch (err: any) {
      setSupabaseTestStatus({
        success: false,
        message: `Koneksi Supabase Gagal: ${err.message || String(err)}`
      });
    } finally {
      setTestingSupabase(false);
    }
  };

  // Database scripts generated from server
  const googleAppsScript = `
function setupSipitungSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getActiveSheet();
  sheet.setName("Laporan_SIPITUNG");
  var headers = ["Ticket_ID", "Waktu_Lapor", "Pelapor", "WhatsApp", "Alamat", "Lat", "Lng", "Kategori", "Jenis", "Status", "Korban_Meninggal", "Korban_Luka", "Deskripsi"];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#dc2626").setFontColor("#ffffff");
}
  `.trim();

  const supabaseSql = `
-- =========================================================
-- SCRIPT SETUP DATABASE SUPABASE ULTIMATE (SIPITUNG TULIS)
-- Buka Supabase Dashboard > SQL Editor > New Query > Paste > Run
-- =========================================================

-- 1. Buat Tabel Utama 'reports'
CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  "ticketId" TEXT,
  "namaPelapor" TEXT,
  "noWhatsapp" TEXT,
  desa TEXT DEFAULT 'Tulis',
  alamat TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  "jenisKejadian" TEXT,
  kategori TEXT,
  "waktuKejadian" TEXT,
  korban TEXT,
  "mediaUrl" TEXT,
  "mediaType" TEXT,
  deskripsi TEXT,
  status TEXT DEFAULT 'pending',
  "catatanPetugas" TEXT,
  "petugasAssigned" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 2. MATIKAN ROW LEVEL SECURITY (RLS)
-- Wajib dijalankan agar API Anon Key publik dapat menyimpan aduan warga secara langsung!
ALTER TABLE reports DISABLE ROW LEVEL SECURITY;

-- 3. AUTO-PATCH KOLOM (JIKA TABEL SUDAH PERNAH DIBUAT SEBELUMNYA)
ALTER TABLE reports ADD COLUMN IF NOT EXISTS "ticketId" TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS "namaPelapor" TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS "noWhatsapp" TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS desa TEXT DEFAULT 'Tulis';
ALTER TABLE reports ADD COLUMN IF NOT EXISTS alamat TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS latitude NUMERIC;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS longitude NUMERIC;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS "jenisKejadian" TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS kategori TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS "waktuKejadian" TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS korban TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS "mediaUrl" TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS "mediaType" TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS deskripsi TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE reports ADD COLUMN IF NOT EXISTS "catatanPetugas" TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS "petugasAssigned" TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE reports ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMPTZ DEFAULT NOW();

-- Add snake_case & lowercase column variants for 100% schema compatibility
ALTER TABLE reports ADD COLUMN IF NOT EXISTS ticket_id TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS nama_pelapor TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS no_whatsapp TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS jenis_kejadian TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS waktu_kejadian TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS media_url TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS media_type TEXT;

ALTER TABLE reports ADD COLUMN IF NOT EXISTS ticketid TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS namapelapor TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS nowhatsapp TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS jeniskejadian TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS waktukejadian TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS mediaurl TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS mediatype TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS catatanpetugas TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS petugasassigned TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS createdat TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE reports ADD COLUMN IF NOT EXISTS updatedat TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE reports ADD COLUMN IF NOT EXISTS media_url TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS media_type TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS catatan_petugas TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS petugas_assigned TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE reports ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 4. PATENKAN TABEL SEKUNDER 'sipitung_reports' (JIKA DIGUNAKAN)
CREATE TABLE IF NOT EXISTS sipitung_reports (
  id TEXT PRIMARY KEY,
  "ticketId" TEXT,
  "namaPelapor" TEXT,
  "noWhatsapp" TEXT,
  desa TEXT DEFAULT 'Tulis',
  alamat TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  "jenisKejadian" TEXT,
  kategori TEXT,
  "waktuKejadian" TEXT,
  korban TEXT,
  "mediaUrl" TEXT,
  "mediaType" TEXT,
  deskripsi TEXT,
  status TEXT DEFAULT 'pending',
  "catatanPetugas" TEXT,
  "petugasAssigned" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE sipitung_reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE sipitung_reports ADD COLUMN IF NOT EXISTS korban TEXT;
ALTER TABLE sipitung_reports ADD COLUMN IF NOT EXISTS "ticketId" TEXT;
ALTER TABLE sipitung_reports ADD COLUMN IF NOT EXISTS ticket_id TEXT;
ALTER TABLE sipitung_reports ADD COLUMN IF NOT EXISTS "namaPelapor" TEXT;
ALTER TABLE sipitung_reports ADD COLUMN IF NOT EXISTS nama_pelapor TEXT;
ALTER TABLE sipitung_reports ADD COLUMN IF NOT EXISTS "noWhatsapp" TEXT;
ALTER TABLE sipitung_reports ADD COLUMN IF NOT EXISTS no_whatsapp TEXT;
ALTER TABLE sipitung_reports ADD COLUMN IF NOT EXISTS desa TEXT DEFAULT 'Tulis';
ALTER TABLE sipitung_reports ADD COLUMN IF NOT EXISTS alamat TEXT;
ALTER TABLE sipitung_reports ADD COLUMN IF NOT EXISTS latitude NUMERIC;
ALTER TABLE sipitung_reports ADD COLUMN IF NOT EXISTS longitude NUMERIC;
ALTER TABLE sipitung_reports ADD COLUMN IF NOT EXISTS "jenisKejadian" TEXT;
ALTER TABLE sipitung_reports ADD COLUMN IF NOT EXISTS jenis_kejadian TEXT;
ALTER TABLE sipitung_reports ADD COLUMN IF NOT EXISTS kategori TEXT;
ALTER TABLE sipitung_reports ADD COLUMN IF NOT EXISTS "waktuKejadian" TEXT;
ALTER TABLE sipitung_reports ADD COLUMN IF NOT EXISTS waktu_kejadian TEXT;
ALTER TABLE sipitung_reports ADD COLUMN IF NOT EXISTS "mediaUrl" TEXT;
ALTER TABLE sipitung_reports ADD COLUMN IF NOT EXISTS media_url TEXT;
ALTER TABLE sipitung_reports ADD COLUMN IF NOT EXISTS "mediaType" TEXT;
ALTER TABLE sipitung_reports ADD COLUMN IF NOT EXISTS media_type TEXT;
ALTER TABLE sipitung_reports ADD COLUMN IF NOT EXISTS deskripsi TEXT;
ALTER TABLE sipitung_reports ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE sipitung_reports ADD COLUMN IF NOT EXISTS "catatanPetugas" TEXT;
ALTER TABLE sipitung_reports ADD COLUMN IF NOT EXISTS catatan_petugas TEXT;
ALTER TABLE sipitung_reports ADD COLUMN IF NOT EXISTS "petugasAssigned" TEXT;
ALTER TABLE sipitung_reports ADD COLUMN IF NOT EXISTS petugas_assigned TEXT;
ALTER TABLE sipitung_reports ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE sipitung_reports ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE sipitung_reports ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE sipitung_reports ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
  `.trim();

  // Summary Metrics
  const totalReports = reports.length;
  const pendingCount = reports.filter(r => r.status === 'pending').length;
  const diprosesCount = reports.filter(r => r.status === 'diproses' || r.status === 'verifikasi').length;
  const selesaiCount = reports.filter(r => r.status === 'selesai').length;

  const totalKorbanMeninggal = reports.reduce((acc, r) => acc + (r.korban?.meninggal || 0), 0);
  const totalKorbanMengungsi = reports.reduce((acc, r) => acc + (r.korban?.mengungsi || 0), 0);

  const handleOpenEditModal = (r: Report) => {
    setSelectedReport(r);
    setNewStatus(r.status);
    setCatatanPetugas(r.catatanPetugas || '');
    setPetugasAssigned(r.petugasAssigned || 'Tim TRC BPBD & Satpol PP');
  };

  const handleSaveStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport) return;
    onUpdateReportStatus(selectedReport.id, newStatus, catatanPetugas, petugasAssigned);
    setSelectedReport(null);
  };

  const handleSaveSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formSettings, formContacts);
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3000);
  };

  const copyToClipboard = (text: string, type: 'sheet' | 'sql') => {
    navigator.clipboard.writeText(text);
    setCopiedScript(type);
    setTimeout(() => setCopiedScript(null), 2500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Top Banner Admin */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Settings className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl font-black uppercase tracking-tight">PANEL ADMINISTRATOR & PUSDALOPS</h2>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Pengelolaan Rekap Aduan, Verifikasi Lapangan, Database Supabase / Google Sheets, dan Pengaturan Website
          </p>
        </div>

        {/* Export All Quick Actions */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => exportReportsToCSV(reports, `Rekap_Laporan_SIPITUNG_${new Date().toISOString().slice(0, 10)}.csv`)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-1.5 transition shadow"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Ekspor Excel / CSV</span>
          </button>
        </div>
      </div>

      {/* Admin Tab Navigation */}
      <div className="bg-white border border-slate-200 rounded-2xl p-2 flex overflow-x-auto no-scrollbar shadow-sm">
        <button
          onClick={() => setActiveTab('rekap')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center space-x-2 ${
            activeTab === 'rekap' ? 'bg-red-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Analytics & Rekap Stats</span>
        </button>

        <button
          onClick={() => setActiveTab('laporan')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center space-x-2 ${
            activeTab === 'laporan' ? 'bg-red-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Kelola Laporan Aduan ({reports.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('pengguna')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center space-x-2 ${
            activeTab === 'pengguna' ? 'bg-red-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Kelola Pelapor & Petugas</span>
        </button>

        <button
          onClick={() => setActiveTab('pengaturan')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center space-x-2 ${
            activeTab === 'pengaturan' ? 'bg-red-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>Pengaturan Website & EWS</span>
        </button>

        <button
          onClick={() => setActiveTab('database')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center space-x-2 ${
            activeTab === 'database' ? 'bg-red-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Database Supabase & Sheets</span>
        </button>

        <button
          onClick={() => setActiveTab('vercel')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center space-x-2 ${
            activeTab === 'vercel' ? 'bg-slate-900 text-amber-300 shadow' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-4 h-4 text-amber-400" />
          <span>Panduan Deploy Vercel</span>
        </button>
      </div>

      {/* ----------------- TAB 1: REKAP STATS ----------------- */}
      {activeTab === 'rekap' && (
        <div className="space-y-6">
          {/* Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Total Aduan Masuk</span>
              <p className="text-3xl font-black text-slate-900">{totalReports}</p>
              <span className="text-[10px] text-slate-400">Terdaftar di Posko</span>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-5 rounded-3xl shadow-sm space-y-1">
              <span className="text-[11px] font-bold text-amber-800 uppercase">Perlu Verifikasi</span>
              <p className="text-3xl font-black text-amber-700">{pendingCount}</p>
              <span className="text-[10px] text-amber-600 font-semibold">Pending Antrean</span>
            </div>

            <div className="bg-blue-50 border border-blue-200 p-5 rounded-3xl shadow-sm space-y-1">
              <span className="text-[11px] font-bold text-blue-800 uppercase">Dalam Penanganan TRC</span>
              <p className="text-3xl font-black text-blue-700">{diprosesCount}</p>
              <span className="text-[10px] text-blue-600 font-semibold">Petugas di Lapangan</span>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-3xl shadow-sm space-y-1">
              <span className="text-[11px] font-bold text-emerald-800 uppercase">Selesai Ditangani</span>
              <p className="text-3xl font-black text-emerald-700">{selesaiCount}</p>
              <span className="text-[10px] text-emerald-600 font-semibold">Tuntas 100%</span>
            </div>
          </div>

          {/* Korban Summary */}
          <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
            <h3 className="font-bold text-sm uppercase tracking-wider text-amber-400">
              REKAPITULASI KORBAN & KERUSAKAN TOTAL
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Korban Meninggal</span>
                <p className="text-2xl font-black text-red-500 mt-1">{totalKorbanMeninggal} Jiwa</p>
              </div>
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Warga Mengungsi</span>
                <p className="text-2xl font-black text-amber-400 mt-1">{totalKorbanMengungsi} Jiwa</p>
              </div>
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Bencana Alam</span>
                <p className="text-2xl font-black text-blue-400 mt-1">
                  {reports.filter(r => r.kategori === 'bencana').length} Laporan
                </p>
              </div>
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Gangguan Trantibum</span>
                <p className="text-2xl font-black text-emerald-400 mt-1">
                  {reports.filter(r => r.kategori === 'trantib').length} Laporan
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- TAB 2: KELOLA LAPORAN ----------------- */}
      {activeTab === 'laporan' && (
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-800 uppercase">Daftar Seluruh Laporan Masuk</h3>
            <span className="text-xs text-slate-500 font-mono">Total: {reports.length} Data</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3">ID Ticket</th>
                  <th className="p-3">Waktu Lapor</th>
                  <th className="p-3">Pelapor & WA</th>
                  <th className="p-3">Desa</th>
                  <th className="p-3">Jenis Kejadian</th>
                  <th className="p-3">Lokasi Alamat</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {reports.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500">
                      <p className="font-bold text-sm text-slate-700">Belum Ada Laporan Masuk</p>
                      <p className="text-xs text-slate-400 mt-1">Data laporan aduan warga yang masuk akan muncul secara real-time di sini.</p>
                    </td>
                  </tr>
                ) : (
                  reports.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-mono font-bold text-red-600">{r.ticketId}</td>
                    <td className="p-3 text-[11px] text-slate-500">
                      {new Date(r.createdAt).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="p-3">
                      <strong className="block text-slate-900">{r.namaPelapor}</strong>
                      <a
                        href={`https://wa.me/62${r.noWhatsapp.replace(/^0/, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-emerald-600 font-bold hover:underline"
                      >
                        WA: {r.noWhatsapp}
                      </a>
                    </td>
                    <td className="p-3 font-bold text-emerald-800 whitespace-nowrap">
                      {r.desa ? `Desa ${r.desa}` : '-'}
                    </td>
                    <td className="p-3 font-bold uppercase">{r.jenisKejadian}</td>
                    <td className="p-3 max-w-[180px] truncate">{r.alamat}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          r.status === 'selesai'
                            ? 'bg-emerald-100 text-emerald-800'
                            : r.status === 'diproses'
                            ? 'bg-blue-100 text-blue-800'
                            : r.status === 'ditolak'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="p-3 text-center space-x-1">
                      <button
                        onClick={() => handleOpenEditModal(r)}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-1 rounded-lg text-[10px] font-bold"
                      >
                        Tindak Lanjut
                      </button>
                      <button
                        onClick={() => printSingleReportPDF(r)}
                        className="bg-slate-800 hover:bg-slate-700 text-white px-2 py-1 rounded-lg text-[10px] font-bold"
                        title="Cetak PDF"
                      >
                        PDF
                      </button>
                      <button
                        onClick={() => onDeleteReport(r.id)}
                        className="bg-red-100 hover:bg-red-200 text-red-700 p-1 rounded-lg"
                        title="Hapus Aduan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                )))
                }
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Edit Status Laporan */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-xs">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-base text-slate-800">Tindak Lanjut Laporan: {selectedReport.ticketId}</h3>
              <button onClick={() => setSelectedReport(null)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStatus} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Status Penanganan Posko:</label>
                <select
                  value={newStatus}
                  onChange={e => setNewStatus(e.target.value as ReportStatus)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 font-bold"
                >
                  <option value="pending">Pending (Dalam Antrean Verifikasi)</option>
                  <option value="verifikasi">Telah Diverifikasi Posko</option>
                  <option value="diproses">Dalam Penanganan Tim Lapangan (TRC)</option>
                  <option value="selesai">Selesai Tuntas</option>
                  <option value="ditolak">Ditolak / Laporan Fiktif</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tim / Regu Petugas Ditugaskan:</label>
                <input
                  type="text"
                  value={petugasAssigned}
                  onChange={e => setPetugasAssigned(e.target.value)}
                  placeholder="Contoh: Tim Reaksi Cepat (TRC) BPBD Unit 2 & Satpol PP"
                  className="w-full border border-slate-300 rounded-xl p-2.5 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan Progress / Uraian Tindak Lanjut:</label>
                <textarea
                  rows={3}
                  value={catatanPetugas}
                  onChange={e => setCatatanPetugas(e.target.value)}
                  placeholder="Contoh: Tim telah diluncurkan membawa 2 unit perahu karet dan bantuan logistik..."
                  className="w-full border border-slate-300 rounded-xl p-2.5 font-medium"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedReport(null)}
                  className="bg-slate-200 hover:bg-slate-300 px-4 py-2 rounded-xl font-bold text-slate-700"
                >
                  Batal
                </button>
                <button type="submit" className="bg-red-600 hover:bg-red-500 text-white px-5 py-2 rounded-xl font-bold">
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------- TAB 3: KELOLA PELAPOR & PETUGAS ----------------- */}
      {activeTab === 'pengguna' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-sm uppercase text-slate-800">Daftar Petugas & Pengguna Sistem SIPITUNG</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {PRESET_USERS.map((u, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-1">
                <div className="flex items-center justify-between">
                  <strong className="text-sm text-slate-900">{u.name}</strong>
                  <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                    {u.role}
                  </span>
                </div>
                <p className="text-xs text-slate-600">{u.unit || 'Warga Pelapor Resmi'}</p>
                <p className="text-xs text-slate-500 font-mono">
                  Email: {u.email} | WA: {u.phone}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ----------------- TAB 4: PENGATURAN WEBSITE & EWS ----------------- */}
      {activeTab === 'pengaturan' && (
        <form onSubmit={handleSaveSettingsSubmit} className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
          {settingsSaved && (
            <div className="bg-emerald-100 border border-emerald-300 text-emerald-800 p-4 rounded-2xl text-xs font-bold">
              ✓ Pengaturan website dan notifikasi EWS berhasil diperbarui!
            </div>
          )}

          <div className="space-y-4">
            <h3 className="font-bold text-sm uppercase text-slate-800 border-b pb-2">Identitas Aplikasi & Profil Pemda</h3>

            <div className="grid md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Aplikasi</label>
                <input
                  type="text"
                  value={formSettings.appName}
                  onChange={e => setFormSettings({ ...formSettings, appName: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Slogan / Tagline</label>
                <input
                  type="text"
                  value={formSettings.tagline}
                  onChange={e => setFormSettings({ ...formSettings, tagline: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Instansi Penanggung Jawab</label>
                <input
                  type="text"
                  value={formSettings.agencyName}
                  onChange={e => setFormSettings({ ...formSettings, agencyName: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nomor Telepon Hotline Posko</label>
                <input
                  type="text"
                  value={formSettings.contactPhone}
                  onChange={e => setFormSettings({ ...formSettings, contactPhone: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              <div className="col-span-2">
                <label className="block font-bold text-slate-700 mb-1 flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-red-600" />
                  <span>Alamat Kantor Kecamatan Tulis / Posko Utama (Tampil di Footer Website)</span>
                </label>
                <textarea
                  rows={2}
                  value={formSettings.address || ''}
                  onChange={e => setFormSettings({ ...formSettings, address: e.target.value })}
                  placeholder="Contoh: Kantor Kecamatan Tulis, Jl. Raya Tulis No. 1, Kec. Tulis, Kabupaten Batang, Jawa Tengah 51261"
                  className="w-full border border-slate-300 rounded-xl p-2.5 font-medium text-slate-900 focus:outline-none focus:border-red-600"
                ></textarea>
                <p className="text-[10px] text-slate-500 mt-1">
                  Alamat ini akan ditampilkan secara langsung di bagian footer pada seluruh halaman web.
                </p>
              </div>
            </div>
          </div>

          {/* Admin Credentials & WhatsApp Config */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-bold text-sm uppercase text-slate-800 border-b pb-2 flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Pengaturan Nomor WhatsApp Admin & PIN Akses Login</span>
            </h3>

            <div className="grid md:grid-cols-2 gap-4 text-xs bg-emerald-50/50 p-4 rounded-2xl border border-emerald-200">
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Nomor WhatsApp Admin Kedaruratan (Default: 082327313277)
                </label>
                <input
                  type="text"
                  value={formSettings.adminWhatsapp || '082327313277'}
                  onChange={e => setFormSettings({ ...formSettings, adminWhatsapp: e.target.value })}
                  placeholder="082327313277"
                  className="w-full border border-slate-300 rounded-xl p-2.5 font-mono font-bold bg-white text-emerald-900 focus:outline-none focus:border-emerald-600"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Seluruh aduan dan laporan warga akan diteruskan langsung ke WhatsApp ini.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  PIN Akses Login Admin (Default: 12345678)
                </label>
                <input
                  type="text"
                  value={formSettings.adminPin || '12345678'}
                  onChange={e => setFormSettings({ ...formSettings, adminPin: e.target.value })}
                  placeholder="12345678"
                  className="w-full border border-slate-300 rounded-xl p-2.5 font-mono font-bold bg-white text-slate-900 focus:outline-none focus:border-red-600"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Gunakan PIN ini untuk masuk ke Panel Administrator SIPITUNG.
                </p>
              </div>
            </div>
          </div>

          {/* Supabase Cloud Database Configuration */}
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-sm uppercase text-slate-800 flex items-center space-x-2">
                <Database className="w-4 h-4 text-emerald-600" />
                <span>Koneksi Supabase Cloud Database (Penyimpanan Permanen Real-time)</span>
              </h3>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                Supabase Sync
              </span>
            </div>

            <p className="text-xs text-slate-600">
              Atur URL & API Key Supabase Anda di sini agar seluruh aduan/laporan warga tersimpan permanen di cloud database Supabase PostgreSQL Anda.
            </p>

            <div className="grid md:grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Project URL Supabase
                </label>
                <input
                  type="text"
                  value={formSettings.supabaseUrl || ''}
                  onChange={e => setFormSettings({ ...formSettings, supabaseUrl: e.target.value })}
                  placeholder="https://your-project.supabase.co"
                  className="w-full border border-slate-300 rounded-xl p-2.5 font-mono text-xs bg-white text-slate-900 focus:outline-none focus:border-emerald-600"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Dapatkan di Supabase Dashboard &gt; Project Settings &gt; API &gt; Project URL
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Anon Public API Key / Service Role Key
                </label>
                <input
                  type="password"
                  value={formSettings.supabaseAnonKey || ''}
                  onChange={e => setFormSettings({ ...formSettings, supabaseAnonKey: e.target.value })}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full border border-slate-300 rounded-xl p-2.5 font-mono text-xs bg-white text-slate-900 focus:outline-none focus:border-emerald-600"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Dapatkan di Supabase Dashboard &gt; Project Settings &gt; API &gt; anon public key
                </p>
              </div>

              <div className="col-span-2 flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleTestSupabase}
                  disabled={testingSupabase}
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase shadow transition flex items-center justify-center space-x-2"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testingSupabase ? 'animate-spin' : ''}`} />
                  <span>{testingSupabase ? 'Menguji Koneksi...' : 'Uji Koneksi Supabase Sekarang'}</span>
                </button>

                <p className="text-[11px] text-slate-500 italic">
                  💡 Tips: Klik 'Simpan Pengaturan Website' di bawah setelah mengisi kredensial.
                </p>
              </div>

              {supabaseTestStatus && (
                <div
                  className={`col-span-2 p-3.5 rounded-xl text-xs font-bold border ${
                    supabaseTestStatus.success
                      ? 'bg-emerald-100 border-emerald-300 text-emerald-900'
                      : 'bg-red-100 border-red-300 text-red-900'
                  }`}
                >
                  {supabaseTestStatus.message}
                </div>
              )}
            </div>
          </div>

          {/* EWS Banner Config */}
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm uppercase text-slate-800">Notifikasi Peringatan Dini (EWS BMKG)</h3>
              <label className="flex items-center space-x-2 text-xs font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={formSettings.ewsActive}
                  onChange={e => setFormSettings({ ...formSettings, ewsActive: e.target.checked })}
                  className="w-4 h-4 text-red-600 rounded"
                />
                <span>Aktifkan Banner EWS</span>
              </label>
            </div>

            {formSettings.ewsActive && formSettings.ewsNotice && (
              <div className="grid md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Judul Peringatan EWS</label>
                  <input
                    type="text"
                    value={formSettings.ewsNotice.title}
                    onChange={e =>
                      setFormSettings({
                        ...formSettings,
                        ewsNotice: { ...formSettings.ewsNotice, title: e.target.value }
                      })
                    }
                    className="w-full border border-slate-300 rounded-xl p-2.5 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Level Siaga</label>
                  <select
                    value={formSettings.ewsNotice.level}
                    onChange={e =>
                      setFormSettings({
                        ...formSettings,
                        ewsNotice: { ...formSettings.ewsNotice, level: e.target.value as any }
                      })
                    }
                    className="w-full border border-slate-300 rounded-xl p-2.5 font-bold"
                  >
                    <option value="waspada">WASPADA</option>
                    <option value="siaga">SIAGA</option>
                    <option value="awas">AWAS</option>
                    <option value="info">INFO BIASA</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Pesan Himbauan Warga</label>
                  <textarea
                    rows={2}
                    value={formSettings.ewsNotice.message}
                    onChange={e =>
                      setFormSettings({
                        ...formSettings,
                        ewsNotice: { ...formSettings.ewsNotice, message: e.target.value }
                      })
                    }
                    className="w-full border border-slate-300 rounded-xl p-2.5"
                  ></textarea>
                </div>
              </div>
            )}
          </div>

          {/* Chatbot Manual Q&A Config */}
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-sm uppercase text-slate-800 flex items-center space-x-2">
                <MessageSquare className="w-4 h-4 text-amber-600" />
                <span>Pengaturan Manual AI Chat (Data Pertanyaan & Jawaban Admin)</span>
              </h3>
              <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded">
                {formSettings.chatbotFaqs?.length || 0} Aturan Aktif
              </span>
            </div>

            <p className="text-xs text-slate-600">
              Admin dapat merancang data pertanyaan dan jawaban di bawah ini. Ketika warga menanyakan hal yang cocok, sistem akan menjawab secara otomatis sesuai instruksi Admin!
            </p>

            {/* List Existing FAQs */}
            <div className="space-y-3">
              {(formSettings.chatbotFaqs || []).map(faq => (
                <div key={faq.id} className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl space-y-1.5 relative text-xs">
                  <div className="flex items-center justify-between pr-16">
                    <span className="font-bold text-slate-900 flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      <span>Q: {faq.question}</span>
                    </span>
                    <span className="bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded text-[10px]">
                      {faq.category || 'Informasi'}
                    </span>
                  </div>

                  <div className="text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200 whitespace-pre-wrap">
                    A: {faq.answer}
                  </div>

                  {faq.keywords && faq.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      <span className="text-[10px] text-slate-400 font-bold">Kata Kunci:</span>
                      {faq.keywords.map((kw, i) => (
                        <span key={i} className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.2 rounded font-mono">
                          {kw}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="absolute top-3 right-3 flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => handleEditFaqClick(faq)}
                      className="p-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg"
                      title="Edit FAQ"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteFaq(faq.id)}
                      className="p-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg"
                      title="Hapus FAQ"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Form Input/Edit FAQ */}
            <div className="bg-amber-50/60 border-2 border-amber-300 p-4 rounded-2xl space-y-3">
              <h4 className="font-bold text-xs text-amber-900 uppercase flex items-center space-x-1.5">
                <Plus className="w-4 h-4 text-amber-700" />
                <span>{editingFaq ? 'Edit Pertanyaan & Jawaban Admin' : 'Tambah Pertanyaan & Jawaban Baru (Rancangan Admin)'}</span>
              </h4>

              <div className="grid md:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Pertanyaan Warga / Judul FAQ</label>
                  <input
                    type="text"
                    placeholder="Contoh: Bagaimana prosedur evakuasi saat banjir?"
                    value={faqQuestion}
                    onChange={e => setFaqQuestion(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2.5 bg-white font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Kategori Topik</label>
                  <select
                    value={faqCategory}
                    onChange={e => setFaqCategory(e.target.value as any)}
                    className="w-full border border-slate-300 rounded-xl p-2.5 bg-white font-bold text-slate-900"
                  >
                    <option value="Bencana Alam">Bencana Alam</option>
                    <option value="Trantibum">Trantibum (Satpol PP)</option>
                    <option value="Mitigasi Bencana">Mitigasi Bencana</option>
                    <option value="Informasi Umum">Informasi Umum</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block font-bold text-slate-800 mb-1">Jawaban Otomatis dari Admin (Mendukung Markdown)</label>
                  <textarea
                    rows={3}
                    placeholder="Tuliskan jawaban rinci dan langkah instruksi resmi yang harus disampaikan mesin..."
                    value={faqAnswer}
                    onChange={e => setFaqAnswer(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2.5 bg-white font-medium text-slate-900"
                  ></textarea>
                </div>

                <div className="col-span-2">
                  <label className="block font-bold text-slate-800 mb-1">Kata Kunci Pemicu (Pisahkan dengan Koma)</label>
                  <input
                    type="text"
                    placeholder="Contoh: banjir, evakuasi, air naik, tergenang"
                    value={faqKeywords}
                    onChange={e => setFaqKeywords(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2.5 bg-white font-mono text-slate-900"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Sistem akan memicu jawaban ini jika pertanyaan warga mengandung salah satu kata kunci di atas.
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-1">
                {editingFaq && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingFaq(null);
                      setFaqQuestion('');
                      setFaqAnswer('');
                      setFaqKeywords('');
                    }}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold text-xs"
                  >
                    Batal Edit
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleAddOrUpdateFaq}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold text-xs uppercase shadow"
                >
                  {editingFaq ? 'Simpan Perubahan Q&A' : '+ Tambah ke Daftar Q&A Bot'}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-red-600 hover:bg-red-500 text-white py-3 rounded-2xl font-bold text-xs uppercase"
          >
            Simpan Seluruh Pengaturan Website
          </button>
        </form>
      )}

      {/* ----------------- TAB 5: DATABASE SUPABASE & GOOGLE SHEETS ----------------- */}
      {activeTab === 'database' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 text-white space-y-6 shadow-xl">
          <div>
            <h3 className="text-lg font-black uppercase text-amber-400">INTEGRASI DATABASE SUPABASE & GOOGLE SHEETS</h3>
            <p className="text-xs text-slate-300">
              Skrip generator otomatis untuk pembuatan tabel database Supabase dan Google Sheets App Script sync.
            </p>
          </div>

          {/* Google Sheets Script Generator */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs text-emerald-400 flex items-center space-x-1.5">
                <FileSpreadsheet className="w-4 h-4" />
                <span>1. Google Sheets Apps Script (Auto-Create Sheet Schema)</span>
              </h4>
              <button
                onClick={() => copyToClipboard(googleAppsScript, 'sheet')}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-xl font-bold text-[11px] flex items-center space-x-1"
              >
                {copiedScript === 'sheet' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedScript === 'sheet' ? 'Tersalin!' : 'Salin Skrip Sheets'}</span>
              </button>
            </div>
            <pre className="bg-slate-900 p-3 rounded-xl text-[10px] font-mono text-slate-300 overflow-x-auto max-h-40">
              {googleAppsScript}
            </pre>
          </div>

          {/* Supabase DDL SQL Generator */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs text-amber-400 flex items-center space-x-1.5">
                <Database className="w-4 h-4" />
                <span>2. Supabase SQL DDL Script (Auto-Create Table Query)</span>
              </h4>
              <button
                onClick={() => copyToClipboard(supabaseSql, 'sql')}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-xl text-[11px] flex items-center space-x-1"
              >
                {copiedScript === 'sql' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedScript === 'sql' ? 'Tersalin!' : 'Salin SQL Supabase'}</span>
              </button>
            </div>
            <pre className="bg-slate-900 p-3 rounded-xl text-[10px] font-mono text-slate-300 overflow-x-auto max-h-40">
              {supabaseSql}
            </pre>
          </div>
        </div>
      )}

      {/* ----------------- TAB 6: PANDUAN DEPLOYMENT VERCEL ----------------- */}
      {activeTab === 'vercel' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 text-white space-y-6 shadow-xl">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-xl font-black uppercase text-amber-400 flex items-center space-x-2">
              <BookOpen className="w-6 h-6" />
              <span>PANDUAN DEPLOYMENT APLIKASI KELUARAN KE VERCEL / NETLIFY</span>
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              Petunjuk langkah demi langkah mendeploy aplikasi SIPITUNG ke platform hosting cloud Vercel.
            </p>
          </div>

          <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
              <h4 className="font-bold text-amber-400 uppercase">Langkah 1: Ekspor / Push Kode ke Repository GitHub</h4>
              <p>
                1. Klik tombol **Export to GitHub / Download ZIP** pada menu Settings AI Studio.<br />
                2. Buat repository baru di akun GitHub Anda (misalnya: <code className="text-amber-300">sipitung-app</code>).
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
              <h4 className="font-bold text-amber-400 uppercase">Langkah 2: Hubungkan Repository ke Vercel</h4>
              <p>
                1. Buka dashboard <strong>Vercel.com</strong> dan klik <strong>Add New Project</strong>.<br />
                2. Pilih repository GitHub <code className="text-amber-300">sipitung-app</code> yang telah di-push.<br />
                3. Framework Preset akan otomatis terdeteksi sebagai <strong>Vite / Node.js</strong>.
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
              <h4 className="font-bold text-amber-400 uppercase">Langkah 3: Konfigurasi Environment Variables</h4>
              <p>Pada menu <strong>Environment Variables</strong> di Vercel, tambahkan variabel berikut:</p>
              <ul className="list-disc list-inside space-y-1 font-mono text-[11px] text-amber-300 pt-1">
                <li>GEMINI_API_KEY = (Kunci API Google Gemini Anda)</li>
                <li>NODE_ENV = production</li>
              </ul>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
              <h4 className="font-bold text-amber-400 uppercase">Langkah 4: Jalankan Deploy</h4>
              <p>
                Klik tombol <strong>Deploy</strong>. Vercel akan otomatis menjalankan skrip <code className="text-amber-300">npm run build</code> dan mempublikasikan aplikasi SIPITUNG Anda secara global dengan domain HTTPS gratis!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
