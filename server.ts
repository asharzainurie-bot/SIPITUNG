import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const PORT = 3000;

// Increase payload limit for photos / media base64
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CORS middleware for Vercel / cross-origin client access
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

// In-memory data store initialized empty (no dummy reports)
let reportsStore: any[] = [];

let appSettings = {
  appName: 'SIPITUNG',
  tagline: 'SIAGA PITULUNGAN - Layanan Aduan Bencana & Trantibum Kec. Tulis Kab. Batang',
  logoUrl: 'https://img.icons8.com/color/192/siren.png',
  agencyName: 'Pemerintah Kecamatan Tulis - BPBD & Satpol PP Kabupaten Batang',
  contactPhone: '082327313277 / Call Center 112',
  contactEmail: 'kecamatan.tulis@batangkab.go.id',
  address: 'Kantor Kecamatan Tulis, Jl. Raya Tulis No. 1, Kec. Tulis, Kabupaten Batang, Jawa Tengah 51261',
  googleSheetsWebhookUrl: '',
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
  adminWhatsapp: '082327313277',
  adminPin: '12345678',
  ewsActive: true,
  ewsNotice: {
    id: 'ews-001',
    title: 'PERINGATAN DINI CUACA EKSTREM & HUJAN DERAS - KECAMATAN TULIS',
    level: 'siaga',
    message: 'Potensi hujan lebat disertai angin kencang di wilayah Kecamatan Tulis (Desa Tulis, Simbangdesa, Posong, Beji, Kaliboyo). Imbauan kepada warga di sekitar aliran sungai dan lereng untuk siaga bencana.',
    date: '05 Agustus 2026',
    area: 'Kecamatan Tulis, Kabupaten Batang, Jawa Tengah'
  },
  chatbotFaqs: [
    {
      id: 'faq-1',
      question: 'Bagaimana prosedur evakuasi mandiri saat terjadi banjir?',
      answer: '📌 **Langkah Evakuasi Mandiri Banjir (Posko Pusdalops Tulis):**\n1. Segera matikan meteran listrik utama dan saluran gas rumah.\n2. Amankan dokumen penting dan Tas Siaga Bencana.\n3. Evakuasi keluarga dan lansia ke tempat tinggi / Posko Desa terdekat.\n4. Segera tekan **Tombol SOS** pada aplikasi SIPITUNG atau hubungi Hotline **082327313277**.',
      keywords: ['banjir', 'evakuasi', 'air naik', 'tergenang', 'kebanjiran'],
      category: 'Bencana Alam'
    },
    {
      id: 'faq-2',
      question: 'Apa yang harus dilakukan jika terjadi gempa bumi?',
      answer: '📌 **Langkah Saat Terjadi Gempa Bumi:**\n1. **Lindungi Kepala**: Berlindung di bawah meja kokoh (*Drop, Cover, Hold On*).\n2. Jauhi kaca, jendela, dan benda gantung.\n3. Setelah guncangan mereda, keluar bangunan secara tertib melalui tangga darurat.\n4. Menuju titik kumpul terbuka jauh dari tiang listrik dan pohon tinggi.',
      keywords: ['gempa', 'guncangan', 'lindungi kepala', 'gempa bumi', 'lindung'],
      category: 'Bencana Alam'
    },
    {
      id: 'faq-3',
      question: 'Bagaimana cara melaporkan Pungli, Parkir Liar, atau Gangguan Ketertiban (Satpol PP)?',
      answer: '📌 **Cara Lapor Gangguan Trantibum & Pungli:**\n1. Buka menu **Buat Aduan / Laporan** di SIPITUNG.\n2. Pilih Kategori **Gangguan Trantibum**.\n3. Gunakan Opsi Kamera HP / Upload foto bukti kejadian.\n4. Pilih Desa kejadian di Kecamatan Tulis dan kirim aduan.\n5. Petugas Satpol PP Tulis akan segera memverifikasi dan menuju lokasi.',
      keywords: ['pungli', 'parkir liar', 'satpol pp', 'tawuran', 'kebisingan', 'trantibum', 'lapor', 'pengamen'],
      category: 'Trantibum'
    },
    {
      id: 'faq-4',
      question: 'Berapa nomor darurat yang bisa dihubungi 24 jam?',
      answer: '🚨 **Daftar Nomor Darurat Posko SIPITUNG Kecamatan Tulis:**\n- **Call Center Kedaruratan Pemda**: 112 (Bebas Pulsa)\n- **Hotline WhatsApp Posko Tulis**: 082327313277\n- **BASARNAS (Evakuasi)**: 115\n- **POLRI**: 110\n- **Pemadam Kebakaran**: 113\n- **Ambulans Medis**: 118',
      keywords: ['nomor darurat', 'hotline', 'telepon', 'call center', '112', 'kontak', 'whatsapp', 'nomor'],
      category: 'Informasi Umum'
    },
    {
      id: 'faq-5',
      question: 'Apa saja barang yang harus disiapkan dalam Tas Siaga Bencana (Emergency Kit)?',
      answer: '🎒 **Isi Tas Siaga Bencana (Emergency Kit):**\n1. Makanan siap saji & air minum (minimal untuk 3 hari).\n2. Kotak P3K, obat-obatan pribadi, & masker.\n3. Pakaian ganti & selimut tipis.\n4. Lampu senter, baterai cadangan, & peluit darurat.\n5. Uang tunai secukupnya & salinan dokumen penting (KTP, KK, Surat Tanah).\n6. Powerbank & HP terisi penuh.',
      keywords: ['tas siaga', 'emergency kit', 'persiapan', 'perbekalan', 'dokumen', 'perlengkapan'],
      category: 'Mitigasi Bencana'
    }
  ]
};

