export type ReportCategory = 'bencana' | 'trantib';

export type ReportType =
  | 'banjir'
  | 'longsor'
  | 'kebakaran'
  | 'puting_beliung'
  | 'gempa'
  | 'tawuran'
  | 'pungli'
  | 'kebisingan'
  | 'balap_liar'
  | 'sampah'
  | 'lainnya';

export type ReportStatus = 'pending' | 'verifikasi' | 'diproses' | 'selesai' | 'ditolak';

export interface VictimData {
  meninggal: number;
  lukaBerat: number;
  lukaRingan: number;
  mengungsi: number;
  rumahRusak: number;
  deskripsi: string;
}

export interface Report {
  id: string;
  ticketId: string;
  namaPelapor: string;
  noWhatsapp: string;
  desa?: string;
  alamat: string;
  latitude: number;
  longitude: number;
  jenisKejadian: ReportType;
  kategori: ReportCategory;
  waktuKejadian: string;
  korban: VictimData;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  deskripsi: string;
  status: ReportStatus;
  catatanPetugas?: string;
  petugasAssigned?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  number: string;
  category: string;
  icon: string;
  active: boolean;
}

export interface EWSNotice {
  id: string;
  title: string;
  level: 'waspada' | 'siaga' | 'awas' | 'info';
  message: string;
  date: string;
  area: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  keywords: string[];
  category?: string;
}

export interface AppSettings {
  appName: string;
  tagline: string;
  logoUrl: string;
  agencyName: string;
  contactPhone: string;
  contactEmail: string;
  address: string;
  googleSheetsWebhookUrl: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  adminWhatsapp: string;
  adminPin: string;
  ewsActive: boolean;
  ewsNotice: EWSNotice;
  chatbotFaqs?: FaqItem[];
}

export interface UserRole {
  name: string;
  role: 'admin' | 'petugas' | 'masyarakat';
  email: string;
  phone: string;
  unit?: string;
}
