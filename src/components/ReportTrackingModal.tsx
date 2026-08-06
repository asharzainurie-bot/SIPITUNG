import React, { useState, useEffect } from 'react';
import {
  Search,
  CheckCircle,
  Clock,
  MapPin,
  Phone,
  MessageSquare,
  FileText,
  Printer,
  ShieldCheck,
  UserCheck,
  X,
  AlertCircle
} from 'lucide-react';
import { Report } from '../types';
import { printSingleReportPDF } from '../utils/exporter';

interface ReportTrackingModalProps {
  initialTicketId?: string;
}

export const ReportTrackingModal: React.FC<ReportTrackingModalProps> = ({ initialTicketId = '' }) => {
  const [ticketInput, setTicketInput] = useState(initialTicketId);
  const [searchedReport, setSearchedReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialTicketId) {
      setTicketInput(initialTicketId);
      handleSearchTicket(initialTicketId);
    }
  }, [initialTicketId]);

  const handleSearchTicket = async (ticketToSearch?: string) => {
    const query = (ticketToSearch || ticketInput).trim();
    if (!query) return;

    setLoading(true);
    setErrorMsg(null);
    setSearchedReport(null);

    try {
      const res = await fetch(`/api/reports/${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.success && data.report) {
        setSearchedReport(data.report);
      } else {
        setErrorMsg(`Nomor Ticket "${query}" tidak ditemukan dalam sistem Posko.`);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Gagal terhubung ke pelacak posko.');
    } finally {
      setLoading(false);
    }
  };

  const statusSteps = [
    { key: 'pending', label: '1. Terkirim', desc: 'Aduan diterima di sistem Posko' },
    { key: 'verifikasi', label: '2. Verifikasi Berkas', desc: 'Diverifikasi oleh admin piket' },
    { key: 'diproses', label: '3. Penanganan Tim', desc: 'TRC BPBD / Satpol PP diterjunkan' },
    { key: 'selesai', label: '4. Selesai Ditangani', desc: 'Penanganan tuntas di lapangan' }
  ];

  const getStepStatusIndex = (status: string) => {
    switch (status) {
      case 'pending':
        return 0;
      case 'verifikasi':
        return 1;
      case 'diproses':
        return 2;
      case 'selesai':
        return 3;
      case 'ditolak':
        return -1;
      default:
        return 0;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Search Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-red-950 p-6 text-white">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-red-600/30 rounded-2xl border border-red-500/30">
              <Search className="w-7 h-7 text-amber-300" />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight">PELACAKAN ADUAN REAL-TIME</h2>
              <p className="text-xs text-slate-300">Masukkan ID Tiket Aduan (Contoh: SPT-2026-0805-001)</p>
            </div>
          </div>

          <form
            onSubmit={e => {
              e.preventDefault();
              handleSearchTicket();
            }}
            className="flex gap-2"
          >
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Masukkan Nomor Tiket (misal: SPT-2026-0805-001)"
                value={ticketInput}
                onChange={e => setTicketInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-amber-300 font-mono font-bold px-4 py-3 rounded-2xl text-sm focus:outline-none focus:border-red-500 uppercase tracking-wider"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-red-600 hover:bg-red-500 text-white font-bold px-6 py-3 rounded-2xl text-xs uppercase tracking-wider transition shadow-lg shrink-0 flex items-center space-x-1.5"
            >
              <Search className="w-4 h-4" />
              <span>{loading ? 'Mencari...' : 'Lacak'}</span>
            </button>
          </form>
        </div>

        {/* Content Body */}
        <div className="p-6 md:p-8 space-y-6">
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-2xl text-xs flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {!searchedReport && !errorMsg && (
            <div className="text-center py-12 text-slate-400 space-y-3">
              <Search className="w-12 h-12 mx-auto text-slate-300" />
              <p className="text-xs">Silakan ketikkan ID Tiket Aduan Anda pada kolom di atas untuk melacak perkembangan posko.</p>
            </div>
          )}

          {searchedReport && (
            <div className="space-y-6">
              {/* Ticket ID & Print Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 border border-slate-200 p-4 rounded-2xl">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">ID TIKET ADUAN:</span>
                  <h3 className="text-xl font-mono font-black text-red-600">{searchedReport.ticketId}</h3>
                  <p className="text-[11px] text-slate-500">
                    Waktu Lapor: {new Date(searchedReport.createdAt).toLocaleString('id-ID')}
                  </p>
                </div>
                <button
                  onClick={() => printSingleReportPDF(searchedReport)}
                  className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-2 transition self-start sm:self-auto"
                >
                  <Printer className="w-4 h-4 text-amber-400" />
                  <span>Cetak Tanda Bukti PDF</span>
                </button>
              </div>

              {/* Progress Timeline */}
              {searchedReport.status === 'ditolak' ? (
                <div className="bg-red-100 border border-red-300 p-4 rounded-2xl text-red-800 text-xs font-bold">
                  ⚠️ Status Aduan Ditolak / Dibatalkan Posko. Catatan: {searchedReport.catatanPetugas}
                </div>
              ) : (
                <div className="bg-slate-900 text-white p-6 rounded-3xl space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span>ALUR STATUS PROSES PENANGANAN</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    {statusSteps.map((step, idx) => {
                      const currentIdx = getStepStatusIndex(searchedReport.status);
                      const isDone = currentIdx >= idx;
                      const isCurrent = currentIdx === idx;

                      return (
                        <div
                          key={step.key}
                          className={`p-3 rounded-2xl border transition ${
                            isCurrent
                              ? 'bg-red-600 border-red-400 text-white shadow-lg'
                              : isDone
                              ? 'bg-slate-800 border-emerald-500/50 text-emerald-300'
                              : 'bg-slate-950 border-slate-800 text-slate-500'
                          }`}
                        >
                          <div className="flex items-center space-x-1.5 font-bold text-xs">
                            {isDone ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Clock className="w-4 h-4" />}
                            <span>{step.label}</span>
                          </div>
                          <p className="text-[10px] mt-1 opacity-80">{step.desc}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Detail Card */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Left Info */}
                <div className="space-y-4 text-xs text-slate-700">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex justify-between">
                      <span className="font-bold text-slate-500">Pelapor:</span>
                      <strong className="text-slate-900">{searchedReport.namaPelapor}</strong>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-500">No. WhatsApp:</span>
                      <a
                        href={`https://wa.me/62${searchedReport.noWhatsapp.replace(/^0/, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-2.5 py-1 rounded-lg text-[10px] flex items-center space-x-1"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>{searchedReport.noWhatsapp}</span>
                      </a>
                    </div>

                    <div className="flex justify-between">
                      <span className="font-bold text-slate-500">Jenis Kejadian:</span>
                      <strong className="text-red-600 uppercase">{searchedReport.jenisKejadian}</strong>
                    </div>

                    <div className="flex justify-between">
                      <span className="font-bold text-slate-500">Waktu Kejadian:</span>
                      <span>{searchedReport.waktuKejadian}</span>
                    </div>

                    {searchedReport.desa && (
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-500">Desa (Kec. Tulis):</span>
                        <strong className="text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded text-[11px] font-bold border border-emerald-300">
                          Desa {searchedReport.desa}
                        </strong>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <span className="font-bold text-slate-500">Alamat Kejadian:</span>
                      <span className="text-right max-w-[200px]">{searchedReport.alamat}</span>
                    </div>
                  </div>

                  {/* Catatan Officer */}
                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl space-y-1">
                    <span className="font-bold text-amber-900 flex items-center space-x-1 text-xs">
                      <UserCheck className="w-4 h-4 text-amber-700" />
                      <span>Petugas Penanggung Jawab:</span>
                    </span>
                    <p className="font-bold text-slate-800">{searchedReport.petugasAssigned || 'Pusdalops Tim TRC'}</p>
                    <p className="text-[11px] text-slate-600 pt-1 border-t border-amber-200/60">
                      <strong>Catatan Petugas:</strong> {searchedReport.catatanPetugas || 'Dalam proses penanganan.'}
                    </p>
                  </div>
                </div>

                {/* Right Media Photo */}
                <div className="space-y-3">
                  <span className="text-xs font-bold text-slate-700 block">Foto / Video Kejadian Terlampir:</span>
                  <div className="rounded-2xl overflow-hidden border border-slate-300 bg-slate-900 max-h-64 flex items-center justify-center">
                    {searchedReport.mediaType === 'video' ? (
                      <video src={searchedReport.mediaUrl} controls className="max-h-64 w-auto rounded" />
                    ) : (
                      <img src={searchedReport.mediaUrl} alt="Foto Kejadian" className="max-h-64 w-full object-cover" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 italic">
                    Kronologi: {searchedReport.deskripsi || 'Tidak ada uraian kronologi tambahan.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