let emergencyContacts = [
  { id: '1', name: 'Call Center Kedaruratan', number: '112', category: 'Umum / Pemda', icon: 'PhoneCall', active: true },
  { id: '2', name: 'BASARNAS (Pencarian & Pertolongan)', number: '115', category: 'SAR & Evakuasi', icon: 'LifeBuoy', active: true },
  { id: '3', name: 'Kepolisian RI (POLRI)', number: '110', category: 'Keamanan / Trantib', icon: 'ShieldAlert', active: true },
  { id: '4', name: 'Dinas Pemadam Kebakaran', number: '113', category: 'Kebakaran & Penyelamatan', icon: 'Flame', active: true },
  { id: '5', name: 'Ambulans Kedaruratan Medis', number: '118', category: 'Kesehatan', icon: 'Ambulance', active: true },
  { id: '6', name: 'Posko BPBD Daerah', number: '0811-234-567', category: 'Bencana Alam', icon: 'CloudRain', active: true },
  { id: '7', name: 'Posko Satpol PP / Trantibum', number: '0812-987-654', category: 'Ketertiban Umum', icon: 'Building2', active: true }
];

// Helper to initialize Gemini SDK
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
}

// Helper to initialize Supabase Client
function getSupabaseClient() {
  const url = appSettings.supabaseUrl || process.env.SUPABASE_URL;
  const key = appSettings.supabaseAnonKey || process.env.SUPABASE_ANON_KEY;
  if (!url || !key || !url.startsWith('http')) {
    return null;
  }
  try {
    return createClient(url, key);
  } catch (err) {
    console.error('Supabase initialization error:', err);
    return null;
  }
}

// Helpers to format report objects for Supabase table compatibility (camelCase & snake_case)
function toCamelRecord(r: any) {
  return {
    id: String(r.id),
    ticketId: String(r.ticketId),
    namaPelapor: String(r.namaPelapor),
    noWhatsapp: String(r.noWhatsapp),
    desa: String(r.desa || 'Tulis'),
    alamat: String(r.alamat),
    latitude: Number(r.latitude) || -6.9536,
    longitude: Number(r.longitude) || 109.8168,
    jenisKejadian: String(r.jenisKejadian),
    kategori: String(r.kategori),
    waktuKejadian: String(r.waktuKejadian),
    korban: typeof r.korban === 'object' ? JSON.stringify(r.korban) : String(r.korban || ''),
    mediaUrl: String(r.mediaUrl || ''),
    mediaType: String(r.mediaType || 'image'),
    deskripsi: String(r.deskripsi || ''),
    status: String(r.status || 'pending'),
    catatanPetugas: String(r.catatanPetugas || ''),
    petugasAssigned: String(r.petugasAssigned || ''),
    createdAt: String(r.createdAt),
    updatedAt: String(r.updatedAt)
  };
}

function toSnakeRecord(r: any) {
  return {
    id: String(r.id),
    ticket_id: String(r.ticketId),
    nama_pelapor: String(r.namaPelapor),
    no_whatsapp: String(r.noWhatsapp),
    desa: String(r.desa || 'Tulis'),
    alamat: String(r.alamat),
    latitude: Number(r.latitude) || -6.9536,
    longitude: Number(r.longitude) || 109.8168,
    jenis_kejadian: String(r.jenisKejadian),
    kategori: String(r.kategori),
    waktu_kejadian: String(r.waktuKejadian),
    korban: typeof r.korban === 'object' ? JSON.stringify(r.korban) : String(r.korban || ''),
    media_url: String(r.mediaUrl || ''),
    media_type: String(r.mediaType || 'image'),
    deskripsi: String(r.deskripsi || ''),
    status: String(r.status || 'pending'),
    catatan_petugas: String(r.catatanPetugas || ''),
    petugas_assigned: String(r.petugasAssigned || ''),
    created_at: String(r.createdAt),
    updated_at: String(r.updatedAt)
  };
}

