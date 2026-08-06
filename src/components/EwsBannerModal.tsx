import React from 'react';
import { Bell, AlertTriangle, ShieldAlert, X, Calendar, MapPin, CheckCircle2 } from 'lucide-react';
import { EWSNotice } from '../types';

interface EwsBannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  ewsNotice: EWSNotice;
}

export const EwsBannerModal: React.FC<EwsBannerModalProps> = ({ isOpen, onClose, ewsNotice }) => {
  if (!isOpen || !ewsNotice) return null;

  const levelColor = {
    waspada: 'bg-yellow-500 border-yellow-400 text-yellow-950',
    siaga: 'bg-amber-600 border-amber-500 text-white',
    awas: 'bg-red-700 border-red-500 text-white',
    info: 'bg-blue-600 border-blue-400 text-white'
  }[ewsNotice.level] || 'bg-red-600 border-red-500 text-white';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden text-white my-auto">
        {/* Header */}
        <div className={`p-5 flex items-center justify-between border-b ${levelColor}`}>
          <div className="flex items-center space-x-3">
            <Bell className="w-8 h-8 animate-bounce" />
            <div>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-black/30 tracking-widest">
                PERINGATAN DINI (EWS) - LEVEL {ewsNotice.level.toUpperCase()}
              </span>
              <h3 className="text-lg font-black leading-tight mt-0.5">{ewsNotice.title}</h3>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-black/20 rounded-xl transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs text-slate-200">
          <div className="flex items-center justify-between bg-slate-800 p-3 rounded-xl border border-slate-700">
            <span className="flex items-center space-x-1.5 text-slate-300">
              <Calendar className="w-4 h-4 text-amber-400" />
              <span>Tanggal Rilis:</span>
            </span>
            <strong className="text-white">{ewsNotice.date}</strong>
          </div>

          <div className="flex items-center justify-between bg-slate-800 p-3 rounded-xl border border-slate-700">
            <span className="flex items-center space-x-1.5 text-slate-300">
              <MapPin className="w-4 h-4 text-red-400" />
              <span>Cakupan Wilayah:</span>
            </span>
            <strong className="text-amber-300">{ewsNotice.area}</strong>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
            <p className="font-bold text-amber-400 uppercase text-[11px] tracking-wider">Detail Pesan Himbauan BMKG / Pemda:</p>
            <p className="text-slate-300 leading-relaxed">{ewsNotice.message}</p>
          </div>

          <div className="bg-red-950/60 border border-red-500/30 p-4 rounded-2xl space-y-2">
            <p className="font-bold text-red-300 flex items-center space-x-1">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span>Langkah Antisipasi Warga:</span>
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-300">
              <li>Amankan dokumen penting dan barang berharga di tempat aman & tinggi.</li>
              <li>Periksa saluran air dan sistem kelistrikan rumah.</li>
              <li>Pantau perkembangan debit air sungai atau info BMKG terkini.</li>
              <li>Segera melapor atau gunakan Tombol SOS SIPITUNG jika butuh bantuan perahu/evakuasi.</li>
            </ul>
          </div>

          <button
            onClick={onClose}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl text-xs transition border border-slate-700"
          >
            SAYA MENGERTI & SIAP SIAGA
          </button>
        </div>
      </div>
    </div>
  );
};
