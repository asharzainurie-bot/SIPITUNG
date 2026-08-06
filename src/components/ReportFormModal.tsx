import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import {
  Send,
  MapPin,
  Upload,
  Camera,
  AlertTriangle,
  Users,
  CheckCircle,
  FileText,
  Phone,
  Calendar,
  X,
  Layers,
  Sparkles,
  MessageSquare,
  Edit3
} from 'lucide-react';
import { REPORT_TYPE_LABELS, DESA_KECAMATAN_TULIS, KECAMATAN_TULIS_BOUNDS, isWithinKecamatanTulis } from '../data/initialData';
import { ReportType, ReportCategory, AppSettings } from '../types';

interface ReportFormModalProps {
  onReportSubmitted: (newReport: any) => void;
  onTrackTicket: (ticketId: string) => void;
  settings?: AppSettings;
}

export const ReportFormModal: React.FC<ReportFormModalProps> = ({ onReportSubmitted, onTrackTicket, settings }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const adminWhatsappNumber = settings?.adminWhatsapp || '082327313277';

  const [namaPelapor, setNamaPelapor] = useState('');
  const [noWhatsapp, setNoWhatsapp] = useState('');
  const [desa, setDesa] = useState<string>('Tulis');
  const [alamat, setAlamat] = useState('Desa Tulis, Kecamatan Tulis, Kabupaten Batang, Jawa Tengah');
  const [latitude, setLatitude] = useState<number>(-6.9536);
  const [longitude, setLongitude] = useState<number>(109.8168);
  const [gettingGps, setGettingGps] = useState(false);
  const [locationWarning, setLocationWarning] = useState<string | null>(null);

  const [category, setCategory] = useState<ReportCategory>('bencana');
  const [jenisKejadian, setJenisKejadian] = useState<ReportType>('banjir');
  const [customJenisText, setCustomJenisText] = useState<string>('');
  const [waktuKejadian, setWaktuKejadian] = useState(new Date().toISOString().slice(0, 16));

  // Korban
  const [meninggal, setMeninggal] = useState<number>(0);
  const [lukaBerat, setLukaBerat] = useState<number>(0);
  const [lukaRingan, setLukaRingan] = useState<number>(0);
  const [mengungsi, setMengungsi] = useState<number>(0);
  const [rumahRusak, setRumahRusak] = useState<number>(0);

  // Media & Deskripsi
  const [mediaUrl, setMediaUrl] = useState<string>('');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [deskripsi, setDeskripsi] = useState<string>('');

  // Camera refs & Live Webcam state
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isWebcamOpen, setIsWebcamOpen] = useState(false);
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      setWebcamStream(stream);
      setIsWebcamOpen(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Kamera tidak dapat diakses:', err);
      alert('Kamera tidak dapat diakses atau diizinkan. Silakan gunakan tombol Kamera HP / Pilih dari Galeri.');
    }
  };

  const stopWebcam = () => {
    if (webcamStream) {
      webcamStream.getTracks().forEach(track => track.stop());
      setWebcamStream(null);
    }
    setIsWebcamOpen(false);
  };

  const captureWebcamPhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setMediaUrl(dataUrl);
      setMediaType('image');
      stopWebcam();
    }
  };

  useEffect(() => {
    if (isWebcamOpen && videoRef.current && webcamStream) {
      videoRef.current.srcObject = webcamStream;
    }
  }, [isWebcamOpen, webcamStream]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<string | null>(null);

  // Helper to validate location inside Kecamatan Tulis
  const updatePinCoordinates = (lat: number, lng: number) => {
    const roundLat = Number(lat.toFixed(6));
    const roundLng = Number(lng.toFixed(6));

    if (!isWithinKecamatanTulis(roundLat, roundLng)) {
      setLocationWarning(
        `PERINGATAN: Titik lokasi yang Anda pilih (${roundLat}, ${roundLng}) berada di LUAR WILAYAH KECAMATAN TULIS, KABUPATEN BATANG. Peta ini khusus melayani 17 Desa di Kecamatan Tulis. Lokasi dikembalikan ke titik tengah Kecamatan Tulis.`
      );
      const centerLat = KECAMATAN_TULIS_BOUNDS.centerLat;
      const centerLng = KECAMATAN_TULIS_BOUNDS.centerLng;
      setLatitude(centerLat);
      setLongitude(centerLng);
      if (markerRef.current) markerRef.current.setLatLng([centerLat, centerLng]);
      if (mapInstanceRef.current) mapInstanceRef.current.panTo([centerLat, centerLng]);
    } else {
      setLocationWarning(null);
      setLatitude(roundLat);
      setLongitude(roundLng);
    }
  };

  // Initialize Interactive Leaflet Map for Pin Picking
  useEffect(() => {
    if (!mapContainerRef.current || submittedTicket) return;

    if (!mapInstanceRef.current) {
      const tulisBounds = L.latLngBounds(
        L.latLng(KECAMATAN_TULIS_BOUNDS.minLat, KECAMATAN_TULIS_BOUNDS.minLng),
        L.latLng(KECAMATAN_TULIS_BOUNDS.maxLat, KECAMATAN_TULIS_BOUNDS.maxLng)
      );

      const map = L.map(mapContainerRef.current, {
        center: [latitude, longitude],
        zoom: 14,
        minZoom: 12,
        maxBounds: tulisBounds,
        maxBoundsViscosity: 0.9,
        zoomControl: true
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap | Kec. Tulis Batang'
      }).addTo(map);

      const customPin = L.divIcon({
        className: 'custom-leaflet-marker-picker',
        html: `
          <div style="
            background-color: #dc2626;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 4px 12px rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 18px;
            cursor: grab;
          ">
            📍
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });

      const marker = L.marker([latitude, longitude], {
        draggable: true,
        icon: customPin
      }).addTo(map);

      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        updatePinCoordinates(pos.lat, pos.lng);
      });

      map.on('click', (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        updatePinCoordinates(lat, lng);
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;
    }
  }, [submittedTicket]);

  // Update marker & map view when lat/lng update via GPS button
  useEffect(() => {
    if (markerRef.current && mapInstanceRef.current) {
      markerRef.current.setLatLng([latitude, longitude]);
      mapInstanceRef.current.panTo([latitude, longitude]);
    }
  }, [latitude, longitude]);

  // Auto-detect location
  const handleDetectGps = () => {
    setGettingGps(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          updatePinCoordinates(pos.coords.latitude, pos.coords.longitude);
          setGettingGps(false);
        },
        err => {
          console.error(err);
          setGettingGps(false);
        },
        { enableHighAccuracy: true }
      );
    } else {
      setGettingGps(false);
    }
  };

  // Build WhatsApp message URL for Admin
  const getAdminWhatsappUrl = (ticketId: string) => {
    const rawNum = adminWhatsappNumber.replace(/\D/g, '');
    const cleanNum = rawNum.startsWith('0') ? '62' + rawNum.slice(1) : rawNum.startsWith('62') ? rawNum : '62' + rawNum;

    const isManual = jenisKejadian === 'lainnya_bencana' || jenisKejadian === 'lainnya_trantib' || jenisKejadian === 'lainnya';
    const labelJenis = isManual
      ? (customJenisText.trim() || 'Kejadian Lainnya (Manual)')
      : (REPORT_TYPE_LABELS[jenisKejadian]?.label || jenisKejadian);

    let fotoStatusText = 'Tidak ada foto diunggah.';
    if (mediaUrl) {
      if (mediaUrl.startsWith('http://') || mediaUrl.startsWith('https://')) {
        fotoStatusText = `📸 Link Tautan Foto Kejadian: ${mediaUrl}`;
      } else {
        fotoStatusText = `📸 Link Tautan Foto Kejadian: ${window.location.origin}/api/reports/${ticketId}/photo`;
      }
    }

    const text = `🚨 *LAPORAN ADUAN KEDARURATAN (SIPITUNG KEC. TULIS BATANG)* 🚨

*ID Tiket:* ${ticketId}
*Kategori:* ${category.toUpperCase()} (${labelJenis})
*Pelapor:* ${namaPelapor}
*WhatsApp Pelapor:* ${noWhatsapp}
*Desa:* Desa ${desa} (Kec. Tulis)
*Waktu Kejadian:* ${waktuKejadian}
*Alamat Lokasi:* ${alamat}
*Kordinat GPS:* ${latitude}, ${longitude}
*Peta Google Maps:* https://maps.google.com/?q=${latitude},${longitude}

*Estimasi Korban & Dampak:*
- Meninggal: ${meninggal} Jiwa
- Luka Berat/Ringan: ${lukaBerat}/${lukaRingan} Jiwa
- Mengungsi: ${mengungsi} Jiwa
- Rumah Rusak: ${rumahRusak} Unit

*Foto/Dokumentasi Lapangan:*
${fotoStatusText}

*Deskripsi Kronologi:*
${deskripsi || 'Sesuai formulir laporan aplikasi SIPITUNG.'}`;

    return `https://wa.me/${cleanNum}?text=${encodeURIComponent(text)}`;
  };

  // Image Upload Handling
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaUrl(reader.result as string);
        setMediaType(file.type.startsWith('video') ? 'video' : 'image');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaPelapor || !noWhatsapp || !desa || !alamat) {
      alert('Mohon lengkapi Nama, WhatsApp, Pilihan Desa, dan Alamat!');
      return;
    }

    const isManual = jenisKejadian === 'lainnya_bencana' || jenisKejadian === 'lainnya_trantib' || jenisKejadian === 'lainnya';
    if (isManual && !customJenisText.trim()) {
      alert('Mohon ketikkan jenis kejadian spesifik pada kolom manual!');
      return;
    }

    if (!isWithinKecamatanTulis(latitude, longitude)) {
      alert('PERINGATAN: Titik lokasi yang Anda pilih berada di luar wilayah Kecamatan Tulis, Kabupaten Batang! Sistem aduan ini khusus untuk wilayah Kecamatan Tulis.');
      return;
    }

    setIsSubmitting(true);

    const finalJenisKejadian = isManual ? customJenisText.trim() : jenisKejadian;

    const payload = {
      namaPelapor,
      noWhatsapp,
      desa,
      alamat,
      latitude,
      longitude,
      jenisKejadian: finalJenisKejadian,
      kategori: category,
      waktuKejadian,
      korban: {
        meninggal,
        lukaBerat,
        lukaRingan,
        mengungsi,
        rumahRusak,
        deskripsi: `Meninggal: ${meninggal}, Luka: ${lukaBerat + lukaRingan}, Mengungsi: ${mengungsi}, Rumah Rusak: ${rumahRusak}`
      },
      mediaUrl: mediaUrl || 'https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?auto=format&fit=crop&w=800&q=80',
      mediaType,
      deskripsi
    };

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        alert('Respon server tidak valid (bukan JSON). Pastikan Vercel Serverless Function telah aktif atau URL Supabase sudah dikonfigurasi.');
        return;
      }

      const data = await res.json();
      if (data.success) {
        setSubmittedTicket(data.ticketId);
        onReportSubmitted(data.report);

        // Auto redirect to WhatsApp Admin
        const waUrl = getAdminWhatsappUrl(data.ticketId);
        window.open(waUrl, '_blank');
      } else {
        alert(data.message || 'Gagal mengirim laporan');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan jaringan saat membuat aduan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSubmittedTicket(null);
    setNamaPelapor('');
    setNoWhatsapp('');
    setAlamat('Desa Tulis, Kecamatan Tulis, Kabupaten Batang, Jawa Tengah');
    setDeskripsi('');
    setMediaUrl('');
    setMeninggal(0);
    setLukaBerat(0);
    setLukaRingan(0);
    setMengungsi(0);
    setRumahRusak(0);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Banner Header */}
        <div className="bg-gradient-to-r from-red-700 via-rose-700 to-amber-600 p-6 text-white">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
              <FileText className="w-8 h-8 text-yellow-300" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight">FORMULIR ADUAN & LAPORAN</h2>
              <p className="text-xs text-red-100 mt-0.5">
                Layanan Pelaporan Bencana Alam dan Gangguan Ketentraman & Ketertiban Umum (Trantibum)
              </p>
            </div>
          </div>
        </div>

        {submittedTicket ? (
          /* Submission Success State */
          <div className="p-8 text-center space-y-5">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner animate-bounce">
              <CheckCircle className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-800">LAPORAN BERHASIL TERKIRIM!</h3>
              <p className="text-sm text-slate-600 mt-1">
                Laporan Anda telah masuk ke dalam sistem Posko Pengendalian SIPITUNG.
              </p>
            </div>

            <div className="bg-slate-900 text-white p-6 rounded-2xl max-w-md mx-auto shadow-xl space-y-2 border border-slate-800">
              <span className="text-xs text-slate-400 font-semibold uppercase">Nomor ID Tiket Pelacakan Anda:</span>
              <p className="text-2xl font-mono font-black text-amber-400 tracking-wider">{submittedTicket}</p>
              <p className="text-xs text-slate-300 pt-2 border-t border-slate-800">
                Simpan nomor tiket ini untuk memantau status penanganan oleh tim petugas secara real-time.
              </p>
            </div>

            {/* Direct WhatsApp Forwarding to Admin */}
            <div className="max-w-md mx-auto space-y-3 bg-emerald-50 border-2 border-emerald-500/40 p-4 rounded-2xl text-left">
              <p className="text-xs text-emerald-900 font-bold flex items-center space-x-1.5">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <span>📲 Diteruskan Langsung ke WhatsApp Admin Kedaruratan:</span>
              </p>

              {mediaUrl && (
                <div className="bg-white p-2.5 rounded-xl border border-emerald-200 flex items-center space-x-3">
                  <img
                    src={mediaUrl}
                    alt="Bukti Foto Kejadian"
                    className="w-14 h-14 object-cover rounded-lg border border-slate-200 shrink-0"
                  />
                  <div className="text-[11px] text-slate-700 leading-tight">
                    <strong className="block text-emerald-800 font-bold mb-0.5">📸 Foto Bukti Kejadian Terlampir</strong>
                    <span>Format ringkasan teks & status foto sudah disiapkan untuk dikirim ke WhatsApp Admin.</span>
                  </div>
                </div>
              )}

              <a
                href={getAdminWhatsappUrl(submittedTicket)}
                target="_blank"
                rel="noreferrer"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 px-4 rounded-xl font-black text-xs uppercase flex items-center justify-center space-x-2 shadow-lg transition transform hover:-translate-y-0.5"
              >
                <MessageSquare className="w-4 h-4 text-emerald-200" />
                <span>KIRIM ADUAN KE WHATSAPP ADMIN ({adminWhatsappNumber})</span>
              </a>

              <p className="text-[10px] text-emerald-700 italic text-center">
                *Tips: Anda juga dapat melampirkan file foto asli secara langsung saat aplikasi WhatsApp terbuka.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <button
                onClick={() => onTrackTicket(submittedTicket)}
                className="w-full sm:w-auto bg-red-600 hover:bg-red-500 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase shadow-lg transition"
              >
                Lacak Status Aduan Ini &rarr;
              </button>
              <button
                onClick={resetForm}
                className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-3 rounded-xl font-bold text-xs uppercase transition"
              >
                Buat Laporan Baru
              </button>
            </div>
          </div>
        ) : (
          /* Main Form */
          <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
            {/* 1. Data Pelapor */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
                <Users className="w-5 h-5 text-red-600" />
                <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider">1. Identitas Pelapor</h3>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Lengkap Pelapor <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Budi Santoso"
                    value={namaPelapor}
                    onChange={e => setNamaPelapor(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-red-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nomor WhatsApp Pelapor <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="tel"
                      required
                      placeholder="081234567890"
                      value={noWhatsapp}
                      onChange={e => setNoWhatsapp(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-red-500 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-slate-800 font-mono focus:outline-none transition"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Jenis & Waktu Kejadian */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
                <Layers className="w-5 h-5 text-red-600" />
                <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider">2. Jenis & Waktu Kejadian</h3>
              </div>

              {/* Kategori Toggle */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setCategory('bencana');
                    setJenisKejadian('banjir');
                  }}
                  className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-2 transition ${
                    category === 'bencana'
                      ? 'bg-red-600 text-white border-red-600 shadow-md'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-300'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>Bencana Alam</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCategory('trantib');
                    setJenisKejadian('pungli');
                  }}
                  className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-2 transition ${
                    category === 'trantib'
                      ? 'bg-amber-600 text-white border-amber-600 shadow-md'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-300'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Gangguan Trantibum</span>
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jenis Kejadian Spesifik <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={jenisKejadian}
                    onChange={e => setJenisKejadian(e.target.value as ReportType)}
                    className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-red-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-bold focus:outline-none transition"
                  >
                    {Object.entries(REPORT_TYPE_LABELS)
                      .filter(([_, item]) => item.category === category)
                      .map(([key, item]) => (
                        <option key={key} value={key}>
                          {item.label}
                        </option>
                      ))}
                  </select>

                  {(jenisKejadian === 'lainnya_bencana' || jenisKejadian === 'lainnya_trantib' || jenisKejadian === 'lainnya') && (
                    <div className="mt-2.5 animate-fadeIn">
                      <label className="block text-[11px] font-bold text-red-700 mb-1 flex items-center space-x-1">
                        <Edit3 className="w-3.5 h-3.5 text-red-600" />
                        <span>Ketik Jenis Kejadian Spesifik (Manual) <span className="text-red-500">*</span></span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Pohon Tumbang Menimpa Rumah / Tanggul Kali Jebol / Kekeringan"
                        value={customJenisText}
                        onChange={e => setCustomJenisText(e.target.value)}
                        className="w-full bg-red-50/70 border-2 border-red-400 focus:bg-white focus:border-red-600 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none transition shadow-sm"
                      />
                      <p className="text-[10px] text-slate-500 mt-1">
                        Tuliskan jenis kejadian bencana / gangguan spesifik yang terjadi di lokasi.
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Waktu Kejadian <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="datetime-local"
                      required
                      value={waktuKejadian}
                      onChange={e => setWaktuKejadian(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-red-500 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-slate-800 focus:outline-none transition"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Lokasi & Interactive Map Picker (Titik Lokasi) */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
                <MapPin className="w-5 h-5 text-red-600" />
                <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider">
                  3. Peta Titik Lokasi Kejadian (Kecamatan Tulis, Batang)
                </h3>
              </div>

              {/* Dropdown Pilihan Desa */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pilih Desa (Kecamatan Tulis, Batang) <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={desa}
                  onChange={e => setDesa(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-red-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-bold focus:outline-none transition shadow-sm"
                >
                  {DESA_KECAMATAN_TULIS.map(d => (
                    <option key={d} value={d}>
                      Desa {d}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  Pilih salah satu dari 17 Desa resmi di wilayah Kecamatan Tulis, Kabupaten Batang.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Alamat Lengkap / Patokan Lokasi <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: RT 02/RW 01, Desa Tulis, Kecamatan Tulis, Kabupaten Batang, Jawa Tengah"
                  value={alamat}
                  onChange={e => setAlamat(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-red-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none transition"
                />
              </div>

              {/* Warning Alert if outside Kecamatan Tulis */}
              {locationWarning && (
                <div className="bg-red-50 border-2 border-red-500/80 p-3 rounded-xl flex items-start space-x-2.5 text-red-800 animate-pulse">
                  <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div className="text-xs font-bold leading-relaxed">{locationWarning}</div>
                </div>
              )}

              {/* Map Interactive Picker Container */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs text-slate-700 font-bold">Pilih Titik Lokasi pada Peta:</span>
                    <span className="text-[10px] bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded">
                      Klik / Geser Pin 📍
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleDetectGps}
                    disabled={gettingGps}
                    className="bg-red-600 hover:bg-red-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center space-x-1 transition shadow self-start sm:self-auto"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{gettingGps ? 'Mencari GPS...' : 'Gunakan GPS Saya'}</span>
                  </button>
                </div>

                {/* Leaflet Canvas inside Form */}
                <div ref={mapContainerRef} className="w-full h-64 rounded-2xl border-2 border-slate-300 overflow-hidden shadow-inner relative z-10" />

                <p className="text-[11px] text-slate-500 italic">
                  💡 Klik area manapun di peta Kecamatan Tulis di atas atau geser pin merah 📍 untuk memindahkan kordinat lokasi kejadian secara presisi.
                </p>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Latitude (Kordinat Lintang)</span>
                    <input
                      type="number"
                      step="any"
                      value={latitude}
                      onChange={e => setLatitude(parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Longitude (Kordinat Bujur)</span>
                    <input
                      type="number"
                      step="any"
                      value={longitude}
                      onChange={e => setLongitude(parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Estimasi Korban & Dampak Kerusakan */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider">4. Estimasi Korban & Kerusakan</h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-center">
                  <span className="block text-[10px] font-bold text-slate-500 uppercase">Meninggal</span>
                  <input
                    type="number"
                    min="0"
                    value={meninggal}
                    onChange={e => setMeninggal(parseInt(e.target.value) || 0)}
                    className="w-full text-center bg-white border border-slate-300 rounded-lg p-1 text-sm font-bold mt-1"
                  />
                </div>
                <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-center">
                  <span className="block text-[10px] font-bold text-slate-500 uppercase">Luka Berat</span>
                  <input
                    type="number"
                    min="0"
                    value={lukaBerat}
                    onChange={e => setLukaBerat(parseInt(e.target.value) || 0)}
                    className="w-full text-center bg-white border border-slate-300 rounded-lg p-1 text-sm font-bold mt-1"
                  />
                </div>
                <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-center">
                  <span className="block text-[10px] font-bold text-slate-500 uppercase">Luka Ringan</span>
                  <input
                    type="number"
                    min="0"
                    value={lukaRingan}
                    onChange={e => setLukaRingan(parseInt(e.target.value) || 0)}
                    className="w-full text-center bg-white border border-slate-300 rounded-lg p-1 text-sm font-bold mt-1"
                  />
                </div>
                <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-center">
                  <span className="block text-[10px] font-bold text-slate-500 uppercase">Mengungsi</span>
                  <input
                    type="number"
                    min="0"
                    value={mengungsi}
                    onChange={e => setMengungsi(parseInt(e.target.value) || 0)}
                    className="w-full text-center bg-white border border-slate-300 rounded-lg p-1 text-sm font-bold mt-1"
                  />
                </div>
                <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-center col-span-2 sm:col-span-1">
                  <span className="block text-[10px] font-bold text-slate-500 uppercase">Rumah Rusak</span>
                  <input
                    type="number"
                    min="0"
                    value={rumahRusak}
                    onChange={e => setRumahRusak(parseInt(e.target.value) || 0)}
                    className="w-full text-center bg-white border border-slate-300 rounded-lg p-1 text-sm font-bold mt-1"
                  />
                </div>
              </div>
            </div>

            {/* 5. Unggah Foto / Video & Deskripsi */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
                <Camera className="w-5 h-5 text-red-600" />
                <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider">5. Dokumentasi Foto / Video & Kronologi</h3>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Pilih Opsi Dokumentasi Kejadian <span className="text-red-500">*</span>
                </label>

                {/* Hidden File Inputs */}
                <input
                  type="file"
                  ref={cameraInputRef}
                  accept="image/*,video/*"
                  capture="environment"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <input
                  type="file"
                  ref={galleryInputRef}
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {/* 3 Camera & File Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-3">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white p-3 rounded-2xl font-bold text-xs flex items-center justify-center space-x-2 shadow-md transition transform active:scale-95"
                  >
                    <Camera className="w-4 h-4 text-yellow-300 animate-pulse" />
                    <span>Ambil Foto/Video (Kamera HP)</span>
                  </button>

                  <button
                    type="button"
                    onClick={startWebcam}
                    className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white p-3 rounded-2xl font-bold text-xs flex items-center justify-center space-x-2 shadow-md transition transform active:scale-95"
                  >
                    <Sparkles className="w-4 h-4 text-amber-200" />
                    <span>Kamera Web (Live Photo)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 p-3 rounded-2xl font-bold text-xs flex items-center justify-center space-x-2 transition transform active:scale-95"
                  >
                    <Upload className="w-4 h-4 text-slate-600" />
                    <span>Pilih dari Galeri / File</span>
                  </button>
                </div>

                {/* Drag and Drop Zone */}
                <div
                  onClick={() => galleryInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-red-500 bg-slate-50 hover:bg-red-50/20 rounded-2xl p-4 text-center transition cursor-pointer"
                >
                  <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                  <p className="text-xs font-bold text-slate-700">Atau Klik / Tarik Foto/Video ke sini</p>
                  <p className="text-[10px] text-slate-500">Mendukung Kamera Langsung, JPG, PNG, MP4 (Maks. 20MB)</p>
                </div>

                {/* Media Preview */}
                {mediaUrl && (
                  <div className="mt-3 relative rounded-2xl overflow-hidden border-2 border-red-500/80 bg-slate-900 max-h-56 flex items-center justify-center shadow-lg">
                    {mediaType === 'video' ? (
                      <video src={mediaUrl} controls className="max-h-56 w-auto rounded" />
                    ) : (
                      <img src={mediaUrl} alt="Preview Foto Kejadian" className="max-h-56 w-auto object-contain rounded" />
                    )}
                    <button
                      type="button"
                      onClick={() => setMediaUrl('')}
                      className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-1.5 rounded-full shadow-lg transition"
                      title="Hapus Foto/Video"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-2 left-2 bg-black/70 text-emerald-400 px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center space-x-1 backdrop-blur">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Dokumentasi Berhasil Diunggah</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Live Webcam Modal Overlay */}
              {isWebcamOpen && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 max-w-lg w-full text-white space-y-4 shadow-2xl relative">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div className="flex items-center space-x-2">
                        <Camera className="w-5 h-5 text-red-500 animate-pulse" />
                        <h3 className="font-bold text-sm">Ambil Foto Kejadian via Kamera Web</h3>
                      </div>
                      <button onClick={stopWebcam} className="text-slate-400 hover:text-white p-1">
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="relative bg-black rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center aspect-video">
                      <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <button
                        type="button"
                        onClick={stopWebcam}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold text-slate-300"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={captureWebcamPhoto}
                        className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center space-x-2 shadow-lg animate-pulse"
                      >
                        <Camera className="w-4 h-4" />
                        <span>Jepret Foto Sekarang</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Deskripsi Kronologi Kejadian Lengkap
                </label>
                <textarea
                  rows={3}
                  placeholder="Uraikan kronologi singkat, penyebab, kebutuhan mendesak, atau informasi penting lainnya..."
                  value={deskripsi}
                  onChange={e => setDeskripsi(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-red-500 rounded-xl p-3 text-xs text-slate-800 focus:outline-none transition"
                ></textarea>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white py-4 rounded-2xl font-black text-sm tracking-wider uppercase shadow-xl flex items-center justify-center space-x-2 transition transform active:scale-98"
            >
              <Send className="w-5 h-5" />
              <span>{isSubmitting ? 'MENYIMPAN ADUAN...' : 'KIRIM LAPORAN ADUAN SEKARANG'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