function toLowerRecord(r: any) {
  return {
    id: String(r.id),
    ticketid: String(r.ticketId),
    namapelapor: String(r.namaPelapor),
    nowhatsapp: String(r.noWhatsapp),
    desa: String(r.desa || 'Tulis'),
    alamat: String(r.alamat),
    latitude: Number(r.latitude) || -6.9536,
    longitude: Number(r.longitude) || 109.8168,
    jeniskejadian: String(r.jenisKejadian),
    kategori: String(r.kategori),
    waktukejadian: String(r.waktuKejadian),
    korban: typeof r.korban === 'object' ? JSON.stringify(r.korban) : String(r.korban || ''),
    mediaurl: String(r.mediaUrl || ''),
    mediatype: String(r.mediaType || 'image'),
    deskripsi: String(r.deskripsi || ''),
    status: String(r.status || 'pending'),
    catatanpetugas: String(r.catatanPetugas || ''),
    petugasassigned: String(r.petugasAssigned || ''),
    createdat: String(r.createdAt),
    updatedat: String(r.updatedAt)
  };
}

function fromSupabaseRecord(r: any) {
  let korbanObj = r.korban;
  if (typeof r.korban === 'string') {
    try {
      korbanObj = JSON.parse(r.korban);
    } catch (e) {
      korbanObj = { deskripsi: r.korban };
    }
  }
  return {
    id: String(r.id),
    ticketId: r.ticketId || r.ticket_id || r.ticketid || r.id,
    namaPelapor: r.namaPelapor || r.nama_pelapor || r.namapelapor || 'Warga Tulis',
    noWhatsapp: r.noWhatsapp || r.no_whatsapp || r.nowhatsapp || '',
    desa: r.desa || 'Tulis',
    alamat: r.alamat || 'Kecamatan Tulis',
    latitude: Number(r.latitude) || -6.9536,
    longitude: Number(r.longitude) || 109.8168,
    jenisKejadian: r.jenisKejadian || r.jenis_kejadian || r.jeniskejadian || 'lainnya',
    kategori: r.kategori || 'bencana',
    waktuKejadian: r.waktuKejadian || r.waktu_kejadian || r.waktukejadian || new Date().toISOString(),
    korban: korbanObj || { meninggal: 0, lukaBerat: 0, lukaRingan: 0, mengungsi: 0, rumahRusak: 0, deskripsi: 'Nihil' },
    mediaUrl: r.mediaUrl || r.media_url || r.mediaurl || '',
    mediaType: r.mediaType || r.media_type || r.mediatype || 'image',
    deskripsi: r.deskripsi || '',
    status: r.status || 'pending',
    catatanPetugas: r.catatanPetugas || r.catatan_petugas || r.catatanpetugas || '',
    petugasAssigned: r.petugasAssigned || r.petugas_assigned || r.petugasassigned || '',
    createdAt: r.createdAt || r.created_at || r.createdat || new Date().toISOString(),
    updatedAt: r.updatedAt || r.updated_at || r.updatedat || new Date().toISOString()
  };
}

// Universal Supabase persistence operations with automatic table & schema retry
async function saveReportToSupabase(newReport: any): Promise<{ success: boolean; error?: string; table?: string }> {
  const sb = getSupabaseClient();
  if (!sb) return { success: false, error: 'URL & API Key Supabase belum dikonfigurasi di Pengaturan Admin' };

  const tables = ['reports', 'sipitung_reports'];
  
  const camelFull = toCamelRecord(newReport);
  const { id: _cId, ...camelNoId } = camelFull;

  const snakeFull = toSnakeRecord(newReport);
  const { id: _sId, ...snakeNoId } = snakeFull;

  const lowerFull = toLowerRecord(newReport);
  const { id: _lId, ...lowerNoId } = lowerFull;

  const camelKorbanObj = { ...camelFull, korban: newReport.korban };
  const snakeKorbanObj = { ...snakeFull, korban: newReport.korban };

  // Array of payload variants to try for maximum compatibility
  const payloadVariants = [
    { name: 'camelCase dengan ID', data: camelFull },
    { name: 'lowercase dengan ID', data: lowerFull },
    { name: 'snake_case dengan ID', data: snakeFull },
    { name: 'camelCase auto-generated ID', data: camelNoId },
    { name: 'lowercase auto-generated ID', data: lowerNoId },
    { name: 'snake_case auto-generated ID', data: snakeNoId },
    { name: 'camelCase dengan JSON Korban Object', data: camelKorbanObj },
    { name: 'snake_case dengan JSON Korban Object', data: snakeKorbanObj }
  ];

  let lastErrMsg = '';

  for (const table of tables) {
    for (const variant of payloadVariants) {
      let payload: Record<string, any> = { ...variant.data };

      // Attempt up to 5 times for automatic pruning of missing columns in schema cache
      for (let attempt = 0; attempt < 5; attempt++) {
        try {
          const { error } = await sb.from(table).insert([payload]);
          if (!error) {
            console.log(`[Supabase SUCCESS] Saved to table "${table}" using variant: ${variant.name}`);
            return { success: true, table };
          }

          lastErrMsg = error.message || '';

          // Detect missing column error in Supabase schema cache
          const colMatch =
            lastErrMsg.match(/Could not find the '([^']+)' column/i) ||
            lastErrMsg.match(/column "([^"]+)" of relation/i) ||
            lastErrMsg.match(/column '([^']+)'/i);

          if (colMatch && colMatch[1]) {
            const missingCol = colMatch[1];
            console.warn(`[Supabase Auto-Fix] Table "${table}" is missing column "${missingCol}". Removing and retrying...`);
            delete payload[missingCol];

            // Clean corresponding camel/snake variants if applicable
            if (missingCol.toLowerCase() === 'korban') delete payload['korban'];
            if (missingCol.toLowerCase() === 'ticketid') delete payload['ticketId'];
            if (missingCol.toLowerCase() === 'ticket_id') delete payload['ticket_id'];
            if (missingCol.toLowerCase() === 'namapelapor') delete payload['namaPelapor'];
            if (missingCol.toLowerCase() === 'nama_pelapor') delete payload['nama_pelapor'];

            continue; // Retry insertion on same table with pruned payload
          }

          break; // Non-missing-column error (e.g. RLS blocked or table missing), try next variant/table
        } catch (err: any) {
          lastErrMsg = err.message || String(err);
          break;
        }
      }
    }
  }

  console.error('[Supabase FAIL] All insert attempts failed:', lastErrMsg);
  return { success: false, error: lastErrMsg };
}

