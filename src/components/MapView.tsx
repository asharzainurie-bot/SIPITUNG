import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  MapPin,
  Filter,
  Layers,
  AlertTriangle,
  Users,
  CheckCircle,
  Clock,
  Eye,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { Report, ReportCategory } from '../types';
import { REPORT_TYPE_LABELS, isWithinKecamatanTulis, KECAMATAN_TULIS_BOUNDS } from '../data/initialData';

interface MapViewProps {
  reports: Report[];
  onSelectReport: (report: Report) => void;
}

export const MapView: React.FC<MapViewProps> = ({ reports, onSelectReport }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const [categoryFilter, setCategoryFilter] = useState<'all' | 'bencana' | 'trantib'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedReportCard, setSelectedReportCard] = useState<Report | null>(null);

  // Filtered list
  const filteredReports = reports.filter(r => {
    if (categoryFilter !== 'all' && r.kategori !== categoryFilter) return false;
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    return true;
  });

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Focused Center: Kecamatan Tulis, Kabupaten Batang, Jawa Tengah
      const tulisBounds = L.latLngBounds(
        L.latLng(KECAMATAN_TULIS_BOUNDS.minLat, KECAMATAN_TULIS_BOUNDS.minLng),
        L.latLng(KECAMATAN_TULIS_BOUNDS.maxLat, KECAMATAN_TULIS_BOUNDS.maxLng)
      );

      const map = L.map(mapContainerRef.current, {
        center: [KECAMATAN_TULIS_BOUNDS.centerLat, KECAMATAN_TULIS_BOUNDS.centerLng],
        zoom: 13,
        minZoom: 12,
        maxBounds: tulisBounds,
        maxBoundsViscosity: 0.9,
        zoomControl: false
      });

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap | SIPITUNG Kec. Tulis Batang'
      }).addTo(map);

      // Add Zoom Control to top right
      L.control.zoom({ position: 'topright' }).addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      markersLayerRef.current = markersGroup;
      mapInstanceRef.current = map;
    }
  }, []);

  // Update Markers on filter / reports change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    filteredReports.forEach(r => {
      if (!r.latitude || !r.longitude || !isWithinKecamatanTulis(r.latitude, r.longitude)) return;

      const isBencana = r.kategori === 'bencana';
      const pinColor = isBencana ? '#dc2626' : '#d97706';

      // Custom DivIcon pin
      const customIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div style="
            background-color: ${pinColor};
            width: 32px;
            height: 32px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 4px 10px rgba(0,0,0,0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 14px;
            cursor: pointer;
            transition: transform 0.2s;
          " class="hover:scale-125">
            ${isBencana ? '🚨' : '🛡️'}
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const marker = L.marker([r.latitude, r.longitude], { icon: customIcon });

      const popupHtml = `
        <div style="font-family: sans-serif; width: 220px; text-align: left;">
          <span style="font-size: 10px; font-weight: bold; color: ${pinColor}; text-transform: uppercase;">
            ${r.ticketId} - ${r.jenisKejadian.toUpperCase()}
          </span>
          <h4 style="margin: 4px 0; font-size: 13px; font-weight: bold; color: #1e293b;">
            ${r.namaPelapor}
          </h4>
          <p style="font-size: 11px; color: #64748b; margin-bottom: 6px; line-clamp: 2;">
            📍 ${r.alamat}
          </p>
          <div style="background: #f1f5f9; padding: 4px 8px; border-radius: 6px; font-size: 10px; font-weight: bold; display: inline-block;">
            Status: ${r.status.toUpperCase()}
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);
      marker.on('click', () => {
        setSelectedReportCard(r);
      });

      markersGroup.addLayer(marker);
    });

    // Auto fit bounds if markers exist
    if (filteredReports.length > 0) {
      const bounds = L.latLngBounds(filteredReports.map(r => [r.latitude, r.longitude]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [filteredReports]);

  return (
    <div className="relative w-full h-[calc(100vh-140px)] min-h-[500px] bg-slate-900 flex flex-col">
      {/* Floating Filter Controls Bar */}
      <div className="absolute top-3 left-4 right-4 z-[400] max-w-4xl mx-auto flex flex-col gap-2">
        {/* Region Indicator Badge */}
        <div className="bg-gradient-to-r from-red-700 via-rose-700 to-amber-700 text-white px-4 py-2 rounded-xl shadow-lg flex items-center justify-between border border-red-500/50">
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-yellow-300 animate-bounce" />
            <span className="text-xs font-black tracking-wide uppercase">
              WILAYAH SEBARAN: KECAMATAN TULIS, KABUPATEN BATANG, JAWA TENGAH
            </span>
          </div>
          <span className="text-[10px] bg-black/30 font-bold px-2 py-0.5 rounded-md hidden md:inline-block">
            Desa Tulis, Simbangdesa, Posong, Beji, Kaliboyo, Kedungsegog, Jolosetti
          </span>
        </div>

        <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 p-2.5 rounded-2xl shadow-2xl text-white flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline">Filter Sebaran:</span>

            {/* Category Toggle */}
            <div className="bg-slate-950 p-1 rounded-xl flex space-x-1 border border-slate-800">
              <button
                onClick={() => setCategoryFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  categoryFilter === 'all' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Semua ({reports.length})
              </button>
              <button
                onClick={() => setCategoryFilter('bencana')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  categoryFilter === 'bencana' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                🚨 Bencana ({reports.filter(r => r.kategori === 'bencana').length})
              </button>
              <button
                onClick={() => setCategoryFilter('trantib')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  categoryFilter === 'trantib' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                🛡️ Trantibum ({reports.filter(r => r.kategori === 'trantib').length})
              </button>
            </div>
          </div>

          {/* Status Dropdown */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-200 text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-none"
          >
            <option value="all">Semua Status Aduan</option>
            <option value="pending">Pending (Verifikasi)</option>
            <option value="diproses">Dalam Penanganan TRC</option>
            <option value="selesai">Selesai Tuntas</option>
            <option value="ditolak">Ditolak</option>
          </select>
        </div>
      </div>

      {/* Leaflet Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full z-10" />

      {/* Floating Report Selected Detail Card Popup */}
      {selectedReportCard && (
        <div className="absolute bottom-6 left-4 right-4 z-[400] max-w-lg mx-auto bg-slate-900 border border-slate-700 text-white p-5 rounded-3xl shadow-2xl flex flex-col sm:flex-row gap-4 items-start animate-fade-in">
          <img
            src={selectedReportCard.mediaUrl}
            alt="Foto Kejadian"
            className="w-full sm:w-28 h-28 object-cover rounded-2xl border border-slate-700 shrink-0"
          />
          <div className="flex-1 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-mono text-amber-400 font-bold">{selectedReportCard.ticketId}</span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  selectedReportCard.status === 'selesai'
                    ? 'bg-emerald-600'
                    : selectedReportCard.status === 'diproses'
                    ? 'bg-blue-600'
                    : 'bg-amber-600'
                }`}
              >
                {selectedReportCard.status}
              </span>
            </div>

            <h4 className="text-sm font-bold text-white uppercase">{selectedReportCard.jenisKejadian}</h4>
            <p className="text-slate-300 line-clamp-1">📍 {selectedReportCard.alamat}</p>
            <p className="text-slate-400 text-[11px]">
              Pelapor: <strong>{selectedReportCard.namaPelapor}</strong> ({selectedReportCard.noWhatsapp})
            </p>

            <div className="pt-2 flex items-center space-x-2">
              <button
                onClick={() => onSelectReport(selectedReportCard)}
                className="bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded-xl font-bold text-[11px] flex items-center space-x-1"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Lihat Detail Laporan</span>
              </button>
              <button
                onClick={() => setSelectedReportCard(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-xl font-bold text-[11px]"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
