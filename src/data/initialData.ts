import { ReportType, ReportCategory, UserRole } from '../types';

export const REPORT_TYPE_LABELS: Record<string, { label: string; category: ReportCategory; color: string; iconName: string }> = {
  banjir: { label: 'Banjir & Luapan Air', category: 'bencana', color: 'bg-blue-600 text-white', iconName: 'Waves' },
  longsor: { label: 'Tanah Longsor', category: 'bencana', color: 'bg-amber-700 text-white', iconName: 'Mountain' },
  kebakaran: { label: 'Kebakaran Permukiman/Lahan', category: 'bencana', color: 'bg-red-600 text-white', iconName: 'Flame' },
  puting_beliung: { label: 'Angin Puting Beliung', category: 'bencana', color: 'bg-sky-600 text-white', iconName: 'Wind' },
  gempa: { label: 'Gempa Bumi / Bencana Geologi', category: 'bencana', color: 'bg-purple-700 text-white', iconName: 'Activity' },
  lainnya_bencana: { label: '✍️ Ketik Manual (Kejadian Bencana Lainnya)', category: 'bencana', color: 'bg-red-700 text-white', iconName: 'Edit3' },
  tawuran: { label: 'Tawuran & Kerusuhan', category: 'trantib', color: 'bg-orange-600 text-white', iconName: 'Swords' },
  pungli: { label: 'Pungli & Parkir Liar', category: 'trantib', color: 'bg-yellow-600 text-white', iconName: 'Ban' },
  kebisingan: { label: 'Gangguan Kebisingan / Sound Horeg', category: 'trantib', color: 'bg-teal-600 text-white', iconName: 'Volume2' },
  balap_liar: { label: 'Balap Liar & Gang Motor', category: 'trantib', color: 'bg-rose-700 text-white', iconName: 'Bike' },
  sampah: { label: 'Pembuangan Sampah Ilegal', category: 'trantib', color: 'bg-emerald-700 text-white', iconName: 'Trash2' },
  lainnya_trantib: { label: '✍️ Ketik Manual (Kejadian Trantibum Lainnya)', category: 'trantib', color: 'bg-gray-600 text-white', iconName: 'Edit3' },
  lainnya: { label: 'Kejadian Lainnya', category: 'trantib', color: 'bg-gray-600 text-white', iconName: 'AlertTriangle' }
};

export const DESA_KECAMATAN_TULIS = [
  'Beji',
  'Cluwuk',
  'Jolosekti',
  'Jrakahpayung',
  'Kaliboyo',
  'Kebumen',
  'Kedungsegog',
  'Kenconorejo',
  'Manggis',
  'Ponowareng',
  'Posong',
  'Sembojo',
  'Siberuk',
  'Simbangdesa',
  'Simbangjati',
  'Tulis',
  'Wringingintung'
];

export const KECAMATAN_TULIS_BOUNDS = {
  minLat: -7.0300,
  maxLat: -6.8800,
  minLng: 109.7500,
  maxLng: 109.8900,
  centerLat: -6.9536,
  centerLng: 109.8168
};

export function isWithinKecamatanTulis(lat: number, lng: number): boolean {
  return (
    lat >= KECAMATAN_TULIS_BOUNDS.minLat &&
    lat <= KECAMATAN_TULIS_BOUNDS.maxLat &&
    lng >= KECAMATAN_TULIS_BOUNDS.minLng &&
    lng <= KECAMATAN_TULIS_BOUNDS.maxLng
  );
}

export const PRESET_USERS: UserRole[] = [
  {
    name: 'Admin Posko Pusdalops',
    role: 'admin',
    email: 'admin.posko@sipitung.go.id',
    phone: '082327313277',
    unit: 'Pusdalops Kecamatan Tulis'
  }
];