async function fetchReportsFromSupabase(): Promise<{ reports: any[]; table: string } | null> {
  const sb = getSupabaseClient();
  if (!sb) return null;

  const tables = ['reports', 'sipitung_reports'];
  for (const table of tables) {
    try {
      const { data, error } = await sb.from(table).select('*');
      if (!error && Array.isArray(data) && data.length > 0) {
        return {
          reports: data.map(fromSupabaseRecord),
          table
        };
      }
    } catch (e) {
      // continue next table
    }
  }
  return null;
}

async function updateReportInSupabase(updatedReport: any): Promise<boolean> {
  const sb = getSupabaseClient();
  if (!sb) return false;

  const tables = ['reports', 'sipitung_reports'];
  const camelData = toCamelRecord(updatedReport);
  const snakeData = toSnakeRecord(updatedReport);

  for (const table of tables) {
    try {
      const { error: e1 } = await sb.from(table).update(camelData).eq('id', updatedReport.id);
      if (!e1) return true;

      const { error: e2 } = await sb.from(table).update(snakeData).eq('id', updatedReport.id);
      if (!e2) return true;

      // Try matching ticketId
      if (updatedReport.ticketId) {
        const { error: e3 } = await sb.from(table).update(camelData).eq('ticketId', updatedReport.ticketId);
        if (!e3) return true;

        const { error: e4 } = await sb.from(table).update(snakeData).eq('ticket_id', updatedReport.ticketId);
        if (!e4) return true;
      }
    } catch (e) {
      // continue
    }
  }

  return false;
}

async function deleteReportFromSupabase(id: string): Promise<boolean> {
  const sb = getSupabaseClient();
  if (!sb) return false;

  const tables = ['reports', 'sipitung_reports'];
  for (const table of tables) {
    try {
      const { error: e1 } = await sb.from(table).delete().eq('id', id);
      if (!e1) return true;

      const { error: e2 } = await sb.from(table).delete().eq('ticketId', id);
      if (!e2) return true;

      const { error: e3 } = await sb.from(table).delete().eq('ticket_id', id);
      if (!e3) return true;
    } catch (e) {
      // continue
    }
  }
  return false;
}

// ------------------- API ROUTES ------------------- //

// Health Check
app.get('/api/health', (req: Request, res: Response) => {
  const supabaseActive = !!getSupabaseClient();
  res.json({
    status: 'ok',
    app: 'SIPITUNG Server Active',
    supabaseConnected: supabaseActive,
    timestamp: new Date().toISOString()
  });
});

// Test Supabase Connection Endpoint
app.post('/api/supabase/test', async (req: Request, res: Response) => {
  try {
    const { url, anonKey } = req.body;
    const targetUrl = (url || appSettings.supabaseUrl || process.env.SUPABASE_URL || '').trim();
    const targetKey = (anonKey || appSettings.supabaseAnonKey || process.env.SUPABASE_ANON_KEY || '').trim();

    if (!targetUrl || !targetKey || !targetUrl.startsWith('http')) {
      res.status(400).json({
        success: false,
        message: 'Mohon isi URL Supabase (https://xxx.supabase.co) dan Anon Public API Key terlebih dahulu!'
      });
      return;
    }

    // Instantly save to memory so client is active
    appSettings.supabaseUrl = targetUrl;
    appSettings.supabaseAnonKey = targetKey;

    const sb = createClient(targetUrl, targetKey);
    let activeTable = '';
    let rowCount = 0;
    let selectErrorMsg = '';

    for (const tbl of ['reports', 'sipitung_reports']) {
      const { data, error } = await sb.from(tbl).select('*').limit(1);
      if (!error) {
        activeTable = tbl;
        rowCount = data ? data.length : 0;
        break;
      } else {
        selectErrorMsg = error.message;
      }
    }

    if (!activeTable) {
      res.status(400).json({
        success: false,
        message: `Koneksi ke Supabase Gagal / Tabel 'reports' belum dibuat di Supabase.\n\nDetail Error: ${selectErrorMsg}\n\n💡 SOLUSI: Buka Supabase Dashboard > SQL Editor, lalu Paste & Run Script SQL Setup yang ada di bawah!`,
        error: selectErrorMsg
      });
      return;
    }

    // TEST WRITE / INSERT PERMISSION
    const dummyTestReport = {
      id: 'test-' + Date.now(),
      ticketId: 'TEST-PERM-' + Math.floor(100 + Math.random() * 900),
      namaPelapor: 'UJI SYSTEM SUPABASE',
      noWhatsapp: '081234567890',
      desa: 'Tulis',
      alamat: 'Tes Koneksi Penyimpanan',
      latitude: -6.9536,
      longitude: 109.8168,
      jenisKejadian: 'uji_sistem',
      kategori: 'bencana',
      waktuKejadian: new Date().toISOString(),
      korban: { meninggal: 0, lukaBerat: 0, lukaRingan: 0, mengungsi: 0, rumahRusak: 0, deskripsi: 'Nihil' },
      mediaUrl: 'https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?auto=format&fit=crop&w=800&q=80',
      mediaType: 'image',
      deskripsi: 'Tes verifikasi hak akses simpan laporan.',
      status: 'pending',
      catatanPetugas: '',
      petugasAssigned: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const writeTestResult = await saveReportToSupabase(dummyTestReport);

    if (writeTestResult.success) {
      // Clean up dummy report
      await deleteReportFromSupabase(dummyTestReport.id);

      res.json({
        success: true,
        message: `🎉 KONEKSI & IZIN SIMPAN SUPABASE 100% BERHASIL!\n\nTabel "${activeTable}" ditemukan dan izin penulisan data berjalan lancar. Seluruh laporan aduan warga dari sekarang akan otomatis tersimpan permanen di Supabase!`,
        table: activeTable,
        rowCount
      });
    } else {
      res.status(400).json({
        success: false,
        message: `⚠️ KONEKSI TERHUBUNG, TAPI PENYIMPANAN DIBLOKIR!\n\nDetail Error: ${writeTestResult.error}\n\n💡 SOLUSI CARA MEMPERBAIKI:\nBuka Supabase Dashboard > SQL Editor, jalankan perintah ini untuk mematikan RLS:\nALTER TABLE reports DISABLE ROW LEVEL SECURITY;`,
        error: writeTestResult.error
      });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, message: `Error: ${err.message}` });
  }
});

// GET Settings
app.get('/api/settings', (req: Request, res: Response) => {
  res.json({ success: true, settings: appSettings, contacts: emergencyContacts });
});

// POST Settings
app.post('/api/settings', (req: Request, res: Response) => {
  try {
    const { settings, contacts } = req.body;
    if (settings) {
      appSettings = { ...appSettings, ...settings };
    }
    if (contacts && Array.isArray(contacts)) {
      emergencyContacts = contacts;
    }
    res.json({ success: true, message: 'Pengaturan website berhasil diperbarui.', settings: appSettings, contacts: emergencyContacts });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET Reports
app.get('/api/reports', async (req: Request, res: Response) => {
  const { search, status, kategori, jenis } = req.query;

  // Try fetching from Supabase if connected
  const sbResult = await fetchReportsFromSupabase();
  if (sbResult && sbResult.reports.length > 0) {
    // Sync memory store with cloud data
    reportsStore = sbResult.reports;
  }

  let filtered = [...reportsStore];

  if (search) {
    const q = String(search).toLowerCase();
    filtered = filtered.filter(
      r =>
        r.ticketId.toLowerCase().includes(q) ||
        r.namaPelapor.toLowerCase().includes(q) ||
        r.alamat.toLowerCase().includes(q) ||
        r.noWhatsapp.includes(q) ||
        r.deskripsi.toLowerCase().includes(q)
    );
  }

  if (status && status !== 'all') {
    filtered = filtered.filter(r => r.status === status);
  }

  if (kategori && kategori !== 'all') {
    filtered = filtered.filter(r => r.kategori === kategori);
  }

  if (jenis && jenis !== 'all') {
    filtered = filtered.filter(r => r.jenisKejadian === jenis);
  }

  // Sort descending by date
  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({
    success: true,
    count: filtered.length,
    reports: filtered,
    supabaseActive: !!sbResult
  });
});

// GET Single Report by Ticket or ID
app.get('/api/reports/:id', (req: Request, res: Response) => {
  const param = req.params.id;
  const found = reportsStore.find(r => r.id === param || r.ticketId.toUpperCase() === param.toUpperCase());
  if (!found) {
    res.status(404).json({ success: false, message: 'Laporan tidak ditemukan' });
    return;
  }
  res.json({ success: true, report: found });
});

// GET Report Photo Directly (For WhatsApp Link Viewing)
app.get('/api/reports/:id/photo', (req: Request, res: Response) => {
  const param = req.params.id;
  const found = reportsStore.find(r => r.id === param || r.ticketId.toUpperCase() === param.toUpperCase());
  
  if (!found || !found.mediaUrl) {
    res.status(404).send('Foto tidak ditemukan untuk laporan ini.');
    return;
  }

  const mediaUrl = found.mediaUrl;

  if (mediaUrl.startsWith('data:image/')) {
    // Parse base64 image and serve as binary image file
    const mimeMatch = mediaUrl.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const base64Data = mediaUrl.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');
    const imgBuffer = Buffer.from(base64Data, 'base64');

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(imgBuffer);
  } else if (mediaUrl.startsWith('http://') || mediaUrl.startsWith('https://')) {
    res.redirect(mediaUrl);
  } else {
    res.redirect(mediaUrl);
  }
});

// POST New Report
app.post('/api/reports', async (req: Request, res: Response) => {
  try {
    const {
      namaPelapor,
      noWhatsapp,
      desa,
      alamat,
      latitude,
      longitude,
      jenisKejadian,
      kategori,
      waktuKejadian,
      korban,
      mediaUrl,
      mediaType,
      deskripsi
    } = req.body;

    if (!namaPelapor || !noWhatsapp || !desa || !alamat || !jenisKejadian) {
      res.status(400).json({ success: false, message: 'Mohon lengkapi seluruh data wajib laporan termasuk pilihan Desa!' });
      return;
    }

    const lat = Number(latitude) || -6.9536;
    const lng = Number(longitude) || 109.8168;

    // Check bounds for Kecamatan Tulis, Kab. Batang
    const isWithinTulis = lat >= -7.0300 && lat <= -6.8800 && lng >= 109.7500 && lng <= 109.8900;
    if (!isWithinTulis) {
      res.status(400).json({
        success: false,
        message: 'PERINGATAN: Titik lokasi yang Anda pilih berada di luar wilayah Kecamatan Tulis, Kabupaten Batang! Sistem aduan ini khusus untuk wilayah Kecamatan Tulis.'
      });
      return;
    }

    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSeq = Math.floor(100 + Math.random() * 900);
    const ticketId = `SPT-${todayStr}-${randomSeq}`;

    const newReport = {
      id: 'rpt-' + Date.now(),
      ticketId,
      namaPelapor,
      noWhatsapp: String(noWhatsapp).trim(),
      desa: desa || 'Tulis',
      alamat,
      latitude: lat,
      longitude: lng,
      jenisKejadian,
      kategori: kategori || (['banjir', 'longsor', 'kebakaran', 'puting_beliung', 'gempa'].includes(jenisKejadian) ? 'bencana' : 'trantib'),
      waktuKejadian: waktuKejadian || new Date().toISOString().slice(0, 16),
      korban: korban || { meninggal: 0, lukaBerat: 0, lukaRingan: 0, mengungsi: 0, rumahRusak: 0, deskripsi: 'Nihil' },
      mediaUrl: mediaUrl || 'https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?auto=format&fit=crop&w=800&q=80',
      mediaType: mediaType || 'image',
      deskripsi: deskripsi || '',
      status: 'pending',
      catatanPetugas: 'Laporan telah diterima dalam sistem SIPITUNG dan dalam antrean verifikasi petugas.',
      petugasAssigned: 'Belum ditugaskan',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Store in memory
    reportsStore.unshift(newReport);

    // Save to Supabase
    const sbSaveResult = await saveReportToSupabase(newReport);

    res.status(201).json({
      success: true,
      message: sbSaveResult.success
        ? 'Laporan aduan berhasil dikirim dan tersimpan di SUPABASE!'
        : `Laporan aduan berhasil dikirim. (Status Supabase: ${sbSaveResult.error || 'Client belum terkonfigurasi'})`,
      ticketId: newReport.ticketId,
      report: newReport,
      supabaseSaved: sbSaveResult.success,
      supabaseError: sbSaveResult.error
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT Update Report Status & Officer Response
app.put('/api/reports/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const index = reportsStore.findIndex(r => r.id === id || r.ticketId === id);
    if (index === -1) {
      res.status(404).json({ success: false, message: 'Laporan tidak ditemukan' });
      return;
    }

    const { status, catatanPetugas, petugasAssigned } = req.body;

    if (status) reportsStore[index].status = status;
    if (catatanPetugas !== undefined) reportsStore[index].catatanPetugas = catatanPetugas;
    if (petugasAssigned !== undefined) reportsStore[index].petugasAssigned = petugasAssigned;

    reportsStore[index].updatedAt = new Date().toISOString();

    const updated = reportsStore[index];

    // Sync update to Supabase
    await updateReportInSupabase(updated);

    res.json({
      success: true,
      message: 'Status dan tindak lanjut laporan berhasil diperbarui.',
      report: updated
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE Report
app.delete('/api/reports/:id', async (req: Request, res: Response) => {
  const id = req.params.id;
  const initialLength = reportsStore.length;
  const found = reportsStore.find(r => r.id === id || r.ticketId === id);
  reportsStore = reportsStore.filter(r => r.id !== id && r.ticketId !== id);

  if (reportsStore.length === initialLength) {
    res.status(404).json({ success: false, message: 'Laporan tidak ditemukan' });
    return;
  }

  // Delete from Supabase
  if (found) {
    await deleteReportFromSupabase(found.id);
  }

  res.json({ success: true, message: 'Laporan berhasil dihapus dari sistem.' });
});

// POST Trigger Emergency SOS Alert
app.post('/api/sos', async (req: Request, res: Response) => {
  try {
    const { nama, phone, latitude, longitude, address, note } = req.body;
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSeq = Math.floor(100 + Math.random() * 900);
    const ticketId = `SOS-${todayStr}-${randomSeq}`;

    const sosReport = {
      id: 'sos-' + Date.now(),
      ticketId,
      namaPelapor: nama || 'WARGA DARURAT (SOS)',
      noWhatsapp: phone || '082327313277',
      desa: 'Tulis',
      alamat: address || 'Lokasi Terdeteksi GPS Darurat',
      latitude: Number(latitude) || -6.9536,
      longitude: Number(longitude) || 109.8168,
      jenisKejadian: 'kebakaran', // Default emergency high priority category
      kategori: 'bencana',
      waktuKejadian: new Date().toISOString().slice(0, 16),
      korban: { meninggal: 0, lukaBerat: 0, lukaRingan: 1, mengungsi: 0, rumahRusak: 0, deskripsi: 'Panggilan Kedaruratan SOS Tombol Merah Panic Button' },
      mediaUrl: 'https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?auto=format&fit=crop&w=800&q=80',
      mediaType: 'image',
      deskripsi: `🚨 PANIC BUTTON / SOS REACTION TRIGGER: ${note || 'Bantuan Darurat Segera Dibutuhkan di Lokasi GPS!'}`,
      status: 'pending',
      catatanPetugas: '🚨 PERINGATAN SOS DARURAT! Tim Reaksi Cepat (TRC) Pusdalops Tulis & Satpol PP dalam perjalanan!',
      petugasAssigned: 'Tim TRC Posko Utama',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    reportsStore.unshift(sosReport);

    // Save to Supabase
    const sbSaveResult = await saveReportToSupabase(sosReport);

    res.status(201).json({
      success: true,
      message: '🚨 SIGNALS SOS BERHASIL DIKIRIM KE POSKO PUSDALOPS TULIS!',
      ticketId: sosReport.ticketId,
      report: sosReport,
      supabaseSaved: sbSaveResult.success
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST Chatbot AI Mitigation Assistant (Manual FAQ First + Gemini Backup)
app.post('/api/gemini/chat', async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      res.status(400).json({ success: false, error: 'Prompt tidak boleh kosong.' });
      return;
    }

    const cleanQuery = String(prompt).toLowerCase().trim();

    // 1. Manual Knowledge Engine Check (Admin Configured Q&A)
    const faqs = appSettings.chatbotFaqs || [];
    let bestMatch: any = null;
    let matchScore = 0;

    for (const faq of faqs) {
      const faqQ = faq.question.toLowerCase();
      let currentScore = 0;

      // Direct question match or substring
      if (cleanQuery.includes(faqQ) || faqQ.includes(cleanQuery)) {
        currentScore += 10;
      }

      // Check keywords
      if (Array.isArray(faq.keywords)) {
        for (const kw of faq.keywords) {
          const cleanKw = kw.toLowerCase().trim();
          if (cleanKw && cleanQuery.includes(cleanKw)) {
            currentScore += 3;
          }
        }
      }

      if (currentScore > matchScore) {
        matchScore = currentScore;
        bestMatch = faq;
      }
    }

    // If manual FAQ rule matched, reply with exact Admin answer!
    if (bestMatch && matchScore >= 3) {
      res.json({
        success: true,
        reply: `🤖 **[Respons Otomatis Basis Pengetahuan Posko Tulis]**\n\n${bestMatch.answer}`,
        source: 'manual_admin',
        matchedFaq: bestMatch.question
      });
      return;
    }

    // 2. Fallback to Gemini AI if API key exists
    const ai = getGeminiClient();
    if (!ai) {
      // Fallback response with list of available topics if no manual match and no key
      const availableTopics = faqs.map(f => `• ${f.question}`).join('\n');
      res.json({
        success: true,
        reply: `🤖 **[Asisten Otomatis Posko SIPITUNG Tulis]**\n\nMaaf, pertanyaan Anda *"${prompt}"* belum ada dalam basis data jawaban otomatis Admin.\n\n📌 **Beberapa Topik Jawaban Otomatis yang Tersedia:**\n${availableTopics}\n\n💡 *Gunakan menu **Hotline WhatsApp 082327313277** atau **Call Center 112** untuk konsultasi langsung dengan Petugas Pusdalops Tulis.*`,
        source: 'manual_fallback'
      });
      return;
    }

    const systemInstruction = `Anda adalah "SiagA AI", Asisten Kedaruratan resmi Posko SIPITUNG Kecamatan Tulis Kabupaten Batang.
Gunakan data acuan berikut jika relevan:
${faqs.map(f => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n')}

Berikan jawaban singkat, sigap, ramah, dan solutif dalam Bahasa Indonesia.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.5
      }
    });

    const replyText = response.text || 'Maaf, sistem sedang memproses informasi. Silakan ulangi pertanyaan Anda.';
    res.json({ success: true, reply: replyText, source: 'gemini' });
  } catch (err: any) {
    console.error('Chat Engine Error:', err);
    res.status(500).json({
      success: false,
      error: 'Terjadi kendala pada mesin balasan otomatis.',
      details: err.message
    });
  }
});

// GET Script Auto-Create Database Sheets & Supabase SQL
app.get('/api/database/scripts', (req: Request, res: Response) => {
  const googleAppsScript = `
function setupSipitungSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getActiveSheet();
  sheet.setName("Laporan_SIPITUNG");
  
  var headers = [
    "ID_Ticket", "Waktu_Lapor", "Nama_Pelapor", "No_WhatsApp", "Alamat_Kejadian", 
    "Latitude", "Longitude", "Kategori", "Jenis_Kejadian", "Waktu_Kejadian", 
    "Korban_Meninggal", "Korban_Luka_Berat", "Korban_Luka_Ringan", "Korban_Mengungsi", "Rumah_Rusak", 
    "Foto_Video_URL", "Deskripsi_Kronologi", "Status_Aduan", "Catatan_Petugas", "Petugas_Assigned"
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#dc2626").setFontColor("#ffffff");
  sheet.setFrozenRows(1);
}

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Laporan_SIPITUNG");
    var data = JSON.parse(e.postData.contents);
    
    sheet.appendRow([
      data.ticketId, new Date(), data.namaPelapor, data.noWhatsapp, data.alamat,
      data.latitude, data.longitude, data.kategori, data.jenisKejadian, data.waktuKejadian,
      data.korban ? data.korban.meninggal : 0, data.korban ? data.korban.lukaBerat : 0,
      data.korban ? data.korban.lukaRingan : 0, data.korban ? data.korban.mengungsi : 0,
      data.korban ? data.korban.rumahRusak : 0, data.mediaUrl, data.deskripsi,
      data.status || "pending", data.catatanPetugas || "", data.petugasAssigned || ""
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({"result": "success"})).setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({"result": "error", "message": err.toString()})).setMimeType(ContentService.MimeType.JSON);
  }
}
  `.trim();

  const supabaseSql = `
-- QUERY DDL REKAP TABEL DATABASE SUPABASE SIPITUNG
CREATE TABLE IF NOT EXISTS sipitung_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id VARCHAR(50) UNIQUE NOT NULL,
  nama_pelapor VARCHAR(150) NOT NULL,
  no_whatsapp VARCHAR(30) NOT NULL,
  alamat TEXT NOT NULL,
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  kategori VARCHAR(50) NOT NULL,
  jenis_kejadian VARCHAR(50) NOT NULL,
  waktu_kejadian TIMESTAMP WITH TIME ZONE,
  korban_meninggal INT DEFAULT 0,
  korban_luka_berat INT DEFAULT 0,
  korban_luka_ringan INT DEFAULT 0,
  korban_mengungsi INT DEFAULT 0,
  rumah_rusak INT DEFAULT 0,
  media_url TEXT,
  media_type VARCHAR(20) DEFAULT 'image',
  deskripsi TEXT,
  status VARCHAR(30) DEFAULT 'pending',
  catatan_petugas TEXT,
  petugas_assigned VARCHAR(150),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS) Enable
ALTER TABLE sipitung_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read Access" ON sipitung_reports FOR SELECT USING (true);
CREATE POLICY "Public Insert Access" ON sipitung_reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin Update Access" ON sipitung_reports FOR UPDATE USING (true);
  `.trim();

  res.json({
    success: true,
    googleAppsScript,
    supabaseSql
  });
});

// Vite Middleware & Production Serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SIPITUNG server running at http://localhost:${PORT}`);
  });
}

export default app;

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  startServer();
}
